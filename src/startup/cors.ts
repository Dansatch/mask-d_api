import cors from "cors";
import { Express } from "express";

export default function setupCors(app: Express): void {
  app.use(cors());
}
