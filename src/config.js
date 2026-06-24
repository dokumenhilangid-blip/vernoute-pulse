import "dotenv/config";

const config = {
  port: process.env.PORT || 3000,
  
  // Database
  dbPath: process.env.DATABASE_URL || "./data/vernoute.db",

  // Agentic Market API
  agenticMarketApi: process.env.AGENTIC_MARKET_API || "https://api.agentic.market/v1",

  // Base blockchain
  baseRpc: process.env.BASE_RPC_URL || "https://mainnet.base.org",

  // Collection intervals (in minutes)
  collectInterval: parseInt(process.env.COLLECT_INTERVAL || "360"), // 6 hours
  probeInterval: parseInt(process.env.PROBE_INTERVAL || "30"), // 30 minutes

  // x402 payment config (for paid API tier)
  payToAddress: process.env.PAY_TO_ADDRESS,
  cdpApiKeyId: process.env.CDP_API_KEY_ID,
  cdpApiKeySecret: process.env.CDP_API_KEY_SECRET,
  paymentNetwork: "eip155:8453", // Base mainnet

  // Version
  version: "1.0.0",
};

export default config;
