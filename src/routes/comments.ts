import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Comment, { IComment, validateComment } from "../models/Comment";
import auth, { AuthRequest } from "../middleware/auth";
import validateCommentRights from "../middleware/validateCommentRights";
import validateObjectId from "../middleware/validateObjectId";

const router = express.Router();

// Get to get all comments under an entry
router.get("/:entryId", [auth], async (req: Request, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.entryId))
      return res.status(400).send("Invalid entry ID.");

    const comments: IComment[] = await Comment.find({
      entryId: req.params.entryId,
    }).sort({ likes: -1 });
    res.send(comments);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// GET to get commentCount
router.get("/:entryId/count", auth, async (req: Request, res: Response) => {
  try {
    const commentCount: number = await Comment.countDocuments({
      entryId: req.params.entryId,
    });
    res.json({ commentCount });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// POST to create a comment
router.post("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateComment(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { text, entryId } = req.body;
    const comment: IComment = new Comment({
      text,
      entryId,
      userId: req.user?._id,
    });
    await comment.save();

    res.status(201).send(comment);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// PUT to update a comment
router.put(
  "/:id",
  [auth, validateObjectId, validateCommentRights],
  async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      const comment = await Comment.findByIdAndUpdate(
        req.params.id,
        { $set: { text } },
        { new: true }
      );
      if (!comment) return res.status(404).send("Comment not found");

      res.send(comment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// PUT route to like a comment
router.put(
  "/:id/like",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      const comment: IComment | null = await Comment.findById(req.params.id);
      if (!comment) return res.status(404).send("Comment not found");

      const userId = new mongoose.Types.ObjectId(req.user?._id);

      if (!comment.likes.includes(userId)) {
        comment.likes.push(userId);
        await comment.save();
      } else {
        return res.status(400).send("Comment is already liked");
      }

      res.status(200).send(comment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// PUT route to unlike a comment
router.put(
  "/:id/unlike",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      const comment: IComment | null = await Comment.findById(req.params.id);
      if (!comment) return res.status(404).send("Comment not found");

      const userId = new mongoose.Types.ObjectId(req.user?._id);

      const index = comment.likes.indexOf(userId);
      if (index > -1) {
        comment.likes.splice(index, 1);
        await comment.save();
      } else {
        return res.status(400).send("Comment isn't liked");
      }

      res.status(200).json(comment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// DELETE to delete a comment
router.delete(
  "/:id",
  [auth, validateObjectId, validateCommentRights],
  async (req: Request, res: Response) => {
    try {
      const comment = await Comment.findOneAndDelete({
        _id: req.params.id,
      });
      if (!comment) return res.status(404).send("Comment not found");

      res.send(comment);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

export default router;
