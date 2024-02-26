import mongoose from "mongoose";
import { logger } from "./logging";
import getEnv from "../utils/getEnv";

const nodeEnv = process.env.NODE_ENV;

const dbUrl = getEnv().dbUrl;
const developmentEnv: (string | undefined)[] = ["development", undefined];

const setupDb = (): void => {
  mongoose.connect(dbUrl).then(() => {
    if (developmentEnv.includes(nodeEnv)) {
      logger.info(`Connected to ${dbUrl}...`);
    }
  });
};

export default setupDb;
