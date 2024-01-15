import express, { Request, Response } from "express";
import mongoose, { FilterQuery } from "mongoose";
import Entry, { IEntry, validateEntry } from "../models/Entry";
import Comment from "../models/Comment";
import User from "../models/User";
import auth, { AuthRequest } from "../middleware/auth";
import validateEntryRights from "../middleware/validateEntryRights";
import validateObjectId from "../middleware/validateObjectId";

const router = express.Router();

async function getFilters(query: any, currentUserId: string): Promise<any> {
  // Sort order
  const { sortBy, sortOrder, timeFilter, authorId, searchText } = query;
  let sortOptions: any = {};
  if (sortBy) sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  const filter: FilterQuery<IEntry> = {};
  // Time filter
  if (timeFilter) {
    const now = new Date();
    switch (timeFilter) {
      case "today":
        filter.timestamp = {
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        };
        break;
      case "lastWeek":
        filter.timestamp = {
          $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        };
        break;
      case "lastMonth":
        filter.timestamp = {
          $gte: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        };
        break;
      case "lastYear":
        filter.timestamp = {
          $gte: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
        };
        break;
    }
  }

  // User filter
  if (authorId) filter.userId = authorId.toString();

  // Privacy filter
  if (authorId && currentUserId === authorId.toString()) {
    // Do nothing
  } else filter.isPrivate = false;

  // Search text filter
  if (searchText) {
    filter.$or = [
      { title: { $regex: searchText, $options: "i" } },
      { text: { $regex: searchText, $options: "i" } },
    ];
  }

  return { sortOptions, filter };
}

// GET route to get entries
router.get("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    // Filter data
    const { sortOptions, filter } = await getFilters(
      req.query,
      req.user?._id || ""
    );

    // Pagination data
    const page = parseInt(req.query.page as string) || 1; // Default page number is 1
    const pageSize = parseInt(req.query.pageSize as string) || 10; // Default page size is 10
    const skip = (page - 1) * pageSize;

    // Get entries
    const entries: IEntry[] = await Entry.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);
    res.send(entries);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// GET route to get an entry
router.get(
  "/:id",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      const entry: IEntry | null = await Entry.findById(req.params.id);
      if (!entry) return res.status(404).send("Entry not found");

      // Privacy checks
      if (
        entry.isPrivate &&
        entry.userId.toString() !== req.user?._id.toString()
      )
        return res.status(403).send("This is a private entry");

      res.send(entry);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// POST route to create an entry
router.post("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    const { error } = validateEntry(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findById(req.user?._id);
    if (!user) return res.status(400).send("User not found");

    const { title, text, commentDisabled } = req.body;

    const newEntry: IEntry = await Entry.create({
      title,
      text,
      userId: user._id,
      commentDisabled,
      isPrivate: user.isPrivate,
    });

    res.status(201).send(newEntry);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// PUT route to update an entry by its ID
router.put(
  "/:id",
  [auth, validateEntryRights],
  async (req: Request, res: Response) => {
    try {
      const { error } = validateEntry(req.body);
      if (error) return res.status(400).send(error.details[0].message);

      const { title, text, commentDisabled } = req.body;
      const updatedEntry: IEntry | null = await Entry.findByIdAndUpdate(
        req.params.id,
        { title, text, commentDisabled },
        { new: true }
      );

      if (!updatedEntry) return res.status(404).send("Entry not found");

      res.send(updatedEntry);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// PUT route to like an entry by its ID
router.put(
  "/:id/like",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      const entry: IEntry | null = await Entry.findById(req.params.id);
      if (!entry) return res.status(404).send("Entry not found");

      const userId = new mongoose.Types.ObjectId(req.user?._id);

      if (!entry.likes.includes(userId)) {
        entry.likes.push(userId);
        await entry.save();
      } else {
        return res.status(400).send("Entry is already liked");
      }

      res.status(200).send(entry);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// PUT route to unlike an entry by its ID
router.put(
  "/:id/unlike",
  [auth, validateObjectId],
  async (req: AuthRequest, res: Response) => {
    try {
      const entry: IEntry | null = await Entry.findById(req.params.id);
      if (!entry) return res.status(404).send("Entry not found");

      const userId = new mongoose.Types.ObjectId(req.user?._id);

      const index = entry.likes.indexOf(userId);
      if (index > -1) {
        entry.likes.splice(index, 1);
        await entry.save();
      } else {
        return res.status(400).send("Entry isn't liked");
      }

      res.status(200).json(entry);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// DELETE route to delete an entry
router.delete(
  "/:id",
  [auth, validateObjectId, validateEntryRights],
  async (req: Request, res: Response) => {
    try {
      const entry = await Entry.findByIdAndDelete(req.params.id);
      if (!entry) return res.status(404).send("Entry not found");

      await Comment.deleteMany({ entryId: req.params.id });

      return res.status(200).send("Entry deleted successfully");
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

export default router;
