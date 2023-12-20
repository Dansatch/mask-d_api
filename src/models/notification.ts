import Joi from "joi";
import mongoose, { Schema, Document, Model } from "mongoose";

export type NotificationType = "newEntry" | "followAlert" | "other";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedUsername: string;
  timestamp: Date;
}

const notificationSchema: Schema<INotification> =
  new mongoose.Schema<INotification>({
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["newEntry", "followAlert", "other"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedUsername: String,
    timestamp: { type: Date, default: Date.now },
  });

const Notification: Model<INotification> = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export function validateNotification(notification: {
  recipientId: string;
  type: string;
  message: string;
  relatedUsername?: string;
}): Joi.ValidationResult {
  const schema = Joi.object({
    recipientId: Joi.objectId().required(),
    type: Joi.string().valid("newEntry", "followAlert", "other").required(),
    message: Joi.string().required(),
    relatedUsername: Joi.string(),
  });

  return schema.validate(notification);
}

export default Notification;
