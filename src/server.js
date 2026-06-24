import express from "express";
import { overviewRouter } from "./routes/overview.js";
import { servicesRouter } from "./routes/services.js";
import { getServiceById } from "./db.js";
import config from "./config.js";

export function startServer() {
  const app = express();
  app.use(express.json());

  // Security headers
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, X-PAYMENT");
    res.removeHeader("X-Powered-By");
    next();
  });

  // --- Public routes ---
  const LANDING_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vernoute Pulse</title>
<style>
  :root {
    --bg: #0b0e14;
    --surface: #141925;
    --border: #232a3a;
    --text: #e6e9ef;
    --muted: #9aa3b2;
    --accent: #5b8cff;
    --success: #4ade80;
    --warning: #fbbf24;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--text);
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  main { max-width: 800px; margin: 0 auto; padding: 3rem 1.25rem 4rem; }
  h1 { margin: 0 0 .5rem; font-size: clamp(1.9rem, 1.2rem + 3vw, 2.6rem); }
  .lead { color: var(--muted); font-size: 1.05rem; margin: 0 0 1rem; }
  .lead a { color: var(--accent); }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem; margin: 2rem 0; }
  .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; }
  .stat-card .value { font-size: 1.8rem; font-weight: 700; color: var(--accent); }
  .stat-card .label { font-size: .85rem; color: var(--muted); margin-top: .25rem; }
  pre { background: #0d1018; border: 1px solid var(--border); border-radius: 10px; padding: 1rem; overflow-x: auto; }
  code { font-family: ui-monospace, monospace; font-size: .9em; }
  .endpoints { margin: 2rem 0; }
  .endpoint { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: .75rem 1rem; margin: .5rem 0; }
  .endpoint .method { color: var(--success); font-weight: 600; }
  .endpoint .path { color: var(--accent); }
  .endpoint .desc { color: var(--muted); font-size: .9rem; }
  .links { display: flex; gap: .75rem; margin-top: 2rem; }
  .links a { color: var(--text); text-decoration: none; padding: .55rem .9rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
  .links a:hover { border-color: var(--accent); color: var(--accent); }
</style>
</head>
<body>
<main>
  <h1>Vernoute Pulse</h1>
  <p class="lead">Real-time analytics for the <a href="https://x402.org">x402</a> AI agent economy on <a href="https://base.org">Base</a>.</p>
  
  <div class="stats" id="stats">
    <div class="stat-card"><div class="value" id="services">-</div><div class="label">Services Tracked</div></div>
    <div class="stat-card"><div class="value" id="volume">-</div><div class="label">Volume Today (USDC)</div></div>
    <div class="stat-card"><div class="value" id="requests">-</div><div class="label">Requests Today</div></div>
  </div>

  <h2>API Endpoints</h2>
  <div class="endpoints">
    <div class="endpoint"><span class="method">GET</span> <span class="path">/v1/pulse/overview</span> <span class="desc">— Ecosystem overview (free)</span></div>
    <div class="endpoint"><span class="method">GET</span> <span class="path">/v1/pulse/services</span> <span class="desc">— All services with stats (free)</span></div>
    <div class="endpoint"><span class="method">GET</span> <span class="path">/v1/pulse/services/:id</span> <span class="desc">— Single service detail (free)</span></div>
    <div class="endpoint"><span class="method">GET</span> <span class="path">/info</span> <span class="desc">— Machine-readable service info</span></div>
  </div>

  <h2>Example</h2>
  <pre><code>curl https://vernoute-pulse.railway.app/v1/pulse/overview</code></pre>

  <div class="links">
    <a href="/v1/pulse/overview">Overview JSON</a>
    <a href="/v1/pulse/services">Services JSON</a>
    <a href="/info">/info JSON</a>
  </div>
</main>
<script>
fetch('/v1/pulse/overview').then(r=>r.json()).then(d=>{
  document.getElementById('services').textContent = d.total_services || d.active_services || '-';
  document.getElementById('volume').textContent = d.total_volume_24h ? '$' + Number(d.total_volume_24h).toLocaleString() : '-';
  document.getElementById('requests').textContent = d.total_requests_24h ? Number(d.total_requests_24h).toLocaleString() : '-';
});
</script>
</body>
</html>`;

  app.get("/", (_req, res) => res.type("html").send(LANDING_HTML));

  app.get("/info", (_req, res) => {
    res.json({
      name: "vernoute-pulse",
      description: "Real-time analytics for the x402 AI agent economy on Base",
      version: config.version,
      endpoints: {
        "GET /v1/pulse/overview": "Ecosystem overview (free)",
        "GET /v1/pulse/services": "All services with analytics (free)",
        "GET /v1/pulse/services/:id": "Single service detail (free)",
      },
    });
  });

  // --- API routes ---
  // --- Rate limiting (simple in-memory) ---
  const rateLimitMap = new Map();
  const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  const RATE_LIMIT_MAX = 60; // 60 requests per minute

  app.use("/v1/pulse", (_req, res, next) => {
    const ip = _req.ip || _req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
    
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + RATE_LIMIT_WINDOW;
    }
    
    entry.count++;
    rateLimitMap.set(ip, entry);

    res.header("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
    res.header("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - entry.count).toString());

    if (entry.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: "rate_limited", message: "Too many requests", retry_after: Math.ceil((entry.resetAt - now) / 1000) });
    }
    next();
  });

  // Clean up stale entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 5 * 60 * 1000);

  // --- API routes ---
  app.use("/v1/pulse", overviewRouter);
  app.use("/v1/pulse", servicesRouter);

  // --- Method not allowed handler for API routes ---
  app.use("/v1/pulse", (req, res) => {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "method_not_allowed", message: `Method ${req.method} not allowed. Use GET instead.` });
    }
    // Unknown path under /v1/pulse
    return res.status(404).json({ error: "not_found", message: "Endpoint tidak ditemukan. Cek /info untuk daftar endpoint." });
  });

  // --- 404 handler untuk path lain ---
  app.use((_req, res) => {
    res.status(404).json({ error: "not_found", message: "Endpoint tidak ditemukan" });
  });

  return app;
}
