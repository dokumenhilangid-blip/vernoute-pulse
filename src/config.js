// Config — values come from env bindings in Cloudflare Workers
export default {
  version: "1.0.0",
  agenticMarketApi: "https://api.agentic.market/v1",
  collectInterval: 6 * 60 * 60,      // 6 hours (for cron: "0 */6 * * *")
  probeInterval: 30 * 60,             // 30 minutes (for cron: "*/30 * * * *")
};
