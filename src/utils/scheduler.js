import config from "../config.js";
import { collectFromAgenticMarket, probeServices } from "../collectors/agentic-market.js";
import { logger } from "./logger.js";

export function startScheduler() {
  // Run initial collection immediately
  setTimeout(async () => {
    logger.info("Initial collection: Agentic Market services...");
    try {
      await collectFromAgenticMarket();
    } catch (error) {
      logger.error("Initial collection failed:", error.message);
    }
  }, 2000);

  // Collect services every 6 hours (21600000 ms)
  setInterval(async () => {
    logger.info("Scheduled: collecting services from Agentic Market");
    try {
      await collectFromAgenticMarket();
    } catch (error) {
      logger.error("Scheduled collection failed:", error.message);
    }
  }, config.collectInterval * 1000);

  // Probe service health every 30 minutes (1800000 ms)
  setInterval(async () => {
    logger.info("Scheduled: probing service health");
    try {
      await probeServices();
    } catch (error) {
      logger.error("Scheduled probe failed:", error.message);
    }
  }, config.probeInterval * 1000);

  logger.info(`Scheduler started: collect(every ${config.collectInterval / 60}h), probe(every ${config.probeInterval}m)`);
}
