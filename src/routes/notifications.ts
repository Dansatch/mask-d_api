import express, { Request, Response } from "express";
import Notification, {
  INotification,
  validateNotification,
} from "../models/notification";
import auth, { AuthRequest } from "../middleware/auth";

const router = express.Router();

// GET route to get all notifications for a particular user with type filter
router.get("/", auth, async (req: AuthRequest, res: Response) => {
  try {
    const recipientId = req.user?._id;
    const { type } = req.query;

    const query: any = { recipientId };
    if (type) query.type = type;

    const notifications: INotification[] = await Notification.find(query);
    res.send(notifications);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

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
