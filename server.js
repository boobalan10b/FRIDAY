require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 40 }));

const clean = (value, max = 500) =>
  String(value || "").replace(/[<>]/g, "").trim().slice(0, max);

async function searchDuckDuckGo(query) {
  const url = "https://html.duckduckgo.com/html/?q=" + encodeURIComponent(query);
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 FRIDAY-AI/5.0" },
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error("Search provider unavailable");
  const html = await response.text();
  const $ = cheerio.load(html);
  const results = [];
  $(".result").each((_, el) => {
    const title = $(el).find(".result__title").text().trim();
    const rawUrl = $(el).find(".result__url").attr("href") ||
      $(el).find(".result__a").attr("href");
    const snippet = $(el).find(".result__snippet").text().trim();
    if (title && rawUrl && results.length < 8) {
      let link = rawUrl;
      try {
        const parsed = new URL(rawUrl, "https://duckduckgo.com");
        const redirected = parsed.searchParams.get("uddg");
        if (redirected) link = decodeURIComponent(redirected);
      } catch {}
      if (/^https?:\/\//i.test(link)) results.push({ title, url: link, snippet });
    }
  });
  return results;
}

app.get("/api/search", async (req, res) => {
  const query = clean(req.query.q, 180);
  if (!query) return res.status(400).json({ error: "Enter a search question." });
  try {
    const results = await searchDuckDuckGo(query);
    res.json({ query, results, provider: "DuckDuckGo HTML" });
  } catch (error) {
    res.status(502).json({
      error: "Search is temporarily unavailable. Please try again.",
      results: []
    });
  }
});

app.post("/api/chat", async (req, res) => {
  const message = clean(req.body.message, 4000);
  const language = req.body.language === "ta" ? "Tamil" : "English";
  if (!message) return res.status(400).json({ error: "Please enter a message." });

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    return res.json({
      reply: "FRIDAY AI is ready, but an AI provider key has not been configured. Add a free-tier provider key to the private .env file (AI_API_KEY), then restart the server. You can use Smart Search without an AI key.",
      mode: "setup"
    });
  }

  const provider = (process.env.AI_PROVIDER || "groq").toLowerCase();
  const endpoints = {
    groq: "https://api.groq.com/openai/v1/chat/completions",
    openrouter: "https://openrouter.ai/api/v1/chat/completions",
    together: "https://api.together.xyz/v1/chat/completions"
  };
  const endpoint = endpoints[provider];
  if (!endpoint) return res.status(400).json({ error: "Unsupported AI_PROVIDER. Use groq, openrouter, or together." });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are FRIDAY AI 5.0, a helpful assistant. Reply in ${language}. Be accurate, explain uncertainty, and never claim to have searched the web unless search results were supplied.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.6
      }),
      signal: AbortSignal.timeout(30000)
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "The AI provider rejected the request. Check your key, model, and provider quota."
      });
    }
    res.json({
      reply: data.choices?.[0]?.message?.content || "No response received.",
      mode: provider
    });
  } catch (error) {
    res.status(502).json({ error: "Could not reach the AI provider. Try again shortly." });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "FRIDAY AI 5.0" }));

app.listen(PORT, () => console.log(`FRIDAY AI 5.0 running on port ${PORT}`));
