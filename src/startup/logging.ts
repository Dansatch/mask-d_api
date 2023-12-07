import winston, { Logger } from "winston";
import "express-async-errors";

const logger: Logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ format: winston.format.colorize() }),
    new winston.transports.File({ filename: "logfile.log" }),
  ],
});

function log(): void {
  process.on("unhandledRejection", (ex) => {
    logger.error(ex);
  });

  process.on("uncaughtException", (ex) => {
    logger.error(ex);
  });
}

export { logger, log };
