import { Server } from "http";
import request from "supertest";
import mongoose from "mongoose";
import Entry, { IEntry } from "../../src/models/Entry";
import Comment from "../../src/models/Comment";
import User from "../../src/models/User";

describe("/api/entries", () => {
  let app: Server;

  beforeEach(() => {
    app = require("../../src/index");
  });

  afterEach(() => {
    app.close();
  });

  describe("GET /", () => {
    let token: string;
    let currentUserId: string;
    let query: any;
    let otherUserId: string = new mongoose.Types.ObjectId().toHexString();

    const exec = async () => {
      return await request(app)
        .get(`/api/entries`)
        .query(query)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const followingUserId = new mongoose.Types.ObjectId();
      const followingUser2Id = new mongoose.Types.ObjectId();

      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
        following: [followingUserId, followingUser2Id],
      });
      currentUserId = currentUser._id;
      token = currentUser.generateAuthToken();

      await Entry.insertMany([
        {
          title: "Entry1",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry2",
          text: "RandomText",
          userId: followingUserId,
        },
        {
          title: "Entry3",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        { title: "Entry4", text: "RandomText", userId: currentUser._id },
        {
          title: "Entry5",
          text: "RandomText2",
          userId: followingUserId,
          timestamp: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Entry6",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
          timestamp: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        },
        {
          title: "Entry7",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
          likes: [otherUserId],
        },
        {
          title: "Entry8",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
          timestamp: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
          likes: [otherUserId, new mongoose.Types.ObjectId()],
        },
        {
          title: "Entry9",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
          timestamp: new Date(Date.now() - 2 * 30 * 24 * 60 * 60 * 1000),
        },
        { title: "Entry10", text: "RandomText", userId: currentUser._id },
        {
          title: "Entry11",
          text: "RandomText",
          userId: followingUser2Id,
        },
        {
          title: "Entry12",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should get entries without any filters or pagination", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].title).toBe("Entry1"); // 1st entry in array
    });

    it("should get entries with sorting and pagination", async () => {
      query = { sortOption: "-likes", page: 1, pageSize: 6 }; // descending order

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe("Entry8"); // has most likes
      expect(res.body.data).toHaveLength(6);
    });

    it("should get entries with time filters", async () => {
      query = { timeFilter: "lastMonth" };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(8);
    });

    it("should get entries with authorId filter", async () => {
      query = { authorId: currentUserId.toString() };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("Entry4");
    });

    it("should get entries with following filter", async () => {
      query = { followingOnly: 1 };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe("Entry2");
    });

    it("should not get entries with privacy filter", async () => {
      query = {};
      await Entry.findOneAndUpdate({ title: "Entry1" }, { isPrivate: true });

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).not.toBe("Entry1");
    });

    it("should get entries with privacy filter if author is current user", async () => {
      query = { authorId: currentUserId.toString() };
      await Entry.findOneAndUpdate(
        { title: "Entry1" },
        { isPrivate: true, userId: currentUserId }
      );

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data[0].title).toBe("Entry1");
      expect(res.body.data).toHaveLength(3);
    });

    it("should get entries with searchText filter", async () => {
      query = { searchText: "2" };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe("Entry2");
    });
  });

  describe("GET /user-most-liked", () => {
    let token: string;
    let currentUserId: string;
    let query: any;

    const exec = async () => {
      return await request(app)
        .get(`/api/entries/user-most-liked`)
        .query(query)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
      });
      currentUserId = currentUser._id;
      token = currentUser.generateAuthToken();

      await Entry.insertMany([
        {
          title: "Entry1",
          text: "RandomText",
          userId: currentUserId,
          likes: [new mongoose.Types.ObjectId()],
        },
        {
          title: "Entry2",
          text: "RandomText",
          userId: currentUserId,
          likes: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        },
        {
          title: "Entry3",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        { title: "Entry4", text: "RandomText", userId: currentUserId },
        {
          title: "Entry5",
          text: "RandomText2",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry6",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry7",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry8",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry9",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry10",
          text: "RandomText",
          userId: currentUserId,
          likes: [
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
            new mongoose.Types.ObjectId(),
          ],
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should get user's top 3 entries by default", async () => {
      query = {};

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe("Entry10"); // Most liked user's entry
    });

    it("should get user's top entries based on query parameters", async () => {
      query = { count: 4 };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(4);
    });

    it("should return sorted entries when likeCount is the same", async () => {
      query = {};

      await Entry.deleteMany({});
      await Entry.insertMany([
        {
          title: "Entry1",
          text: "RandomText",
          userId: currentUserId,
          likes: [],
        },
        {
          title: "Entry2",
          text: "RandomText",
          userId: currentUserId,
          likes: [],
        },
        {
          title: "Entry3",
          text: "RandomText",
          userId: new mongoose.Types.ObjectId(),
        },
        {
          title: "Entry4",
          text: "RandomText",
          userId: currentUserId,
          likes: [],
        },
        {
          title: "Entry5",
          text: "RandomText",
          userId: currentUserId,
          likes: [],
        },
        {
          title: "Entry10",
          text: "RandomText",
          userId: currentUserId,
          likes: [],
        },
      ]);

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[0].title).toBe("Entry1");
    });

    it("should return an empty array when user has no entry", async () => {
      await Entry.deleteMany({});

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("GET /:id", () => {
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .get(`/api/entries/${entryId}`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const entry = await Entry.create({
        title: "Entry1",
        text: "randomJibbirish",
        userId: new mongoose.Types.ObjectId(),
      });

      entryId = entry._id;

      token = new User({
        username: "testuser",
        password: "Password123",
      }).generateAuthToken();
    });

    afterEach(async () => {
      await Entry.deleteMany({});
    });

    it("should get entry data", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Entry1"); // dummy entry data
    });

    it("should return 404 if no entry found", async () => {
      entryId = new mongoose.Types.ObjectId().toHexString(); // random id
      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body).toStrictEqual({});
    });
  });

  describe("POST /", () => {
    let payload: Partial<IEntry>;
    let token: string;

    const exec = async () => {
      return await request(app)
        .post(`/api/entries/`)
        .set("Cookie", [`xAuthToken=${token}`])
        .send(payload);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });

      token = user.generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should create a new entry", async () => {
      payload = {
        title: "New Entry",
        text: "This is a new entry.",
        commentDisabled: false,
      };

      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("New Entry");
    });

    it("should return 400 if required fields are missing", async () => {
      // Missing text field in payload
      payload = {
        title: "This is a new entry.",
        commentDisabled: false,
      };

      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let payload: Partial<IEntry>;
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/entries/${entryId}`)
        .set("Cookie", [`xAuthToken=${token}`])
        .send(payload);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const entry = await Entry.create({
        title: "New Entry",
        text: "This is a new entry.",
        userId: user._id,
        commentDisabled: false,
      });
      entryId = entry._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should update an entry", async () => {
      payload = {
        title: "Updated Entry",
        text: "This entry has been updated.",
        commentDisabled: true,
      };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Entry");
    });

    it("should return error for missing data", async () => {
      payload = {
        title: "This entry is missing text.",
      };

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 404 if entry is not found", async () => {
      // Being validated in validateEntryRights middleware
      entryId = new mongoose.Types.ObjectId().toHexString(); // invalid entry ID that doesn't exist in your database
      payload = { title: "Updated Entry" };

      const response = await exec();

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /:id/like", () => {
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/entries/${entryId}/like`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const entry = await Entry.create({
        title: "New Entry",
        text: "This is a new entry.",
        userId: user._id,
        commentDisabled: false,
      });
      entryId = entry._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should like an entry", async () => {
      const response = await exec();

      expect(response.status).toBe(200);

      const entry = await Entry.findById(entryId);
      expect(entry?.likes).toHaveLength(1);
    });

    it("should return 404 if entry with ID is not found", async () => {
      entryId = new mongoose.Types.ObjectId().toHexString();

      const response = await exec();

      expect(response.status).toBe(404);
    });

    it("should return 400 if entry is already liked", async () => {
      await exec(); // like 1st

      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("PUT /:id/unlike", () => {
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/entries/${entryId}/unlike`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const entry = await Entry.create({
        title: "New Entry",
        text: "This is a new entry.",
        userId: new mongoose.Types.ObjectId(),
        likes: [user._id],
        commentDisabled: false,
      });
      entryId = entry._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should unlike an entry", async () => {
      const response = await exec();

      expect(response.status).toBe(200);

      const entry = await Entry.findById(entryId);
      expect(entry?.likes).toHaveLength(0);
    });

    it("should return 404 if entry with ID is not found", async () => {
      entryId = new mongoose.Types.ObjectId().toHexString();

      const response = await exec();

      expect(response.status).toBe(404);
    });

    it("should return 400 if entry is not liked", async () => {
      await exec(); // 1st unlike

      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("DELETE /:id", () => {
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .delete(`/api/entries/${entryId}`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const entry = await Entry.create({
        title: "New Entry",
        text: "This is a new entry.",
        userId: user._id,
        commentDisabled: false,
      });
      entryId = entry._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Entry.deleteMany({});
    });

    it("should delete an entry", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.text).toBe("Entry deleted successfully");
    });

    it("should delete entry's comments", async () => {
      // Add comments
      await Comment.insertMany([
        {
          text: "This is a new comment.",
          userId: new mongoose.Types.ObjectId(),
          entryId,
        },
        {
          text: "This is a new comment 2.",
          userId: new mongoose.Types.ObjectId(),
          entryId,
        },
      ]);
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.text).toBe("Entry deleted successfully");

      const comments = await Comment.find({ entryId });
      expect(comments).toHaveLength(0);
    });

    it("should return 404 if entry ID is invalid", async () => {
      entryId = new mongoose.Types.ObjectId().toHexString();

      const response = await exec();

      expect(response.status).toBe(404);
    });

    it("should return 404 if entry already deleted", async () => {
      await exec(); // 1st delete

      const response = await exec();

      expect(response.status).toBe(404);
    });
  });
});
