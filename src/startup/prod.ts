import helmet from "helmet";
import compression from "compression";
import { Express } from "express";

export default function setupSecurityAndCompression(app: Express): void {
  app.use(helmet());
  app.use(compression());
}
