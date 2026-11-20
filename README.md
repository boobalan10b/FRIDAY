# FRIDAY AI 5.0 — Maximum Free Edition

A free-first Node.js web app with a responsive chat interface and server-side web search.

## Features in this starter build

- Responsive dark interface
- English and Tamil response-language selection
- Smart Search using DuckDuckGo HTML results
- Search results with clickable source links
- Optional AI chat through an OpenAI-compatible provider endpoint
- Browser speech recognition where supported
- No paid API is required for the search endpoint

## Important limitations

"Unlimited free AI" cannot be guaranteed. Free AI providers, search engines, hosting services, and browsers may impose quotas, rate limits, availability limits, or terms of use. This project does not bypass those limits.

The file upload control is currently a UI placeholder; PDF/image analysis is not implemented yet. Deep Research currently gathers search snippets and links; it is not an autonomous verified research agent.

## Run locally

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000

Search works without an AI key. For AI chat, add a provider key to `.env`:

```env
AI_PROVIDER=groq
AI_API_KEY=your_private_key
AI_MODEL=llama-3.3-70b-versatile
PORT=3000
```

Never put API keys in `public/app.js`, `public/index.html`, or any public GitHub file. Never commit `.env`.

Supported provider presets in this starter: `groq`, `openrouter`, `together`. Check each provider's current free-tier availability, model names, and terms before use.

## Deploy on Render

1. Push this project to a GitHub repository.
2. In Render, choose **New + → Web Service** and connect that repository.
3. Runtime: Node. Build command: `npm install`. Start command: `npm start`.
4. Add `AI_PROVIDER`, `AI_API_KEY`, and `AI_MODEL` as Render environment variables if using AI chat. Keep secrets in Render's environment settings.
5. Deploy. Render assigns a public URL.

Free hosting availability and sleep/usage limits can change. Search may also be rate-limited by its upstream provider.

## GitHub file layout

```text
friday-ai-5/
  public/
    index.html
    style.css
    app.js
  server.js
  package.json
  .env.example
  .gitignore
  README.md
```
