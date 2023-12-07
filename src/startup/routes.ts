import express, { Express } from "express";
import bodyParser from "body-parser";

import usersRouter from "../routes/users";
import errorMiddleware from "../middleware/error";

export default function setupRoutes(app: Express): void {
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
  app.use(express.json());
  app.use("/api/users", usersRouter);
  app.use(errorMiddleware);
}
