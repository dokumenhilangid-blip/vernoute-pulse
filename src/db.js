// KV-based storage for Cloudflare Workers
// Works with both Module (env) and Service Worker (global) formats

// In Service Worker format, KV is available as a global variable
// In Module format, it's passed via env parameter
function getKV(env) {
  if (env && env.VERNOUTE_KV) return env.VERNOUTE_KV;
  if (typeof VERNOUTE_KV !== "undefined") return VERNOUTE_KV;
  throw new Error("VERNOUTE_KV binding not available");
}

const SERVICES_KEY = "services_data";
const STATS_KEY = "stats_data";
const SNAPSHOTS_KEY = "snapshots_data";

// --- Services ---
export async function upsertService(env, service) {
  const kv = getKV(env);
  const raw = await kv.get(SERVICES_KEY);
  const services = raw ? JSON.parse(raw) : {};
  services[service.id] = {
    ...service,
    networks: service.networks || ["base"],
    status: "active",
    updated_at: new Date().toISOString(),
    created_at: services[service.id]?.created_at || new Date().toISOString(),
  };
  await kv.put(SERVICES_KEY, JSON.stringify(services));
}

export async function getServices(env) {
  const kv = getKV(env);
  const raw = await kv.get(SERVICES_KEY);
  const services = raw ? JSON.parse(raw) : {};
  const today = new Date().toISOString().slice(0, 10);
  const statsRaw = await kv.get(STATS_KEY);
  const stats = statsRaw ? JSON.parse(statsRaw) : {};

  return Object.values(services).map((svc) => {
    const todayStats = stats[svc.id]?.[today] || {};
    return {
      id: svc.id,
      name: svc.name,
      description: svc.description,
      category: svc.category,
      pricing_amount: svc.pricing_amount,
      base_url: svc.base_url,
      status: svc.status,
      requests_24h: todayStats.total_requests || 0,
      volume_24h: todayStats.total_volume || 0,
      uptime_pct: todayStats.uptime_pct ?? 100,
      avg_latency_ms: todayStats.avg_latency_ms || 0,
    };
  }).sort((a, b) => b.volume_24h - a.volume_24h);
}

export async function getServiceById(env, id) {
  const kv = getKV(env);
  const raw = await kv.get(SERVICES_KEY);
  const services = raw ? JSON.parse(raw) : {};
  const svc = services[id];
  if (!svc) return null;

  const statsRaw = await kv.get(STATS_KEY);
  const stats = statsRaw ? JSON.parse(statsRaw) : {};
  const today = new Date().toISOString().slice(0, 10);
  const todayStats = stats[id]?.[today] || {};

  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStats = stats[id]?.[dateStr];
    if (dayStats) trend.push({ date: dateStr, ...dayStats });
  }

  return {
    ...svc,
    requests_24h: todayStats.total_requests || 0,
    volume_24h: todayStats.total_volume || 0,
    uptime_pct: todayStats.uptime_pct ?? 100,
    avg_latency_ms: todayStats.avg_latency_ms || 0,
    trend_7d: trend,
  };
}

export async function updateServiceHealth(env, serviceId, latencyMs, success) {
  const kv = getKV(env);
  const today = new Date().toISOString().slice(0, 10);
  const raw = await kv.get(STATS_KEY);
  const stats = raw ? JSON.parse(raw) : {};

  if (!stats[serviceId]) stats[serviceId] = {};
  if (!stats[serviceId][today]) {
    stats[serviceId][today] = { total_requests: 0, total_volume: 0, avg_latency_ms: 0, uptime_pct: 100, errors: 0 };
  }

  const dayStats = stats[serviceId][today];
  dayStats.total_requests++;
  dayStats.avg_latency_ms = dayStats.avg_latency_ms > 0
    ? (dayStats.avg_latency_ms * (dayStats.total_requests - 1) + latencyMs) / dayStats.total_requests
    : latencyMs;

  if (success) {
    dayStats.uptime_pct = ((dayStats.uptime_pct * (dayStats.total_requests - 1)) + 100) / dayStats.total_requests;
  } else {
    dayStats.errors++;
    dayStats.uptime_pct = (dayStats.uptime_pct * (dayStats.total_requests - 1)) / dayStats.total_requests;
  }

  await kv.put(STATS_KEY, JSON.stringify(stats));
}

// --- Ecosystem snapshots ---
export async function saveSnapshot(env, data) {
  const kv = getKV(env);
  const raw = await kv.get(SNAPSHOTS_KEY);
  const snapshots = raw ? JSON.parse(raw) : [];
  snapshots.push({ timestamp: new Date().toISOString(), ...data });
  if (snapshots.length > 100) snapshots.splice(0, snapshots.length - 100);
  await kv.put(SNAPSHOTS_KEY, JSON.stringify(snapshots));
}

export async function getLatestSnapshot(env) {
  const kv = getKV(env);
  const raw = await kv.get(SNAPSHOTS_KEY);
  const snapshots = raw ? JSON.parse(raw) : [];
  return snapshots[snapshots.length - 1] || null;
}

// --- Overview ---
export async function getOverviewData(env) {
  const services = await getServices(env);
  const latestSnapshot = await getLatestSnapshot(env);
  const kv = getKV(env);
  const raw = await kv.get(SERVICES_KEY);
  const servicesObj = raw ? JSON.parse(raw) : {};

  return {
    total_services: Object.keys(servicesObj).length,
    active_services: Object.values(servicesObj).filter((s) => s.status === "active").length,
    total_volume_24h: latestSnapshot?.total_volume_24h || 0,
    total_requests_24h: latestSnapshot?.total_requests_24h || 0,
    top_services: services.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
