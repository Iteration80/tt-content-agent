# Thread + Time Content Agent

Cloudflare Worker that claims submitted intake rows and moves them to review.

This first deployable version is a pass-through processor: it reuses the real uploaded R2 photo URLs as `processed_photos`, generates schema-valid preliminary listing JSON deterministically, and sets `status='needs_approval'`. It is deliberately shaped so Nano Banana image processing and the Sonnet listing pass can replace the deterministic generator without changing the intake/review D1 contract.

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

The Pages app should include this service binding in `wrangler.jsonc`:

```json
{
  "services": [{ "binding": "CONTENT_AGENT", "service": "tt-content-agent" }]
}
```
