import mongoose from "mongoose";
import { logger } from "./logging";
import config from "config";

const dbUrl: string = process.env.DB_URL || config.get("db");
const developmentEnv: (string | undefined)[] = ["development", undefined];

const dbConnect = (): void => {
  mongoose.connect(dbUrl).then(() => {
    if (developmentEnv.includes(process.env.NODE_ENV)) {
      logger.info(`Connected to ${dbUrl}...`);
    }
  });
};

export { dbUrl, dbConnect };
