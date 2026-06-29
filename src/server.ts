import { createServer } from "http";
import { config } from "./config";
import { connectToDatabase } from "./db/db-connection";
import { ExpressApp } from "./express-app";
import { ensureSystemInitialization } from "./scripts/system-init";
import { HandleUnCaughtException } from "./util/error/handler";
import { logger } from "./util";

const PORT = config.app.port;

export const StartServer = async () => {
  try {
    // 1. Connect to the database.
    await connectToDatabase();

    // 2. Bootstrap (seed administrator).
    await ensureSystemInitialization();
    logger.info("System initialization completed");
  } catch (err) {
    logger.error(`Error during startup: ${err}`);
    process.exit(1);
  }

  // 3. Start the HTTP server.
  const expressApp = await ExpressApp();
  const httpServer = createServer(expressApp);
  httpServer.listen(PORT, () => {
    logger.info(`Innopolis PLM API listening on port ${PORT}`);
  });
};

process.on("uncaughtException", HandleUnCaughtException);
process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

StartServer().then(() => {
  logger.info("Server is up and running — version 1.0.0");
});
