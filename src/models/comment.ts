import Joi from "joi";
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
  text: string;
  entryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  timestamp: Date;
}

const commentSchema: Schema<IComment> = new mongoose.Schema<IComment>({
  text: {
    type: String,
    required: true,
  },
  entryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Entry",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  timestamp: { type: Date, default: Date.now },
});

const Comment: Model<IComment> = mongoose.model<IComment>(
  "Comment",
  commentSchema
);

export function validateComment(user: {
  text: string;
  entryId: string;
}): Joi.ValidationResult {
  const schema = Joi.object({
    text: Joi.string().required(),
    entryId: Joi.objectId().required(),
  });

  return schema.validate(user);
}

export default Comment;
