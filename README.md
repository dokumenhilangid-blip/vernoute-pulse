# Vernoute Pulse 📊

**Real-time analytics for the x402 AI agent economy on Base.**

Track services, latency, uptime & pricing. Built entirely from **Termux** on Android — no laptop needed.

## Live

👉 **[vernoute-pulse.dokumenhilang-id.workers.dev](https://vernoute-pulse.dokumenhilang-id.workers.dev)**

## Quick Start

```bash
git clone https://github.com/dokumenhilangid-blip/vernoute-pulse.git
cd vernoute-pulse
npm install
```

## API Endpoints

### Free (no payment required)

```
GET /v1/pulse/overview      → Ecosystem overview
GET /v1/pulse/services      → All services with analytics
GET /v1/pulse/services/:id  → Single service detail + 7-day trend
```

### Example

```bash
curl https://vernoute-pulse.dokumenhilang-id.workers.dev/v1/pulse/overview

→ {
    "total_services": 68,
    "active_services": 68,
    "total_volume_24h": 0,
    "total_requests_24h": 0,
    "top_services": [...],
    "timestamp": "..."
  }
```

## Data Sources

| Source | Data | Update |
|--------|------|--------|
| [Agentic Market](https://agentic.market) | Service listings, pricing, endpoints | Every 6 hours |
| Service health probes | Latency, uptime, errors | Every 30 minutes |

## Stack

```
Runtime:   Cloudflare Workers (Hono framework)
Storage:   Cloudflare KV
CDN:       Cloudflare Edge Cache
Frontend:  Pure CSS + Vanilla JS (zero dependencies)
Builder:   Built on Termux (Android), no laptop needed
```

## Deploy

```bash
# 1. Install dependencies
npm install

# 2. Bundle
npx esbuild src/index.js --bundle --format=esm --outfile=worker-bundle.mjs --target=es2022 --minify-syntax

# 3. Deploy via Cloudflare API
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/workers/scripts/vernoute-pulse" \
  -H "Authorization: Bearer $CF_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "metadata={\"main_module\":\"worker-bundle.mjs\",\"bindings\":[{\"name\":\"VERNOUTE_KV\",\"type\":\"kv_namespace\",\"namespace_id\":\"$KV_NS_ID\"}],\"compatibility_date\":\"2025-04-01\"}" \
  -F "worker-bundle.mjs=@worker-bundle.mjs;type=application/javascript+module"
```

## Roadmap

- [x] Service discovery from Agentic Market API
- [x] REST API with overview + services endpoints
- [x] Service health probing
- [x] 7-day trend tracking
- [x] Pure CSS landing page (zero JS/CDN deps)
- [x] Edge caching (Cloudflare Cache API)
- [ ] x402 payment integration for paid API tier
- [ ] Agent spending analytics
- [ ] Transaction feed
- [ ] Historical trends & charts
- [ ] R2-based historical data

## Built By

**Bara** — HSE Firewatcher → AI Builder → Web3 Builder
Built from Termux on Android. Mobile-first. No laptop.

```
https://github.com/dokumenhilangid-blip/vernoute-pulse
```

## License

MIT
