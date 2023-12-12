import express, { Express } from "express";
import bodyParser from "body-parser";

import authRouter from "../routes/auth";
import usersRouter from "../routes/users";
import entriesRouter from "../routes/entries";
import commentsRouter from "../routes/comments";
import errorMiddleware from "../middleware/error";

export default function setupRoutes(app: Express): void {
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
  app.use(express.json());
  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/entries", entriesRouter);
  app.use("/api/comments", commentsRouter);
  app.use(errorMiddleware);
}
