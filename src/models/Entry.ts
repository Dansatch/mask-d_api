import Joi from "joi";
import mongoose, { Schema, Document, Model, ObjectId } from "mongoose";

export interface IEntry extends Document {
  title: string;
  text: string;
  userId: mongoose.Types.ObjectId;
  commentDisabled: boolean;
  timestamp: Date;
  likes: mongoose.Types.ObjectId[];
}

const entrySchema: Schema<IEntry> = new mongoose.Schema<IEntry>({
  title: {
    type: String,
  },
  text: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  commentDisabled: {
    type: Boolean,
    default: false,
  },
  timestamp: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

entrySchema.index({ title: "text", text: "text" }); // Text index for close matching search pattern

const Entry: Model<IEntry> = mongoose.model<IEntry>("Entry", entrySchema);

export function validateEntry(entry: {
  title: string;
  text: string;
  commentDisabled: boolean;
}): Joi.ValidationResult {
  const schema = Joi.object({
    title: Joi.string().min(3).max(255),
    text: Joi.string().required(),
    commentDisabled: Joi.boolean(),
  });

  return schema.validate(entry);
}

export default Entry;
