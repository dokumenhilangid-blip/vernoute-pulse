import "dotenv/config";
import { startServer } from "./server.js";
import { startScheduler } from "./utils/scheduler.js";
import { logger } from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

async function main() {
  logger.info("Vernoute Pulse starting...");

  // Start scheduler for data collection
  startScheduler();
  logger.info("Data collection scheduler started");

  // Start HTTP server
  const app = startServer();
  app.listen(PORT, () => {
    logger.info(`Vernoute Pulse listening on http://localhost:${PORT}`);
    logger.info(`  Overview: GET /v1/pulse/overview`);
    logger.info(`  Services: GET /v1/pulse/services`);
    logger.info(`  Service:  GET /v1/pulse/services/:id`);
    logger.info(`  Info:     GET /info`);
    logger.info(`  Docs:     GET /`);
  });
}

main().catch((err) => {
  logger.error("Fatal startup error:", err);
  process.exit(1);
});
