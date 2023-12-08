import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "config";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
  };
}

function auth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void | Response {
  const token = req.header("x-auth-token");
  if (!token) return res.status(401).send("Access denied, no token provided");

  try {
    const decoded = jwt.verify(token, config.get<string>("jwtPrivateKey"));
    req.user = decoded as { _id: string };
    next();
  } catch (error) {
    return res.status(400).send("Invalid token");
  }
}

export default auth;
