import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { cache } from "hono/cache";
import { overviewRouter } from "./routes/overview.js";
import { servicesRouter } from "./routes/services.js";
import { collectFromAgenticMarket, probeServices } from "./collectors/agentic-market.js";

const LANDING_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Real-time x402 AI agent economy analytics on Base">
<meta property="og:title" content="Vernoute Pulse — x402 Agent Economy">
<meta property="og:description" content="Real-time analytics for the x402 AI agent economy. Track services, latency, uptime, pricing.">
<meta name="theme-color" content="#06080d">
<title>Vernoute Pulse — x402 Agent Economy</title>
<style>
/* ═══ PRIMITIVE TOKENS ═══ */
:root{
--b400:#78a9ff;--b500:#5b8cff;--c500:#00d4ff;--p500:#a855f7;
--pk500:#ff3d8b;--g500:#00ff88;--a500:#ffaa00;--r500:#ef4444;
--t500:#14b8a6;--o500:#f97316;--gr1:#6b7a99;--gr2:#475569;
--gr3:#334155;--gr4:#0f1423;--gr5:#0a0e18;--gr6:#06080d;
--font-base:15px;--radius:16px;}

/* ═══ SEMANTIC TOKENS ═══ */
:root{
--bg:#06080d;--surface:rgba(15,20,35,0.7);--border:rgba(91,140,255,0.1);
--border-h:rgba(91,140,255,0.25);--text:#e8ecf4;--text2:#94a3b8;
--muted:#6b7a99;--accent:#5b8cff;--success:#00ff88;--warn:#ffaa00;
--ease:cubic-bezier(.16,1,.3,1);--fast:200ms;}

*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font:var(--font-base)/1.6 Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}

/* ── Animated Background ── */
.bg{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.bg-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(91,140,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(91,140,255,.03) 1px,transparent 1px);background-size:60px 60px}
.bg-grad{position:absolute;width:500px;height:500px;border-radius:50%;filter:blur(120px);opacity:.15}
.bg-grad.g1{background:var(--b500);top:-200px;left:-100px}
.bg-grad.g2{background:var(--p500);bottom:-200px;right:-100px}
.bg-grad.g3{background:var(--c500);top:40%;left:50%;opacity:.07}

/* ── Animated float particles (CSS-only) ── */
.part{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--accent);opacity:.3}
@keyframes float{0%,100%{transform:translateY(0) translateX(0)}25%{transform:translateY(-30px) translateX(15px)}50%{transform:translateY(-10px) translateX(-10px)}75%{transform:translateY(-40px) translateX(20px)}}
.part:nth-child(1){top:15%;left:20%;animation:float 8s ease-in-out infinite;width:3px;height:3px}
.part:nth-child(2){top:60%;left:80%;animation:float 11s ease-in-out infinite .5s;width:5px;height:5px;background:var(--p500)}
.part:nth-child(3){top:30%;left:70%;animation:float 9s ease-in-out infinite 1s;width:2px;height:2px;background:var(--c500)}
.part:nth-child(4){top:75%;left:15%;animation:float 12s ease-in-out infinite 1.5s;width:4px}
.part:nth-child(5){top:40%;left:40%;animation:float 7s ease-in-out infinite 2s;width:3px;height:3px;background:var(--p500)}
.part:nth-child(6){top:85%;left:60%;animation:float 10s ease-in-out infinite .8s}
.part:nth-child(7){top:10%;left:90%;animation:float 13s ease-in-out infinite 1.2s;background:var(--c500)}
.part:nth-child(8){top:50%;left:10%;animation:float 9s ease-in-out infinite 2.5s;width:5px;height:5px}

/* ── Container ── */
.container{max-width:1100px;margin:0 auto;padding:0 1.25rem;position:relative;z-index:1}

/* ── Hero ── */
.hero{text-align:center;padding:5rem 0 2.5rem;animation:fadeUp .8s ease forwards}
.badge{display:inline-flex;align-items:center;gap:.5rem;padding:.35rem .9rem;background:rgba(91,140,255,.1);border:1px solid rgba(91,140,255,.2);border-radius:100px;font-size:.78rem;color:var(--accent);font-weight:600;margin-bottom:1.25rem;animation:fadeUp .6s ease forwards}
.badge .dot{width:7px;height:7px;background:var(--success);border-radius:50%;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.5)}}
.hero h1{font-size:clamp(2.2rem,5.5vw,4rem);font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-bottom:.75rem}
.gradient{background:linear-gradient(135deg,#5b8cff,#00d4ff,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hero p{font-size:clamp(.9rem,2vw,1.05rem);color:var(--text2);max-width:500px;margin:0 auto 1.5rem;line-height:1.7}
.hero p a{color:var(--accent);text-decoration:none;border-bottom:1px solid rgba(91,140,255,.3);transition:border var(--fast)}
.hero p a:hover{border-color:rgba(91,140,255,.6)}

.url-bar{display:inline-flex;align-items:center;gap:.5rem;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:12px;padding:.5rem 1rem;font-family:'JetBrains Mono',monospace;font-size:.82rem;color:var(--muted);cursor:pointer;transition:border var(--fast)}
.url-bar:hover{border-color:var(--border-h)}
.url-bar .copy{padding:.15rem .55rem;background:rgba(91,140,255,.15);border-radius:6px;color:var(--accent);font-weight:600;transition:background var(--fast)}
.url-bar .copy:hover{background:rgba(91,140,255,.25)}

/* ── Stats ── */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:.9rem;margin:1.5rem 0 2rem}
.card{background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem;position:relative;overflow:hidden;transition:transform var(--fast),border-color var(--fast),box-shadow var(--fast)}
@media(hover:hover){.card:hover{border-color:var(--border-h);transform:translateY(-3px);box-shadow:0 8px 30px rgba(91,140,255,.12)}}
.card .accent-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:0;transition:opacity var(--fast)}
.card:hover .accent-line{opacity:1}
.card .icon{width:30px;height:30px;margin-bottom:.6rem}
.card .icon svg{width:100%;height:100%}
.card .val{font-size:1.8rem;font-weight:800;line-height:1}
.card .lbl{font-size:.7rem;color:var(--muted);margin-top:.3rem;text-transform:uppercase;letter-spacing:.06em}
.card .live{display:inline-flex;align-items:center;gap:.25rem;font-size:.7rem;padding:.15rem .45rem;border-radius:6px;margin-top:.4rem;background:rgba(0,255,136,.1);color:var(--success)}

/* ── Charts ── */
.charts{display:grid;grid-template-columns:1fr 1fr;gap:.9rem;margin:1.5rem 0}
@media(max-width:680px){.charts{grid-template-columns:1fr}}
.chart-card{background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:var(--radius);padding:1.25rem}
.chart-card h3{font-size:.85rem;font-weight:600;margin-bottom:.9rem;color:var(--text2)}

.bar-row{display:flex;align-items:center;gap:.6rem;margin:.45rem 0}
.bar-lbl{width:75px;font-size:.78rem;color:var(--muted);text-align:right;flex-shrink:0}
.bar-tr{flex:1;height:20px;background:rgba(91,140,255,.05);border-radius:6px;overflow:hidden}
.bar-fill{height:100%;border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding:0 .5rem;font-size:.68rem;font-weight:600;color:#fff;transition:width 1.2s var(--ease);min-width:20px}
.bar-cnt{font-size:.78rem;color:var(--text2);width:25px;text-align:right}

.price-l{display:flex;flex-direction:column}
.price-r{display:flex;align-items:center;gap:.6rem;padding:.5rem 0;border-bottom:1px solid rgba(91,140,255,.04)}
.price-r:last-child{border:0}
.price-r .n{flex:1;font-size:.78rem}
.price-r .a{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--accent)}
.price-r .tr{width:60px;height:4px;background:rgba(91,140,255,.08);border-radius:2px;overflow:hidden}
.price-r .tr .f{height:100%;background:linear-gradient(90deg,var(--b500),var(--c500));border-radius:2px;transition:width 1.2s var(--ease)}

/* ── Table ── */
.section{margin:2rem 0}
.section-title{font-size:1.2rem;font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.tbl{background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.tbl-hdr{display:flex;justify-content:space-between;align-items:center;padding:.9rem 1.25rem;border-bottom:1px solid var(--border)}
.tbl-hdr h3{font-size:.88rem;font-weight:600;display:flex;align-items:center;gap:.4rem}
.tbl-hdr .c{font-size:.78rem;color:var(--muted);background:rgba(91,140,255,.08);padding:.2rem .6rem;border-radius:100px}

.row{display:grid;grid-template-columns:2fr .8fr .8fr .6fr .8fr;align-items:center;padding:.7rem 1.25rem;border-bottom:1px solid rgba(91,140,255,.04);transition:background var(--fast);font-size:.83rem}
.row:last-child{border:0}
.row:hover{background:rgba(91,140,255,.04)}
.row.hdr{color:var(--muted);font-weight:600;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;padding:.6rem 1.25rem;background:rgba(91,140,255,.03)}
@media(max-width:768px){.row{grid-template-columns:2fr .8fr .8fr}.hm{display:none}}
@media(max-width:480px){.row{grid-template-columns:1.5fr .8fr;font-size:.78rem}.hm,.hp{display:none}}

.svc-name{display:flex;align-items:center;gap:.4rem;font-weight:600;font-size:.83rem}
.cd{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.cd-Search{background:var(--b500)}.cd-Inference{background:var(--p500)}.cd-Data{background:var(--c500)}.cd-Media{background:var(--pk500)}.cd-Infra{background:var(--a500)}.cd-Social{background:var(--r500)}.cd-Other{background:var(--gr1)}.cd-Storage{background:#c084fc}.cd-Travel{background:var(--t500)}.cd-Trading{background:var(--o500)}

.lat-bar{height:4px;border-radius:2px;background:rgba(91,140,255,.08);overflow:hidden;width:60px;margin-bottom:.15rem}
.lat-bar .f{height:100%;border-radius:2px;transition:width 1s var(--ease);background:var(--success)}
.lat-bar .f.md{background:var(--warn)}.lat-bar .f.sl{background:var(--pk500)}
.lat-v{font-size:.7rem;font-family:'JetBrains Mono',monospace;color:var(--muted)}

.up-bd{padding:.1rem .45rem;border-radius:6px;font-size:.7rem;font-weight:600}
.up-bd.gd{background:rgba(0,255,136,.1);color:var(--success)}
.up-bd.bd{background:rgba(239,68,68,.1);color:var(--r500)}

.pr{font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--accent)}

/* ── Endpoints ── */
.eps{display:grid;gap:.5rem}
.ep{display:flex;align-items:center;gap:.9rem;background:var(--surface);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid var(--border);border-radius:12px;padding:.85rem 1.1rem;transition:transform var(--fast),border-color var(--fast);text-decoration:none;color:inherit;cursor:pointer}
.ep:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media(hover:hover){.ep:hover{border-color:var(--border-h);transform:translateX(5px)}}
.ep .m{background:rgba(0,255,136,.1);color:var(--success);font-family:'JetBrains Mono',monospace;font-size:.68rem;font-weight:700;padding:.2rem .5rem;border-radius:6px;flex-shrink:0}
.ep .p{font-family:'JetBrains Mono',monospace;font-size:.83rem;color:var(--accent)}
.ep .d{font-size:.78rem;color:var(--muted);margin-left:auto}
.ep .ar{color:var(--gr2);transition:transform var(--fast),color var(--fast)}
@media(hover:hover){.ep:hover .ar{transform:translateX(5px);color:var(--accent)}}

/* ── Footer ── */
.ft{text-align:center;padding:2.5rem 0 1.5rem;border-top:1px solid var(--border);margin-top:2.5rem}
.ft p{font-size:.78rem;color:var(--muted)}
.ft a{color:var(--accent);text-decoration:none;transition:color var(--fast)}
.ft a:hover{color:#78a9ff}
.ft .lk{display:flex;justify-content:center;gap:1.25rem;margin-top:.8rem}
.ft .lk a{color:var(--muted);font-size:.78rem}
.ft .lk a:hover{color:var(--accent)}

/* ── Animations ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
.fadeUp{animation:fadeUp .7s ease forwards;opacity:0}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.shimmer{background:linear-gradient(90deg,transparent 30%,rgba(91,140,255,.06) 50%,transparent 70%);background-size:200% 100%;animation:shimmer 3s infinite}
.live-dot{display:inline-block;width:5px;height:5px;background:var(--success);border-radius:50%;animation:pulse 1.5s infinite}
@keyframes countUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

@media(prefers-reduced-motion:reduce){*,:before,:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
::-webkit-scrollbar{width:5px}
::-webkit-scrollbar-track{background:#0a0e18}
::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
</style>
</head>
<body>
<div class="bg">
  <div class="bg-grid"></div>
  <div class="bg-grad g1"></div>
  <div class="bg-grad g2"></div>
  <div class="bg-grad g3"></div>
  <div class="part"></div><div class="part"></div><div class="part"></div>
  <div class="part"></div><div class="part"></div><div class="part"></div>
  <div class="part"></div><div class="part"></div>
</div>

<div class="container">

  <section class="hero">
    <div class="badge"><span class="dot"></span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
      Live on Base
    </div>
    <h1><span class="gradient">Vernoute Pulse</span></h1>
    <p>Real-time analytics for the <a href="https://x402.org">x402</a> AI agent economy on <a href="https://base.org">Base</a>. Track services, latency, uptime &amp; pricing.</p>
    <div class="url-bar" onclick="navigator.clipboard.writeText('https://vernoute-pulse.dokumenhilang-id.workers.dev');this.querySelector('.copy').textContent='Copied!';setTimeout(()=>this.querySelector('.copy').textContent='Copy',2000)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      <span>vernoute-pulse.dokumenhilang-id.workers.dev</span>
      <span class="copy">Copy</span>
    </div>
  </section>

  <div class="stats" id="stats">
    <div class="card"><div class="accent-line"></div>
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg></div>
      <div class="val" id="s1">—</div><div class="lbl">Services Tracked</div>
      <span class="live"><svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 22 22 2 22"/></svg> live</span>
    </div>
    <div class="card"><div class="accent-line"></div>
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
      <div class="val" id="s2">—</div><div class="lbl">Active Services</div>
    </div>
    <div class="card"><div class="accent-line"></div>
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--b400)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg></div>
      <div class="val" id="s3">—</div><div class="lbl">Categories</div>
    </div>
    <div class="card"><div class="accent-line"></div>
      <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="var(--p500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
      <div class="val" id="s4">—</div><div class="lbl">Avg Latency</div>
    </div>
  </div>

  <div class="charts">
    <div class="chart-card">
      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>Services by Category</h3>
      <div id="catChart"><div class="bar-row"><span class="bar-lbl">—</span><div class="bar-tr"><div class="bar-fill shimmer" style="width:40%"></div></div><span class="bar-cnt">—</span></div></div>
    </div>
    <div class="chart-card">
      <h3><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>Pricing Distribution (USDC/req)</h3>
      <div class="price-l" id="priceChart"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>All Services</div>
    <div class="tbl">
      <div class="tbl-hdr"><h3><span class="live-dot"></span>Live Health Monitor</h3><span class="c" id="tc">—</span></div>
      <div class="row hdr"><span>Service</span><span class="hm">Category</span><span class="hm">Latency</span><span class="hp">Uptime</span><span style="text-align:right">Price</span></div>
      <div id="rows"><div class="row shimmer" style="height:38px"></div><div class="row shimmer" style="height:38px"></div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>API Endpoints<span class="hp" style="font-size:.72rem;color:var(--muted);font-weight:400;margin-left:.3rem">— Free, no auth</span></div>
    <div class="eps">
      <a class="ep" href="/v1/pulse/overview"><span class="m">GET</span><span class="p">/v1/pulse/overview</span><span class="d hm">Ecosystem overview</span><span class="ar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>
      <a class="ep" href="/v1/pulse/services"><span class="m">GET</span><span class="p">/v1/pulse/services</span><span class="d hm">All services with stats</span><span class="ar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>
      <a class="ep" href="/v1/pulse/services/exa-ai"><span class="m">GET</span><span class="p">/v1/pulse/services/:id</span><span class="d hm">Detail + 7d trend</span><span class="ar"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>
    </div>
  </div>

  <footer class="ft">
    <p>Built on Termux · Zero budget · Mobile-first</p>
    <div class="lk">
      <a href="https://github.com/dokumenhilangid-blip/vernoute-pulse"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle;margin-right:3px"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>GitHub</a>
      <a href="https://x402.org">x402 Protocol</a>
      <a href="https://base.org">Base</a>
    </div>
  </footer>

</div>

<script>
// ── Animated Counter (vanilla JS, requestAnimationFrame) ──
function countUp(el, target, suffix){
  var o={v:0}, s=target>0, d=1200, t, start;
  function step(ts){
    if(!start)start=ts;
    var p=Math.min((ts-start)/d,1);
    var e=1-Math.pow(1-p,3);
    o.v=Math.round(target*e);
    el.textContent=(s?o.v.toLocaleString():'')+suffix;
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── Load Data ──
fetch('/v1/pulse/services').then(function(r){return r.json()}).then(function(data){
  var svcs=data.services||[], t=svcs.length;
  var a=svcs.filter(function(s){return s.status==='active'}).length;
  var cats={};svcs.forEach(function(s){cats[s.category]=(cats[s.category]||0)+1});
  var c=Object.keys(cats).length;
  var lat=Math.round(svcs.reduce(function(acc,s){return acc+(s.avg_latency_ms||0)},0)/t);

  countUp(document.getElementById('s1'),t,'');
  countUp(document.getElementById('s2'),a,'');
  countUp(document.getElementById('s3'),c,'');
  countUp(document.getElementById('s4'),lat,'ms');

  // Category chart
  var sorted=Object.entries(cats).sort(function(a,b){return b[1]-a[1]});
  var maxC=sorted[0][1], col={Search:'#5b8cff',Inference:'#a855f7',Data:'#00d4ff',Media:'#ff3d8b',Infra:'#ffaa00',Social:'#ef4444',Storage:'#c084fc',Travel:'#14b8a6',Trading:'#f97316',Other:'#6b7a99'};
  var h='';
  sorted.forEach(function(cat){
    var p=Math.round(cat[1]/maxC*100);
    h+='<div class="bar-row"><span class="bar-lbl">'+cat[0]+'</span><div class="bar-tr"><div class="bar-fill" style="width:0;background:'+(col[cat[0]]||'#5b8cff')+'" data-w="'+p+'%">'+cat[1]+'</div></div><span class="bar-cnt">'+cat[1]+'</span></div>';
  });
  document.getElementById('catChart').innerHTML=h;
  setTimeout(function(){document.querySelectorAll('#catChart .bar-fill').forEach(function(e){e.style.width=e.getAttribute('data-w')})},300);

  // Pricing chart
  var ranges=[{l:'< 0.001¢',min:0,max:.001},{l:'0.1¢',min:.001,max:.002},{l:'< 1¢',min:.002,max:.01},{l:'1-10¢',min:.01,max:.1},{l:'10¢-1$',min:.1,max:1},{l:'1$+',min:1,max:Infinity}];
  var priceD=ranges.map(function(r){return{l:r.l,c:svcs.filter(function(s){return s.pricing_amount>=r.min&&s.pricing_amount<r.max}).length}});
  var maxP=Math.max.apply(Math,priceD.map(function(p){return p.c}));
  var ph='';
  priceD.forEach(function(p){
    var pt=maxP>0?Math.round(p.c/maxP*100):0;
    ph+='<div class="price-r"><span class="n">'+p.l+'</span><div class="tr"><div class="f" style="width:0" data-w="'+pt+'%"></div></div><span class="a">'+p.c+'</span></div>';
  });
  document.getElementById('priceChart').innerHTML=ph;
  setTimeout(function(){document.querySelectorAll('#priceChart .f').forEach(function(e){e.style.width=e.getAttribute('data-w')})},500);

  // Table
  var srt=svcs.slice().sort(function(a,b){return(a.avg_latency_ms||9999)-(b.avg_latency_ms||9999)});
  document.getElementById('tc').textContent=t+' services';
  var r='';
  srt.forEach(function(s){
    var l=Math.round(s.avg_latency_ms||0);
    var lc=l===0?'sl':l<400?'':'md';
    var lw=l===0?100:Math.min(100,l/12);
    var up=Math.round(s.uptime_pct||0), uc=up>=90?'gd':'bd';
    r+='<div class="row"><span class="svc-name"><span class="cd cd-'+s.category+'"></span>'+s.name+'</span><span class="hm" style="font-size:.78rem">'+s.category+'</span><span class="hm"><div class="lat-bar"><div class="f '+lc+'" style="width:'+lw+'%"></div></div><span class="lat-v">'+(l||'—')+'ms</span></span><span class="hp"><span class="up-bd '+uc+'">'+up+'%</span></span><span class="pr" style="text-align:right">$'+s.pricing_amount+'</span></div>';
  });
  document.getElementById('rows').innerHTML=r;
}).catch(function(err){
  console.error(err);
  document.getElementById('stats').innerHTML='<div class="card" style="grid-column:1/-1;text-align:center;padding:2rem"><div class="icon" style="margin:0 auto .6rem"><svg viewBox="0 0 24 24" fill="none" stroke="var(--r500)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="30" height="30"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div class="val" style="font-size:1rem;font-weight:400">Failed to load data</div><div class="lbl" style="margin-top:.5rem"><a href="javascript:location.reload()" style="color:var(--accent);text-decoration:none">Try again →</a></div></div>';
  document.getElementById('catChart').innerHTML='';
  document.getElementById('priceChart').innerHTML='';
  document.getElementById('rows').innerHTML='';
  document.getElementById('tc').textContent='Error';
});

// Loading timeout — if data takes >8s, show loading message
setTimeout(function(){
  var s1=document.getElementById('s1');
  if(s1 && s1.textContent==='—'){
    s1.textContent='...';
  }
},8000);

// Auto-refresh every 2 minutes (reduces KV reads vs 60s)
setTimeout(function(){location.reload()},120000);
</script>
</body>
</html>`;

const app = new Hono();

// Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
app.use(secureHeaders());

// CORS
app.use("/v1/pulse/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "X-PAYMENT"],
}));

// Rate limiting (in-memory per Worker instance)
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW = 60 * 1000;

app.use("/v1/pulse/*", async (c, next) => {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + RATE_LIMIT_WINDOW; }
  entry.count++;
  rateLimitMap.set(ip, entry);
  c.res.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX.toString());
  c.res.headers.set("X-RateLimit-Remaining", Math.max(0, RATE_LIMIT_MAX - entry.count).toString());
  if (entry.count > RATE_LIMIT_MAX) {
    return c.json({ error: "rate_limited", message: "Too many requests", retry_after: Math.ceil((entry.resetAt - now) / 1000) }, 429);
  }
  await next();
});

// Landing page — cache at edge for 60s
app.get("/", cache({ cacheName: "vernoute-landing", cacheControl: "max-age=60" }), (c) => c.html(LANDING_HTML));

// Info
app.get("/info", (c) => c.json({
  name: "vernoute-pulse",
  description: "Real-time analytics for the x402 AI agent economy on Base",
  version: "1.0.0",
  endpoints: {
    "GET /v1/pulse/overview": "Ecosystem overview (free)",
    "GET /v1/pulse/services": "All services with analytics (free)",
    "GET /v1/pulse/services/:id": "Single service detail (free)",
  },
}));

// API routes — cache at edge for 30s
app.get("/v1/pulse/*", cache({ cacheName: "vernoute-api", cacheControl: "max-age=30" }));
app.route("/v1/pulse", overviewRouter);
app.route("/v1/pulse", servicesRouter);

// 404
app.notFound((c) => c.json({ error: "not_found", message: "Endpoint tidak ditemukan" }, 404));

// Method not allowed
app.onError((err, c) => {
  if (err.message?.includes("method")) {
    return c.json({ error: "method_not_allowed", message: `Method ${c.req.method} not allowed` }, 405);
  }
  return c.json({ error: "internal_error", message: "Internal error" }, 500);
});

// ---------- Worker Handlers ----------

export default {
  // HTTP handler
  fetch: app.fetch,

  // Cron handler (scheduled tasks)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(handleScheduled(event, env));
  },
};

async function handleScheduled(event, env) {
  const cron = event.cron;

  if (cron === "0 */6 * * *") {
    // Every 6 hours: collect services
    console.log("Cron: collecting services from Agentic Market");
    await collectFromAgenticMarket(env);
  } else if (cron === "*/30 * * * *") {
    // Every 30 minutes: probe health
    console.log("Cron: probing service health");
    await probeServices(env);
  }
}
