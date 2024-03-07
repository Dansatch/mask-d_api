import express, { Request, Response } from "express";
import { FilterQuery } from "mongoose";
import Notification, {
  INotification,
  NotificationType,
  isValidNotificationType,
  validateNotification,
} from "../models/Notification";
import auth, { AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET query interface
interface RequestQuery {
  types?: NotificationType[];
}

// GET route to get all notifications for a particular user with type filter
router.get(
  "/",
  auth,
  async (req: AuthRequest & { query: RequestQuery }, res: Response) => {
    try {
      const recipientId = req.user?._id;
      const { types } = req.query;

      const query: FilterQuery<INotification> = { recipientId };
      if (types) {
        const typesArray = Array.isArray(types) ? types : [types];
        for (const t of typesArray) {
          if (!isValidNotificationType(t))
            return res.status(400).send("Invalid notification query type");

          query.type = { $in: types };
        }
      }

      const notifications: INotification[] = await Notification.find(query);
      res.send(notifications);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }
);

// POST route to create a notification
router.post("/", async (req: Request, res: Response) => {
  try {
    const { error } = validateNotification(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { recipientId, type, message, relatedUsername } = req.body;
    const notification = new Notification({
      recipientId,
      type,
      message,
      relatedUsername,
    });

    await notification.save();
    res.status(201).send(notification);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// DELETE route to delete notifications for a particular user with type filter
router.delete("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    const recipientId = req.user?._id;
    const { type } = req.query;

    const query: any = { recipientId };
    if (type) query.type = type;

    await Notification.deleteMany(query);
    res.sendStatus(204);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

export default router;
