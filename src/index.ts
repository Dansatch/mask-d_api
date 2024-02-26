/// <reference path="./@types/joi.d.ts" />

import dotenv from "dotenv";
dotenv.config();

import express, { Express } from "express";
import { log, logger } from "./startup/logging";
import setupDb from "./startup/db";
import setupCors from "./startup/cors";
import setupRoutes from "./startup/routes";
import setupJwt from "./startup/jwt";
import setupValidation from "./startup/validation";
import setupProd from "./startup/prod";
import setupCookies from "./startup/cookies";
import getEnv from "./utils/getEnv";

const app: Express = express();
setupJwt();
log();
setupDb();
setupCors(app);
setupCookies(app);
setupRoutes(app);
setupValidation();
setupProd(app);

const port: number | string = getEnv().port;
const developmentEnv: (string | undefined)[] = ["development", undefined];

const server = app.listen(port, () => {
  if (developmentEnv.includes(process.env.NODE_ENV)) {
    logger.info(`Listening on port ${port}....`);
  }
});

export = server;
