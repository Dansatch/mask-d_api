import { Response, NextFunction } from "express";
import Comment, { IComment } from "../models/comment";
import { AuthRequest } from "./auth";

// Could pass the found entry object to request for increased efficiency
async function validateCommentRights(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const comment: IComment | null = await Comment.findById(
      req.params.commentId
    );
    if (!comment) return res.status(404).send("Comment not found");

    const isCreator: boolean =
      req.user?._id.toString() === comment.userId.toString();

    if (isCreator) return next();

    return res.status(403).send("Access denied.");
  } catch (error: any) {
    return res.status(500).send(error.message);
  }
}

export default validateCommentRights;
