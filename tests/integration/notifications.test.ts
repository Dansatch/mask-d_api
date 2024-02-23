import { Server } from "http";
import request from "supertest";
import mongoose from "mongoose";
import Notification, { INotification } from "../../src/models/Notification";
import User from "../../src/models/User";

describe("/api/notifications", () => {
  let app: Server;

  beforeEach(() => {
    app = require("../../src/index");
  });

  afterEach(() => {
    app.close();
  });

  describe("GET /", () => {
    let token: string;
    let query: any;

    const exec = async () => {
      return await request(app)
        .get(`/api/notifications`)
        .query(query)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
      });
      token = currentUser.generateAuthToken();

      await Notification.insertMany([
        {
          recipientId: currentUser._id,
          type: "newEntry",
          message: "A new entry by user2",
        },
        {
          recipientId: currentUser._id,
          type: "followAlert",
          message: "A new entry by user3",
        },
        {
          recipientId: new mongoose.Types.ObjectId(),
          type: "newEntry",
          message: "A new entry by user1",
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Notification.deleteMany({});
    });

    it("should get all notifications for a user", async () => {
      const response = await exec();

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it("should get notifications for a user with a specific type", async () => {
      query = { types: ["followAlert"] };
      const response = await exec();

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it("should return error for invalid notification query type", async () => {
      query = { types: ["invalidType"] };
      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("POST /", () => {
    let payload: Partial<INotification>;

    const exec = async () => {
      return await request(app).post(`/api/notifications`).send(payload);
    };

    afterEach(async () => {
      await Notification.deleteMany({});
    });

    it("should create a notification", async () => {
      payload = {
        recipientId: new mongoose.Types.ObjectId(),
        type: "newEntry",
        message: "This is a notification message.",
        relatedUsername: "relatedUser123",
      };

      const response = await exec();

      expect(response.status).toBe(201);
    });

    it("should return 400 if request body is invalid", async () => {
      // Missing type
      payload = {
        recipientId: new mongoose.Types.ObjectId(),
        message: "This is a notification message.",
        relatedUsername: "relatedUser123",
      };

      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /", () => {
    let token: string;
    let query: any;
    let userId: string;

    const exec = async () => {
      return await request(app)
        .delete(`/api/notifications`)
        .query(query)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
      });
      token = currentUser.generateAuthToken();
      userId = currentUser._id;

      await Notification.insertMany([
        {
          recipientId: currentUser._id,
          type: "newEntry",
          message: "A new entry by user2",
        },
        {
          recipientId: currentUser._id,
          type: "followAlert",
          message: "A new entry by user3",
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Notification.deleteMany({});
    });

    it("should delete all notifications for a user", async () => {
      const response = await exec();

      expect(response.status).toBe(204);
    });

    it("should delete notifications for a user with a specific type", async () => {
      query = { type: "newEntry" };

      const response = await exec();

      expect(response.status).toBe(204);
      const notifications = await Notification.find({ recipientId: userId });
      expect(notifications).toHaveLength(1);
    });
  });
});
