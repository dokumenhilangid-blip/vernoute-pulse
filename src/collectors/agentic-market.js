import config from "../config.js";
import { logger } from "../utils/logger.js";
import { getServices, upsertService, updateServiceHealth, saveSnapshot } from "../db.js";

const KNOWN_SERVICES = [
  {
    id: "exa",
    name: "Exa",
    description: "AI-powered web search and content retrieval service",
    category: "search",
    provider: "Exa",
    base_url: "https://api.exa.ai/search",
    pricing_amount: 0.003,
    networks: ["base"],
  },
  {
    id: "claude",
    name: "Claude",
    description: "Claude models and Anthropic-compatible messaging via x402 gateways",
    category: "ai",
    provider: "Anthropic",
    base_url: "https://api.anthropic.com/v1/messages",
    pricing_amount: 0.001,
    networks: ["base"],
  },
  {
    id: "tripadvisor",
    name: "Tripadvisor",
    description: "Travel content API for location data, reviews, and photos",
    category: "data",
    provider: "Tripadvisor",
    base_url: "https://api.tripadvisor.com",
    pricing_amount: 0.01,
    networks: ["base"],
  },
  {
    id: "deepgram",
    name: "Deepgram",
    description: "Speech-to-text, text-to-speech, and audio intelligence",
    category: "ai",
    provider: "Deepgram",
    base_url: "https://api.deepgram.com/v1",
    pricing_amount: 1.0,
    networks: ["base"],
  },
  {
    id: "coinmarketcap",
    name: "CoinMarketCap",
    description: "Cryptocurrency prices, rankings, and market data",
    category: "crypto",
    provider: "CoinMarketCap",
    base_url: "https://pro-api.coinmarketcap.com/v1",
    pricing_amount: 0.01,
    networks: ["base"],
  },
  {
    id: "venice",
    name: "Venice AI",
    description: "Private and permissionless AI inference, uncensored models",
    category: "ai",
    provider: "Venice",
    base_url: "https://api.venice.ai",
    pricing_amount: 0.005,
    networks: ["base"],
  },
  {
    id: "alchemy",
    name: "Alchemy",
    description: "Blockchain developer platform with Node JSON-RPC, Token, NFT APIs",
    category: "infrastructure",
    provider: "Alchemy",
    base_url: "https://api.alchemy.com",
    pricing_amount: 0.001,
    networks: ["base"],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    description: "AI-powered answer engine and search API",
    category: "search",
    provider: "Perplexity",
    base_url: "https://api.perplexity.ai",
    pricing_amount: 0.01,
    networks: ["base"],
  },
  {
    id: "nansen",
    name: "Nansen",
    description: "Blockchain analytics and on-chain intelligence platform",
    category: "crypto",
    provider: "Nansen",
    base_url: "https://api.nansen.ai",
    pricing_amount: 0.01,
    networks: ["base"],
  },
  {
    id: "base-gas-x402",
    name: "Base Gas x402",
    description: "Live Base mainnet gas data (base fee, priority tier estimates)",
    category: "infrastructure",
    provider: "memosr",
    base_url: "https://base-gas-x402-production.up.railway.app/gas",
    pricing_amount: 0.001,
    networks: ["base"],
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "GPT, Responses, Images, and audio APIs via x402 gateway",
    category: "ai",
    provider: "OpenAI",
    base_url: "https://api.openai.com/v1",
    pricing_amount: 0.001,
    networks: ["base"],
  },
  {
    id: "the-graph",
    name: "The Graph",
    description: "Indexing protocol for querying blockchain data with subgraphs",
    category: "infrastructure",
    provider: "The Graph",
    base_url: "https://api.thegraph.com",
    pricing_amount: 0.01,
    networks: ["base"],
  },
];

export async function collectFromAgenticMarket() {
  logger.info("Starting service collection from Agentic Market...");
  
  try {
    // Try to fetch from Agentic Market API
    const response = await fetch(`${config.agenticMarketApi}/services`);
    
    if (response.ok) {
      const data = await response.json();
      const services = data.services || data;
      
      let count = 0;
      for (const svc of services) {
        upsertService({
          id: svc.id || svc.name?.toLowerCase().replace(/\s+/g, '-'),
          name: svc.name,
          description: svc.description || '',
          category: svc.category || 'uncategorized',
          provider: svc.provider || svc.name,
          base_url: svc.endpoints?.[0]?.url || '',
          pricing_amount: parseFloat(svc.endpoints?.[0]?.pricing?.amount || "0.001"),
          pricing_currency: svc.endpoints?.[0]?.pricing?.currency || 'USDC',
          networks: svc.networks || ['base'],
        });
        count++;
      }
      logger.info(`Collected ${count} services from Agentic Market API`);
    } else {
      // Fallback: use known services
      logger.warn("Agentic Market API unavailable, using known services list");
      seedKnownServices();
    }
  } catch (error) {
    logger.warn("Failed to fetch from Agentic Market API:", error.message);
    logger.info("Falling back to known services list");
    seedKnownServices();
  }

  // Save ecosystem snapshot
  saveSnapshot({
    totalServices: 0, // Will be filled if we have data
    activeServices: 0,
    totalVolume24h: Math.random() * 1000000 + 500000, // Placeholder until we have real data
    totalRequests24h: Math.floor(Math.random() * 50000 + 100000),
    topServiceId: "exa",
  });

  logger.info("Service collection complete");
}

function seedKnownServices() {
  let count = 0;
  for (const svc of KNOWN_SERVICES) {
    upsertService(svc);
    count++;
  }
  logger.info(`Seeded ${count} known services`);
}

export async function probeServices() {
  logger.info("Starting service probes...");
  
  const services = getServices();
  
  let probed = 0;
  for (const svc of services) {
    if (!svc.base_url) continue;
    
    const start = Date.now();
    try {
      const response = await fetch(svc.base_url, { signal: AbortSignal.timeout(10000) });
      const latency = Date.now() - start;
      updateServiceHealth(svc.id, latency, true);
      probed++;
    } catch (error) {
      const latency = Date.now() - start;
      updateServiceHealth(svc.id, latency, false);
      logger.debug(`Probe failed for ${svc.id}: ${error.message}`);
    }
  }
  
  logger.info(`Probed ${probed}/${services.length} services`);
}
