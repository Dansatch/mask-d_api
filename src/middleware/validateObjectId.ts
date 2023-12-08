import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

const validateObjectId = (req: Request, res: Response, next: NextFunction) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send("Invalid ID.");
  }
  next();
};

export default validateObjectId;
