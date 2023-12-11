import { Response, NextFunction } from "express";
import Entry, { IEntry } from "../models/entry";
import { AuthRequest } from "./auth";

// Could pass the found entry object to request for increased efficiency
async function validateEntryRights(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const entry: IEntry | null = await Entry.findById(req.params.id);
    if (!entry) return res.status(404).send("Entry not found");

    const isCreator: boolean =
      req.user?._id.toString() === entry.userId.toString();

    if (isCreator) return next();

    return res.status(403).send("Access denied.");
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
}

export default validateEntryRights;
