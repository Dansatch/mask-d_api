import mongoose from "mongoose";
import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import _ from "lodash";

import User, { IUser, validateUser } from "../models/User";
import auth, { AuthRequest } from "../middleware/auth";
import validateObjectId from "../middleware/validateObjectId";

const router = express.Router();

async function getFilters(query: any): Promise<any> {
  const { sortBy, sortOrder } = query;

  let sortOptions: any = {};
  if (sortBy) sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  return sortOptions;
}

// Get to get all users
router.get("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    const sortOptions = await getFilters(req.query);

    // Pagination data
    const page = parseInt(req.query.page as string) || 1; // Default page number is 1
    const pageSize = parseInt(req.query.pageSize as string) || 10; // Default page size is 10
    const skip = (page - 1) * pageSize;

    const users = await User.find()
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    res.send(users);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// Get to get user data from id or username
router.get("/:id", [auth], async (req: AuthRequest, res: Response) => {
  try {
    let user: IUser | null;

    if (mongoose.Types.ObjectId.isValid(req.params.id))
      user = await User.findById(req.params.id);
    else user = await User.findOne({ username: req.params.id });

    if (!user) return res.status(404).send("The user was not found.");

    res.send(user);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// Post to save a user
router.post("/", async (req: Request, res: Response) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Check if username exists
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser)
      return res.status(400).send("User with email already exists.");

    // Create new user
    const newUser: IUser = new User(_.pick(req.body, ["username", "password"]));

    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(newUser.password, salt);

    await newUser.save();

    const token = newUser.generateAuthToken();
    res
      .header("x-auth-token", token)
      .send(_.pick(newUser, ["_id", "username"]));
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// PUT route to update user's password
router.put(
  "/update-password",
  auth,
  async (req: AuthRequest, res: Response) => {
    try {
      // Fetch the user from the database
      const user: IUser | null = await User.findById(req.user?._id);
      if (!user) return res.status(404).send("User not found");

      // Validate current password from req.body
      const validPassword = await bcrypt.compare(
        req.body.currentPassword,
        user.password
      );
      if (!validPassword)
        return res.status(400).send("Invalid current password");

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.newPassword, salt);

      // Update the user's password
      user.password = hashedPassword;
      await user.save();

      res.status(200).send("Password updated successfully");
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// Put to follow a user
router.put(
  "/:id/follow",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      // Check for same ID
      if (req.params.id == req.user?._id)
        return res.status(400).send("You can't follow yourself");

      const userToFollow: IUser | null = await User.findById(req.params.id);
      const currentUser: IUser | null = await User.findById(req.user?._id);

      if (!userToFollow || !currentUser)
        return res.status(404).send("User not found");

      if (currentUser.following.includes(userToFollow._id))
        return res.status(400).send("You are already following this user");

      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      await currentUser.save();
      await userToFollow.save();

      res.status(200).send(currentUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// Put to unfollow a user
router.put(
  "/:id/unfollow",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      // Check for same ID
      if (req.params.id == req.user?._id)
        return res.status(400).send("You can't unfollow yourself");

      const userToUnfollow: IUser | null = await User.findById(req.params.id);
      const currentUser: IUser | null = await User.findById(req.user?._id);

      if (!userToUnfollow || !currentUser)
        return res.status(404).send("User not found");

      if (!currentUser.following.includes(userToUnfollow._id))
        return res.status(400).send("You're not following this user");

      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== userToUnfollow._id.toString()
      );
      userToUnfollow.followers = userToUnfollow.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );

      await currentUser.save();
      await userToUnfollow.save();

      res.status(200).send(currentUser);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// DELETE route to delete a user account
router.delete(
  "/delete-account",
  auth,
  async (req: AuthRequest, res: Response) => {
    try {
      // Find the user in the database
      const user: IUser | null = await User.findById(req.user?._id);
      if (!user) return res.status(404).send("User not found");

      // Delete the user account
      await User.findByIdAndDelete(req.user?._id);

      res.status(200).send("User account deleted successfully");
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

export default router;
