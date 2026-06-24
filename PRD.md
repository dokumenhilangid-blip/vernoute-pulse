# Vernoute Pulse — PRD

## 1. Product Overview

**Product Name:** Vernoute Pulse
**Vision:** Real-time analytics & intelligence layer for the x402 AI agent economy on Base
**Tagline:** "The Bloomberg Terminal for AI Agent Economy"
**Builder:** Bara (@yourhandle)

## 2. Problem Statement

The x402 ecosystem has:
- 30,000+ listed endpoints
- 5,523 verified working endpoints
- 480,000+ active AI agents
- $50M+ total transaction volume

But **nobody can see what's happening right now**:
- Which services are earning the most?
- How many agents are transacting?
- What's the total volume today?
- Which services are trending up?
- No real-time visibility into the agent economy

## 3. Solution

A real-time analytics dashboard + API that tracks the x402 ecosystem:
- Service rankings by volume, requests, growth
- Agent spending patterns and activity
- Live transaction feed
- Historical trends and charts
- Price/performance comparisons
- All accessible via API (free + x402-paid tiers)

## 4. Target Users

| User | Need | Why They Pay |
|------|------|-------------|
| **Agent builders** | Find reliable, affordable services | Optimize agent costs |
| **Service providers** | Track competitors, find gaps | Improve positioning |
| **Investors** | Understand ecosystem growth | Investment decisions |
| **Researchers** | Market data and trends | Reports and analysis |

## 5. Features (MVP)

### 5.1 Public Dashboard (Free)
- Total ecosystem volume (today, this week, all-time)
- Active agents count
- Top 10 services by volume
- Top 10 services by growth rate
- Recent transactions feed (last 50)
- Service categories breakdown

### 5.2 Service Pages (Free)
- Service name, description, category
- Pricing ($/request)
- Uptime %
- Latency p95
- Total requests handled
- Total volume earned
- Number of unique agents using it
- 7-day trend chart

### 5.3 API (Free + Paid)
- `GET /v1/pulse/overview` — ecosystem stats (free)
- `GET /v1/pulse/services` — list all services with analytics (free)
- `GET /v1/pulse/services/:id` — single service detail (free)
- `GET /v1/pulse/agents/:address` — agent spending analytics ($0.01)
- `GET /v1/pulse/transactions` — transaction feed ($0.005)
- `GET /v1/pulse/trends` — historical trends ($0.01)

## 6. Data Sources

| Source | Data | Method |
|--------|------|--------|
| agentic.market API | Service listings, endpoints, pricing | Public API |
| x402scan | Service directory | Web scraping |
| Base blockchain | Transaction data, settlement events | RPC/viem |
| Decixa | Service health and quality | Public API |
| Manual probes | Latency, uptime | Scheduled pings |

## 7. Monetization

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | Public dashboard + basic API |
| **API Pro** | $0.01/query via x402 | Detailed agent/service analytics |
| **Enterprise** | TBD | Custom alerts, webhooks, private instance |

## 8. Technical Stack

| Component | Tech |
|-----------|------|
| Backend | Node.js + Express |
| Storage | SQLite / Turso (edge DB) |
| Hosting | Vercel / Railway (free tier) |
| Payments | x402 protocol via CDP |
| Data collection | Cron jobs + viem (eth) |
| AI models | Nara/ZenMux/OpenCode (free) |
| CI/CD | GitHub Actions |

## 9. Milestones

| Week | Deliverable |
|------|------------|
| Week 1 | Data collection engine + storage |
| Week 2 | Core API endpoints |
| Week 3 | Public dashboard (minimal) |
| Week 4 | x402 payment integration + launch |
| Week 5 | Post on X, apply Base Builder Rewards |

## 10. Success Metrics

- 100+ unique agents tracked
- 10+ service pages populated
- $50+ revenue from API tier
- Featured on agentic.market
- 50+ X post engagements
- Apply + get Base Builder Rewards
