import fs from "node:fs";
import path from "node:path";
import config from "./config.js";
import { logger } from "./utils/logger.js";

const DATA_DIR = path.dirname(config.dbPath);
const SERVICES_FILE = path.join(DATA_DIR, "services.json");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const SNAPSHOTS_FILE = path.join(DATA_DIR, "snapshots.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, defaultVal) {
  ensureDir();
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (e) {
    logger.warn(`Failed to read ${file}: ${e.message}`);
  }
  return defaultVal;
}

function writeJSON(file, data) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// --- Services ---
export function upsertService(service) {
  const services = readJSON(SERVICES_FILE, {});
  services[service.id] = {
    ...service,
    networks: service.networks || ["base"],
    status: "active",
    updated_at: new Date().toISOString(),
    created_at: services[service.id]?.created_at || new Date().toISOString(),
  };
  writeJSON(SERVICES_FILE, services);
}

export function getServices() {
  const services = readJSON(SERVICES_FILE, {});
  const today = new Date().toISOString().slice(0, 10);
  const stats = readJSON(STATS_FILE, {});

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

export function getServiceById(id) {
  const services = readJSON(SERVICES_FILE, {});
  const svc = services[id];
  if (!svc) return null;

  const stats = readJSON(STATS_FILE, {});
  const today = new Date().toISOString().slice(0, 10);
  const todayStats = stats[id]?.[today] || {};

  // Get 7-day trend
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayStats = stats[id]?.[dateStr];
    if (dayStats) {
      trend.push({ date: dateStr, ...dayStats });
    }
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

export function updateServiceHealth(serviceId, latencyMs, success) {
  const today = new Date().toISOString().slice(0, 10);
  const stats = readJSON(STATS_FILE, {});
  
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

  writeJSON(STATS_FILE, stats);
}

// --- Ecosystem snapshots ---
export function saveSnapshot(data) {
  const snapshots = readJSON(SNAPSHOTS_FILE, []);
  snapshots.push({
    timestamp: new Date().toISOString(),
    ...data,
  });
  // Keep only last 100 snapshots
  if (snapshots.length > 100) snapshots.splice(0, snapshots.length - 100);
  writeJSON(SNAPSHOTS_FILE, snapshots);
}

export function getLatestSnapshot() {
  const snapshots = readJSON(SNAPSHOTS_FILE, []);
  return snapshots[snapshots.length - 1] || null;
}

// --- Overview ---
export function getOverview() {
  const services = readJSON(SERVICES_FILE, {});
  const latestSnapshot = getLatestSnapshot();
  const allServices = getServices();

  return {
    total_services: Object.keys(services).length,
    active_services: Object.values(services).filter(s => s.status === "active").length,
    total_volume_24h: latestSnapshot?.total_volume_24h || 0,
    total_requests_24h: latestSnapshot?.total_requests_24h || 0,
    top_services: allServices.slice(0, 10),
    timestamp: new Date().toISOString(),
  };
}
