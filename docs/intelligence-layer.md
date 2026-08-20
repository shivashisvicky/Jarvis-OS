# JARVIS Intelligence Layer

The Intelligence Layer sits above deterministic JARVIS commands and below the UI. It is an optional provider-backed capability, not a replacement for the local command core.

## Runtime contract

```text
voice / text
    ↓
local command router
    ↓
known deterministic action? ── yes → Maps / Notes / Media / Games / etc.
    │
    no
    ↓
Intelligence Runtime
    ↓
OpenAI Responses API gateway
    ↓
model + web search
    ↓
JARVIS reply
```

## Security boundary

The browser never receives `OPENAI_API_KEY`. The serverless endpoint reads the secret from its server environment and calls the OpenAI Responses API. The Pages shell only knows the gateway URL.

## Gateway

`api/openai-intelligence.js` expects `OPENAI_API_KEY` and optionally `OPENAI_MODEL`. The default model is `gpt-5.6-luna`. It accepts a POST body containing `{ "query": "..." }` and returns `{ "text": "...", "model": "..." }`.

The gateway enables OpenAI web search for questions that need current information. The OpenAI Responses API is the current API surface for model responses and tool workflows.

## GitHub Pages note

GitHub Pages serves the static JARVIS shell and does not execute the `/api` serverless function. The gateway therefore requires a serverless deployment target that exposes the same `/api/openai-intelligence` route, or the `jarvis-intelligence-endpoint` meta tag must be pointed at an equivalent backend.

Until that backend is connected, the client fails gracefully and the deterministic JARVIS command core remains fully usable.

## First intended experiences

- `Find me the best Oggy episodes about Halloween.`
- `What's happening in AI today? Give me the three things I actually need to know.`
- `Compare the latest OpenAI and Google AI announcements.`
- `Explain this error and tell me what I should try next.`

The Intelligence Layer should rank, synthesize and explain. Specialized providers remain responsible for raw media, maps, news and other domain-specific retrieval.
