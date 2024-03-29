import Joi from "joi";
import mongoose, { Schema, Document, Model } from "mongoose";
import jwt from "jsonwebtoken";
import getEnv from "../utils/getEnv";

export interface IUser extends Document {
  username: string;
  password: string;
  isPrivate: boolean;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  timestamp: Date;
  generateAuthToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  timestamp: { type: Date, default: Date.now },
});

userSchema.methods.generateAuthToken = function (this: IUser): string {
  return jwt.sign({ _id: this._id }, getEnv().jwtPrivateKey);
};

const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);

export function validateUser(user: {
  username: string;
  password: string;
}): Joi.ValidationResult {
  const schema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().min(5).max(255).required(),
    isPrivate: Joi.boolean(),
  });

  return schema.validate(user);
}

export default User;
