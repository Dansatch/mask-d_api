import cookieParser from "cookie-parser";
import { Express } from "express";

export default function setupCookies(app: Express): void {
  app.use(cookieParser());
}
