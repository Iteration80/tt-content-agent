# Thread + Time Content Agent

Cloudflare Worker that claims submitted intake rows and moves them to review.

This deployable version runs deterministic photo QA and, when configured, an AI listing pass. It reuses the real uploaded R2 photo URLs as `processed_photos`, checks uploaded photo slot coverage, asks the listing model for schema-constrained title/description/tag/color suggestions, and sets `status='needs_approval'`. If the AI key is missing or the call fails, it still produces a deterministic fallback listing so the intake/review flow stays usable.

## Commands

```bash
npm run typecheck
npm run dev
npm run deploy
```

The Worker has two entry points:

- `scheduled`: cron polls remote D1 every minute for the oldest `status='submitted'` item.
- `POST /process`: internal service-binding trigger from the Pages app. Body may include `{ "sku": "TT-YYMMDD-NNN" }`.

The Worker is deployed with `workers_dev = false`, so it is not intended to be called through the account-level `*.workers.dev` domain. Pages binds it internally as `CONTENT_AGENT`.

Set `TT_CONTENT_AGENT_TRIGGER_TOKEN` as a Worker secret and as a Pages secret before using the internal trigger:

```bash
npx wrangler secret put TT_CONTENT_AGENT_TRIGGER_TOKEN
npx wrangler pages secret put TT_CONTENT_AGENT_TRIGGER_TOKEN --project-name tt-intake --env preview
```

Set `OPENAI_API_KEY` to enable the AI listing pass. `TT_LISTING_AI_MODEL` is optional and defaults to `gpt-5.4-mini`; `TT_LISTING_AI_TIMEOUT_MS` is optional and defaults to `20000`.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put TT_LISTING_AI_MODEL
```

The Pages app should include this service binding in `wrangler.jsonc`:

```json
{
  "services": [{ "binding": "CONTENT_AGENT", "service": "tt-content-agent" }]
}
```
