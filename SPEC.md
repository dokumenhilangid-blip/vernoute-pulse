# Vernoute Pulse — Technical Specification

## 1. Architecture

```
┌─────────────────────────────────────────────────┐
│                   Data Sources                    │
│  agentic.market  │  x402scan  │  Base Chain      │
│  Decixa          │  Probes    │                   │
└────────┬─────────┴────┬──────┴────────┬──────────┘
         │              │               │
         ▼              ▼               ▼
┌─────────────────────────────────────────────────┐
│              Data Collection Layer                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ Agent    │  │ Scanner  │  │ Chain Indexer │   │
│  │ Market   │  │          │  │               │   │
│  │ Client   │  │          │  │               │   │
│  └──────────┘  └──────────┘  └───────────────┘   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                 Storage Layer                     │
│  ┌─────────────────────────────────────────┐     │
│  │          SQLite Database                 │     │
│  │  services │ agents │ transactions        │     │
│  │  daily_stats │ categories               │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  API Layer                        │
│  ┌─────────────────────────────────────────┐     │
│  │        Express REST API                  │     │
│  │  /v1/pulse/*                            │     │
│  │  x402 payment middleware                │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               Frontend (optional)                │
│  Minimal HTML dashboard served from API          │
└─────────────────────────────────────────────────┘
```

## 2. Data Model

### 2.1 Services Table

```sql
CREATE TABLE services (
  id TEXT PRIMARY KEY,                -- e.g. "exa", "base-gas-x402"
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,                      -- "search", "ai", "crypto", "data"
  provider TEXT,                      -- owner/provider name
  base_url TEXT,
  pricing_amount REAL,                -- USD cost per request
  pricing_currency TEXT DEFAULT 'USDC',
  networks TEXT,                      -- JSON array ["base", "solana"]
  status TEXT DEFAULT 'active',       -- active, inactive, dead
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### 2.2 Daily Stats Table

```sql
CREATE TABLE daily_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  date TEXT NOT NULL,                  -- "2026-06-24"
  total_requests INTEGER DEFAULT 0,
  total_volume REAL DEFAULT 0,         -- USDC
  unique_agents INTEGER DEFAULT 0,
  avg_latency_ms REAL,
  uptime_pct REAL,
  errors INTEGER DEFAULT 0,
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE(service_id, date)
);
```

### 2.3 Agents Table

```sql
CREATE TABLE agents (
  address TEXT PRIMARY KEY,            -- wallet address (0x...)
  first_seen TEXT DEFAULT (datetime('now')),
  last_seen TEXT DEFAULT (datetime('now')),
  total_spent REAL DEFAULT 0,
  total_requests INTEGER DEFAULT 0,
  services_used TEXT                   -- JSON array of service IDs
);
```

### 2.4 Transactions Table

```sql
CREATE TABLE transactions (
  hash TEXT PRIMARY KEY,               -- transaction hash
  service_id TEXT,
  agent_address TEXT,
  amount REAL,                         -- USDC amount
  timestamp TEXT,
  status TEXT DEFAULT 'confirmed',     -- pending, confirmed, failed
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (agent_address) REFERENCES agents(address)
);
```

### 2.5 Hourly Ecosystem Snapshot

```sql
CREATE TABLE ecosystem_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  total_services INTEGER,
  active_services INTEGER,
  total_agents INTEGER,
  total_volume_24h REAL,
  total_requests_24h INTEGER,
  avg_latency_ms REAL,
  top_service_id TEXT
);
```

## 3. API Endpoints

### 3.1 Public Endpoints (No payment required)

```
GET /v1/pulse/overview
→ {
    "total_services": 523,
    "active_services": 487,
    "total_agents": 481293,
    "total_volume_24h": 847231.50,
    "total_requests_24h": 142445,
    "avg_latency_ms": 234,
    "top_services": [
      {"id": "exa", "name": "Exa", "volume_24h": 23412, "requests_24h": 12341}
    ],
    "timestamp": "2026-06-24T12:00:00Z"
  }

GET /v1/pulse/services
→ { "services": [
    {"id": "...", "name": "...", "category": "...", "pricing": 0.001, 
     "volume_24h": 1000, "requests_24h": 5000, "uptime": 99.5}
  ]}

GET /v1/pulse/services/:id
→ { "id": "exa", "name": "Exa", "description": "...", 
    "pricing": 0.001, "volume_24h": 23412,
    "requests_24h": 12341, "unique_agents": 847,
    "uptime_7d": 99.8, "latency_p95": 187,
    "trend_7d": [{"date": "...", "volume": 1000}, ...]
  }
```

### 3.2 Paid Endpoints (x402 payment required)

```
POST /v1/pulse/agent/{address}
Headers: X-PAYMENT: <payment_proof>
→ {
    "address": "0x...",
    "total_spent": 1234.56,
    "total_requests": 12847,
    "top_services_used": [...],
    "spending_by_day": [...],
    "first_seen": "...",
    "last_active": "..."
  }
Cost: $0.01 USDC

POST /v1/pulse/transactions
Headers: X-PAYMENT: <payment_proof>
Body: { "limit": 50, "offset": 0, "service_id": "optional" }
→ {
    "transactions": [...],
    "total": 1000
  }
Cost: $0.005 USDC

POST /v1/pulse/trends
Headers: X-PAYMENT: <payment_proof>
Body: { "service_id": "exa", "days": 30 }
→ {
    "service_id": "exa",
    "daily_stats": [...],
    "growth_rate": 0.15,
    "avg_daily_volume": 1000
  }
Cost: $0.01 USDC
```

## 4. Data Collection Strategy

### 4.1 Agentic Market Scanner
- Fetch `https://api.agentic.market/v1/services` every 6 hours
- Parse services list, update database
- Store pricing, endpoints, descriptions

### 4.2 Service Probes
- Ping every active service every 30 minutes
- Record latency, HTTP status, response time
- Update uptime_pct in daily_stats

### 4.3 Chain Indexer (Future)
- Monitor Base blockchain for x402 settlement events
- Track agent transactions
- Record volume and usage patterns

## 5. Deployment

### 5.1 Environment Variables

```
PORT=3000
DATABASE_URL=./data/vernoute.db
AGENTIC_MARKET_API=https://api.agentic.market/v1
```

### 5.2 Hosting
- **Platform:** Railway.app (free tier)
- **Database:** SQLite persisted in volume
- **Cron:** Internal scheduler (node-cron)
- **Domain:** vernoute-pulse.railway.app

## 6. Directory Structure

```
vernoute-pulse/
├── PRD.md
├── SPEC.md
├── package.json
├── src/
│   ├── index.js              # Entry point
│   ├── config.js             # Configuration
│   ├── db.js                 # Database init & queries
│   ├── server.js             # Express app
│   ├── routes/
│   │   ├── overview.js       # GET /v1/pulse/overview
│   │   ├── services.js       # GET /v1/pulse/services
│   │   └── paid.js           # POST /v1/pulse/* (paid)
│   ├── collectors/
│   │   ├── agentic-market.js # Agentic Market scanner
│   │   └── probes.js         # Service health probes
│   ├── middleware/
│   │   └── x402.js           # x402 payment verification
│   └── utils/
│       ├── scheduler.js      # Cron job scheduler
│       └── logger.js         # Simple logging
├── public/
│   └── index.html           # Minimal dashboard
└── data/
    └── .gitkeep             # SQLite database directory
```

## 7. x402 Payment Integration

```javascript
// Middleware to verify x402 payments
app.post('/v1/pulse/agent/:address', verifyX402(0.01), handler);

// verifyX402 checks:
// 1. X-PAYMENT header exists
// 2. Payment is valid CDP settlement
// 3. Amount meets minimum ($0.01)
// 4. Payment not already used (idempotency)
```

## 8. Error Handling

| Error | HTTP Code | Response |
|-------|-----------|----------|
| Service not found | 404 | `{"error": "service_not_found"}` |
| Payment required | 402 | `{"error": "payment_required", "accepts": [...]}` |
| Invalid payment | 403 | `{"error": "invalid_payment"}` |
| Rate limited | 429 | `{"error": "rate_limited", "retry_after": 60}` |
| Server error | 500 | `{"error": "internal_error"}` |
