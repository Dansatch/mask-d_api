/// <reference path="./@types/joi.d.ts" />

import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import config from "config";
import { log, logger } from "./startup/logging";
import { dbConnect } from "./startup/db";
import setupCors from "./startup/cors";
import setupRoutes from "./startup/routes";
import setupConfig from "./startup/config";
import setupValidation from "./startup/validation";
import setupProd from "./startup/prod";

const app: Express = express();
log();
dbConnect();
setupCors(app);
setupRoutes(app);
setupConfig();
setupValidation();
setupProd(app);

const port: number | string = process.env.PORT || config.get("port");
const developmentEnv: (string | undefined)[] = ["development", undefined];

const server = app.listen(port, () => {
  if (developmentEnv.includes(process.env.NODE_ENV)) {
    logger.info(`Listening on port ${port}....`);
  }
});

export = server;
