import config from "../config.js";
import { upsertService, updateServiceHealth, getServices, saveSnapshot, memClear } from "../db.js";

const KNOWN_SERVICES = [
  { name: "Exa", category: "Search", pricing_amount: 0.003, base_url: "https://api.exa.ai/contents", description: "AI-powered web search + content retrieval" },
  { name: "Claude", category: "Inference", pricing_amount: 0.001, base_url: "https://api.venice.ai/api/v1/chat/completions", description: "Claude models and Anthropic-compatible message access" },
  { name: "Tripadvisor", category: "Data", pricing_amount: 0.01, base_url: "https://tripadvisor.x402.paysponge.com/api/v1/location/:locationId/details", description: "Travel content API" },
  { name: "The Graph", category: "Data", pricing_amount: 0.001, base_url: "https://gateway.thegraph.com/api/x402/subgraphs/id/{subgraph_id}", description: "Indexing protocol for blockchain data" },
  { name: "ChatGPT", category: "Inference", pricing_amount: 0.001, base_url: "https://api.venice.ai/api/v1/models", description: "GPT, Responses, Images APIs" },
  { name: "Deepgram", category: "Media", pricing_amount: 1.0, base_url: "https://deepgram.x402.paysponge.com/v1/listen", description: "Speech-to-text and audio intelligence" },
  { name: "CoinMarketCap", category: "Data", pricing_amount: 0.01, base_url: "https://pro-api.coinmarketcap.com/x402/v3/cryptocurrency/quotes/latest", description: "Crypto prices and market data" },
  { name: "Alchemy", category: "Infra", pricing_amount: 0.001, base_url: "https://x402.alchemy.com/{chainNetwork}/v2", description: "Blockchain developer platform" },
  { name: "Perplexity", category: "Search", pricing_amount: 0.01, base_url: "https://pplx.x402.paysponge.com/search", description: "AI search API" },
  { name: "DeepSeek", category: "Inference", pricing_amount: 0.001, base_url: "https://api.venice.ai/api/v1/chat/completions", description: "Frontier LLM for coding and reasoning" },
  { name: "CoinGecko", category: "Data", pricing_amount: 0.01, base_url: "https://pro-api.coingecko.com/api/v3/x402/onchain/search/pools", description: "Crypto market data" },
  { name: "Tavily", category: "Search", pricing_amount: 0.01, base_url: "https://x402.tavily.com/search", description: "AI-native web search for agents" },
  { name: "Browserbase", category: "Search", pricing_amount: 0.002, base_url: "https://x402.browserbase.com/browser/session/:id/extend", description: "Headless browser sessions" },
  { name: "AgentMail", category: "Social", pricing_amount: 0.001, base_url: "https://x402.api.agentmail.to/v0/api-keys/{api_key_id}", description: "Send and receive email as an AI agent" },
  { name: "QuickNode", category: "Data", pricing_amount: 10, base_url: "https://x402.quicknode.com/base-mainnet", description: "RPC and blockchain API across 80+ chains" },
  { name: "Firecrawl", category: "Search", pricing_amount: 0.01, base_url: "https://mesh.heurist.xyz/x402/agents/FirecrawlSearchDigestAgent/firecrawl_web_search", description: "Scrape websites into LLM-ready text" },
  { name: "Messari", category: "Data", pricing_amount: 0.35, base_url: "https://api.messari.io/funding/v1/funds", description: "Crypto research data" },
  { name: "Wolfram|Alpha", category: "Data", pricing_amount: 0.01, base_url: "https://wolframalpha.x402.paysponge.com/v1/result", description: "Computational intelligence engine" },
  { name: "StableUpload", category: "Storage", pricing_amount: 0.005, base_url: "https://stableupload.dev/api/site", description: "File hosting + static sites" },
  { name: "StableDomains", category: "Infra", pricing_amount: 0.001, base_url: "https://stabledomains.dev/api/domain/list", description: "Domain registration" },
  { name: "StableEmail", category: "Social", pricing_amount: 1, base_url: "https://stableemail.dev/api/inbox/buy", description: "Send/receive email with custom domains" },
  { name: "StableMerch", category: "Other", pricing_amount: 25, base_url: "https://stablemerch.dev/api/heavyweight-shirt", description: "Custom merchandise ordering" },
  { name: "Zapper", category: "Data", pricing_amount: 0.001125, base_url: "https://public.zapper.xyz/x402/account-identity", description: "Portfolio data and DeFi positions" },
  { name: "Nansen", category: "Data", pricing_amount: 0.01, base_url: "https://api.nansen.ai/api/v1/chains/chain-rank", description: "Wallet labels and analytics" },
  { name: "Questflow", category: "Inference", pricing_amount: 0.001, base_url: "https://api.questflow.ai/x402/swarm/:swarmId", description: "Multi-agent orchestration" },
  { name: "SLAMai", category: "Data", pricing_amount: 0.001585, base_url: "https://api.slamai.dev/chain/tokens/newest", description: "Smart money intelligence" },
  { name: "Heurist Mesh", category: "Data", pricing_amount: 0.01, base_url: "https://mesh.heurist.xyz/x402/agents/AIXBTProjectInfoAgent/get_market_summary", description: "Twitter intel and wallet analysis" },
  { name: "BlockRun.AI", category: "Inference", pricing_amount: 0.005, base_url: "https://blockrun.ai/api/v1/defillama/chains", description: "LLM gateway (GPT/Claude/Gemini)" },
  { name: "Allium", category: "Data", pricing_amount: 0.02, base_url: "https://agents.allium.so/api/v1/developer/prices/at-timestamp", description: "Onchain data explorer" },
  { name: "Dripstack", category: "Data", pricing_amount: 0.1, base_url: "https://dripstack.xyz/api/v1/publications/:publicationSlug/:postSlug", description: "Pay-per-article access" },
  { name: "Run402", category: "Infra", pricing_amount: 5, base_url: "https://api.run402.com/tiers/v1/hobby", description: "AI-native Postgres + REST API" },
  { name: "RentCast", category: "Data", pricing_amount: 0.01, base_url: "https://rentcast.x402.paysponge.com/markets", description: "Real estate data API" },
  { name: "ScreenshotOne", category: "Data", pricing_amount: 0.02, base_url: "https://screenshotone.x402.paysponge.com/animate", description: "Screenshot and screen recording API" },
  { name: "SpyFu", category: "Data", pricing_amount: 0.001, base_url: "https://spyfu.x402.paysponge.com/apis/accounts_api/v2/usage/month/:usageDate", description: "Competitor intelligence API" },
  { name: "Apollo", category: "Data", pricing_amount: 0.0495, base_url: "https://stableenrich.dev/api/apollo/org-enrich", description: "People and company search" },
  { name: "Hunter", category: "Data", pricing_amount: 0.03, base_url: "https://stableenrich.dev/api/hunter/email-verifier", description: "Email verification" },
  { name: "Amadeus", category: "Travel", pricing_amount: 0.05, base_url: "https://stabletravel.dev/api/flights/search", description: "Flights and travel data" },
  { name: "FlightAware", category: "Travel", pricing_amount: 0.1, base_url: "https://stabletravel.dev/api/flightaware/flights/search", description: "Real-time flight tracking" },
  { name: "Parallel", category: "Data", pricing_amount: 0.01, base_url: "https://parallelmpp.dev/api/search", description: "AI-powered financial analysis" },
  { name: "JeetScreener", category: "Data", pricing_amount: 0.001, base_url: "https://jeetscreener.io/api/market/financials/AAPL", description: "Token screening and analysis" },
  { name: "Capminal", category: "Data", pricing_amount: 0.01, base_url: "https://www.capminal.ai/api/x402/research", description: "Financial market data" },
  { name: "BlackSwan", category: "Data", pricing_amount: 0.03, base_url: "https://x402.blackswan.wtf/smart-agents/core", description: "Real-time risk intelligence" },
  { name: "EMC2 AI", category: "Data", pricing_amount: 0.85, base_url: "https://emc2ai.io/x402/bitquery/alphaleaders/raw", description: "Wallet leaderboard and holder analysis" },
  { name: "PostalForm", category: "Social", pricing_amount: 3.4, base_url: "https://postalform.com/api/machine/orders", description: "Print and mail physical letters" },
  { name: "Melis Notify", category: "Social", pricing_amount: 0.005, base_url: "https://notify.melis.ai/email", description: "Pay-per-email notification" },
  { name: "Gloria AI", category: "Data", pricing_amount: 0.03, base_url: "https://api.itsgloria.ai/news", description: "Real-time customizable news" },
  { name: "dTelecom STT", category: "Media", pricing_amount: 0.025, base_url: "https://x402stt.dtelecom.org/v1/session", description: "Real-time speech-to-text" },
  { name: "Portal Foundation", category: "Media", pricing_amount: 1, base_url: "https://gen.portalfoundation.ai/api/generate-video", description: "AI image and video generation" },
  { name: "Agent Camo", category: "Infra", pricing_amount: 0.01, base_url: "https://api.agentcamo.xyz/sessions", description: "Residential proxy sessions" },
  { name: "Mycelia Signal", category: "Trading", pricing_amount: 0.001, base_url: "https://api.myceliasignal.com/sho/info", description: "Cryptographic price oracle" },
  { name: "Cambrian", category: "Data", pricing_amount: 0.05, base_url: "https://x402.cambrian.network/x402/api/v1/evm/price-current", description: "Onchain + offchain financial intelligence" },
  { name: "Minifetch", category: "Data", pricing_amount: 0.002, base_url: "https://minifetch.com/api/v1/x402/extract/url-content", description: "Structured web content extraction" },
  { name: "Hyperbrowser", category: "Search", pricing_amount: 0.001, base_url: "https://api.hyperbrowser.ai/x402/web/fetch", description: "Headless browser and web scraping" },
  { name: "Magnific", category: "Media", pricing_amount: 0.001, base_url: "https://freepik.x402.paysponge.com/v1/ai/audio-isolation", description: "AI image upscaling" },
  { name: "fal.ai", category: "Media", pricing_amount: 0.01, base_url: "https://fal.x402.paysponge.com/fal-ai/fast-sdxl", description: "AI model inference" },
  { name: "Google Gemini", category: "Inference", pricing_amount: 0.001, base_url: "https://api.venice.ai/api/v1/chat/completions", description: "Gemini models via x402 gateways" },
  { name: "Zerion", category: "Data", pricing_amount: 0.01, base_url: "https://api.zerion.io/v1/wallets/{address}/portfolio", description: "DeFi/web3 interactions for agents" },
  { name: "Fanfare", category: "Data", pricing_amount: 0.25, base_url: "https://fanfare.run/mlb/flights", description: "Real-time sports intelligence" },
];

export async function collectFromAgenticMarket(env) {
  console.log("Starting service collection from Agentic Market...");
  let count = 0;

  try {
    const response = await fetch(`${config.agenticMarketApi}/services`, {
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = await response.json();
      const services = data.services || data.data || data || [];

      for (const svc of services) {
        const id = svc.id || svc.name?.toLowerCase().replace(/\s+/g, "-");
        if (!id) continue;

        await upsertService(env, {
          id,
          name: svc.name || id,
          description: svc.description || "",
          category: svc.category || "uncategorized",
          provider: svc.provider || svc.name,
          base_url: svc.endpoints?.[0]?.url || "",
          pricing_amount: parseFloat(svc.endpoints?.[0]?.pricing?.amount || "0.001"),
          pricing_currency: svc.endpoints?.[0]?.pricing?.currency || "USDC",
          networks: svc.networks || ["base"],
        });
        count++;
      }

      console.log(`Collected ${count} services from Agentic Market API`);
    } else {
      throw new Error(`API returned ${response.status}`);
    }
  } catch (error) {
    console.warn("Failed to fetch from Agentic Market API:", error.message);
    console.log("Falling back to known services list");
    await seedKnownServices(env);
    count = KNOWN_SERVICES.length;
  }

  // Save ecosystem snapshot
  const services = await getServices(env);
  const totalVolume = services.reduce((sum, s) => sum + (s.volume_24h || 0), 0);
  const totalRequests = services.reduce((sum, s) => sum + (s.requests_24h || 0), 0);

  await saveSnapshot(env, {
    totalServices: count,
    activeServices: count,
    totalVolume24h: totalVolume || 0,
    totalRequests24h: totalRequests || 0,
  });

  // Clear in-memory cache so fresh data is served
  memClear();

  console.log("Service collection complete");
}

async function seedKnownServices(env) {
  for (const svc of KNOWN_SERVICES) {
    const id = svc.name.toLowerCase().replace(/\s+/g, "-").replace(/[|]/g, "");
    await upsertService(env, {
      id,
      ...svc,
      pricing_currency: "USDC",
      networks: ["base"],
    });
  }
  console.log(`Seeded ${KNOWN_SERVICES.length} known services`);
}

export async function probeServices(env) {
  console.log("Starting service probes...");
  const services = await getServices(env);
  let probed = 0;

  for (const svc of services) {
    if (!svc.base_url) continue;
    const start = Date.now();
    try {
      await fetch(svc.base_url, { signal: AbortSignal.timeout(10000) });
      const latency = Date.now() - start;
      await updateServiceHealth(env, svc.id, latency, true);
      probed++;
    } catch {
      const latency = Date.now() - start;
      await updateServiceHealth(env, svc.id, latency, false);
    }
  }

  console.log(`Probed ${probed}/${services.length} services`);
}
