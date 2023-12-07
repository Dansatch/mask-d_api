import { ErrorRequestHandler } from "express";
import { logger } from "../startup/logging";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.cause === "multer")
    return res.status(err.status || 400).json({
      error: err.message,
    });

  if (err.status) return res.status(err.status).send(err.message);

  logger.error(err.message, { error: err });
  res.status(500).send("Something went wrong, please try again later.");
};

export default errorHandler;
