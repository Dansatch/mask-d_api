import dotenv from "dotenv";
dotenv.config();

import { connect, disconnect } from "mongoose";
import User from "./models/Usere";
import Entry from "./models/Entrye";
import Comment from "./models/Commente";
import Notification from "./models/Notificatione";
import users from "./seed-data/users";
import entries from "./seed-data/entries";
import comments from "./seed-data/comments";
import notifications from "./seed-data/notifications";
import getEnv from "./utils/getEnv";

async function seed() {
  // Connect to DB
  await connect(getEnv().dbUrl);

  // Delete existing data
  await User.deleteMany({});
  await Entry.deleteMany({});
  await Comment.deleteMany({});
  await Notification.deleteMany({});

  // Insert new data
  await User.insertMany(users);
  await Entry.insertMany(entries);
  await Comment.insertMany(comments);
  await Notification.insertMany(notifications);

  disconnect();

  console.info("Beta data seeded!");
}

seed();
