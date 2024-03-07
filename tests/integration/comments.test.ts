import { Server } from "http";
import request from "supertest";
import mongoose from "mongoose";
import Comment, { IComment } from "../../src/models/Commente";
import User from "../../src/models/Usere";

describe("/api/comments", () => {
  let app: Server;

  beforeEach(() => {
    app = require("../../src/index");
  });

  afterEach(() => {
    app.close();
  });

  describe("GET /:entryId", () => {
    let token: string;
    let entryId: string;
    let query: any;

    const exec = async () => {
      return await request(app)
        .get(`/api/comments/${entryId}`)
        .query(query)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
      });
      token = currentUser.generateAuthToken();

      entryId = new mongoose.Types.ObjectId().toHexString();

      await Comment.insertMany([
        {
          text: "Comment1",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment2",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment3",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment4",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment5",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment6",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment7",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment8",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment9",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment10",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment11",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment12",
          entryId,
          userId: currentUser._id,
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should get a list of comments with default pagination", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(10);
    });

    it("should get a list of comments with custom pagination settings", async () => {
      query = { page: 2, pageSize: 5 };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.page).toBe(2);
      expect(res.body.totalPages).toBe(3);
    });

    it("should return 404 if entry ID is invalid", async () => {
      entryId = "invalidID";

      const response = await exec();

      expect(response.status).toBe(400);
    });
  });

  describe("GET /:entryId/count", () => {
    let token: string;
    let entryId: string;

    const exec = async () => {
      return await request(app)
        .get(`/api/comments/${entryId}/count`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUsername",
        password: "password123",
      });
      token = currentUser.generateAuthToken();

      entryId = new mongoose.Types.ObjectId().toHexString();

      await Comment.insertMany([
        {
          text: "Comment1",
          entryId,
          userId: currentUser._id,
        },
        {
          text: "Comment2",
          entryId,
          userId: currentUser._id,
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should get the comment count for an entry", async () => {
      const response = await exec();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("count");
    });

    it("should return 500 if entry ID is invalid", async () => {
      entryId = "invalidID";

      const response = await exec();

      expect(response.status).toBe(500);
    });
  });

  describe("POST /", () => {
    let payload: Partial<IComment>;
    let token: string;

    const exec = async () => {
      return await request(app)
        .post(`/api/comments/`)
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
      await Comment.deleteMany({});
    });

    it("should create a new comment", async () => {
      payload = {
        text: "This is a new comment.",
        entryId: new mongoose.Types.ObjectId(),
      };

      const res = await exec();

      expect(res.status).toBe(201);
      expect(res.body.text).toBe("This is a new comment.");
    });

    it("should return 400 if invalid data is sent", async () => {
      //   Missing text
      payload = {
        entryId: new mongoose.Types.ObjectId(),
      };

      const res = await exec();

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let payload: Partial<IComment>;
    let token: string;
    let commentId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/comments/${commentId}`)
        .set("Cookie", [`xAuthToken=${token}`])
        .send(payload);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const comment = await Comment.create({
        text: "This is a new comment.",
        userId: user._id,
        entryId: new mongoose.Types.ObjectId(),
      });
      commentId = comment._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should update a comment", async () => {
      payload = {
        text: "Updated comment text.",
      };

      const res = await exec();
      expect(res.status).toBe(200);

      const comment = await Comment.findById(commentId);
      expect(comment?.text).toBe(payload.text);
    });

    it("should return 404 if comment doesn't exist", async () => {
      commentId = new mongoose.Types.ObjectId().toHexString(); // random id
      payload = {
        text: "Updated comment text.",
      };

      const response = await exec();

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /:id/like", () => {
    let token: string;
    let commentId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/comments/${commentId}/like`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const comment = await Comment.create({
        text: "This is a new comment.",
        userId: user._id,
        entryId: new mongoose.Types.ObjectId(),
      });
      commentId = comment._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should like a comment", async () => {
      const res = await exec();

      expect(res.status).toBe(200);

      const comment = await Comment.findById(commentId);
      expect(comment?.likes).toHaveLength(1);
    });

    it("should return 404 if comment with ID is not found", async () => {
      commentId = new mongoose.Types.ObjectId().toHexString();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 400 if comment is already liked", async () => {
      await exec(); // like 1st

      const res = await exec();

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id/unlike", () => {
    let token: string;
    let commentId: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/comments/${commentId}/unlike`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const comment = await Comment.create({
        text: "This is a new comment.",
        userId: new mongoose.Types.ObjectId(),
        likes: [user._id],
        entryId: new mongoose.Types.ObjectId(),
      });
      commentId = comment._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should unlike a comment", async () => {
      const res = await exec();

      expect(res.status).toBe(200);

      const comment = await Comment.findById(commentId);
      expect(comment?.likes).toHaveLength(0);
    });

    it("should return 404 if comment with ID is not found", async () => {
      commentId = new mongoose.Types.ObjectId().toHexString();

      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 400 if comment is not liked", async () => {
      await exec(); // 1st unlike

      const res = await exec();

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id", () => {
    let token: string;
    let commentId: string;

    const exec = async () => {
      return await request(app)
        .delete(`/api/comments/${commentId}`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    beforeEach(async () => {
      const user = await User.create({
        username: "randomUsername",
        password: "password123",
      });
      token = user.generateAuthToken();

      const comment = await Comment.create({
        text: "This is a new comment.",
        userId: user._id,
        entryId: new mongoose.Types.ObjectId(),
      });
      commentId = comment._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
      await Comment.deleteMany({});
    });

    it("should delete a comment", async () => {
      const res = await exec();

      expect(res.status).toBe(200);

      const comment = await Comment.findById(commentId);
      expect(comment).not.toBeTruthy();
    });

    it("should return 404 if comment ID is invalid", async () => {
      commentId = new mongoose.Types.ObjectId().toHexString();

      const response = await exec();

      expect(response.status).toBe(404);
    });

    it("should return 404 if comment already deleted", async () => {
      await exec(); // 1st delete

      const response = await exec();

      expect(response.status).toBe(404);
    });
  });
});
