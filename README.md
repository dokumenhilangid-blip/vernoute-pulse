# Vernoute Pulse 📊

**Real-time analytics for the x402 AI agent economy on Base.**

Vernoute Pulse tracks the x402 ecosystem — services, agents, volume, and trends. Built entirely from Termux on a mobile phone, no laptop needed.

## Quick Start

```bash
git clone https://github.com/dokumenhilangid-blip/vernoute-pulse.git
cd vernoute-pulse
npm install
npm start
```

Then hit `http://localhost:3000` in your browser.

## API Endpoints

### Free (no payment required)

```
GET /v1/pulse/overview      → Ecosystem overview
GET /v1/pulse/services      → All services with analytics
GET /v1/pulse/services/:id  → Single service detail + 7-day trend
```

### Paid (via x402 — coming soon)

```
POST /v1/pulse/agent/:address     → Agent spending analytics ($0.01)
POST /v1/pulse/transactions       → Transaction feed ($0.005)
POST /v1/pulse/trends             → Historical trends ($0.01)
```

## Example

```bash
curl https://vernoute-pulse.railway.app/v1/pulse/overview

→ {
    "total_services": 50,
    "active_services": 50,
    "total_volume_24h": 847231,
    "total_requests_24h": 142445,
    "top_services": [...],
    "timestamp": "2026-06-24T12:00:00Z"
  }
```

## Data Sources

| Source | Data | Update |
|--------|------|--------|
| [Agentic Market](https://agentic.market) | Service listings, pricing, endpoints | Every 6 hours |
| Service health probes | Latency, uptime, errors | Every 30 minutes |
| Base blockchain (future) | Transaction volume, agent activity | Real-time |

## Stack

```
Runtime:   Node.js + Express
Storage:   JSON files (portable, works on Android/Termux)
Hosting:   Ready for Railway / Vercel / any Node.js host
Payments:  x402 protocol via CDP (coming for paid tier)
Builder:   Built on Termux, no laptop needed
```

## Deploy

### Railway (recommended — free tier)

1. Push this repo to GitHub
2. Login to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub repo
4. Set env: `PORT=3000`
5. Done

### Locally

```bash
npm start
```

## Roadmap

- [x] Service discovery from Agentic Market API
- [x] REST API with overview + services endpoints
- [x] Service health probing
- [x] 7-day trend tracking
- [ ] x402 payment integration for paid API tier
- [ ] Agent spending analytics
- [ ] Transaction feed
- [ ] Historical trends & charts
- [ ] UI dashboard with real-time charts

## Built By

**Bara** — HSE Firewatcher → AI Builder → Web3 Builder
Built from Termux on Android. Mobile-first. No laptop.

```
https://github.com/dokumenhilangid-blip/vernoute-pulse
```

## License

MIT
