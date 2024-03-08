import cors from "cors";
import { Express } from "express";
import getEnv from "../utils/getEnv";

export default function setupCors(app: Express): void {
  app.use(
    cors({
      origin: getEnv().webUrl,
      credentials: true,
    })
  );
}
