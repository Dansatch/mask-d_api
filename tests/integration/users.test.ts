import bcrypt from "bcrypt";
import { Server } from "http";
import request from "supertest";
import User, { IUser } from "../../src/models/User";
import mongoose from "mongoose";
import Entry from "../../src/models/Entry";

describe("/api/users", () => {
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
    let users: any; // To change to IUser, NB: insertMany returns string in followers

    const exec = async () => {
      return await request(app)
        .get(`/api/users`)
        .query(query)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      users = await User.insertMany([
        {
          username: "sampleUsername1",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername2",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleTEUsername3",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername4",
          password: await bcrypt.hash("correctPassword", 10),
          followers: [new mongoose.Types.ObjectId().toHexString()],
          isPrivate: false,
        },
        {
          username: "sampleUsername5",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername6",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername7te",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername8",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername9",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername10",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername11",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername12",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername13",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername14",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
        {
          username: "sampleUsername15",
          password: await bcrypt.hash("correctPassword", 10),
          isPrivate: false,
        },
      ]);

      token = users[0].generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should get a list of users with default pagination", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(10);
    });

    it("should get a list of users sorted by a specific field in ascending order", async () => {
      query = { sortBy: "followers", sortOrder: "desc" };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].username).toBe("sampleUsername4"); // Has 1 follower in beforeEach
    });

    it("should get a list of users with custom pagination settings", async () => {
      query = { page: 2, pageSize: 5 };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].username).toBe(users[5].username); // skip = (page - 1) * pageSize
    });

    it("should not return private users", async () => {
      query = {};

      // Set user to private
      await User.findOneAndUpdate(
        { username: users[0].username },
        { isPrivate: true }
      );

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body[0].username).not.toBe(users[0].username);
    });

    it("should get users with searchText filter", async () => {
      query = { searchText: "te" };
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].username).toBe("sampleTEUsername3"); // username inserted in beforeEach
    });
  });

  describe("GET /:id", () => {
    let token: string;
    let identifier: string;
    let users: any; // To change to IUser, NB: insertMany returns string in followers

    const exec = async () => {
      return await request(app)
        .get(`/api/users/${identifier}`)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      users = await User.insertMany([
        {
          username: "sampleUsername1",
          password: await bcrypt.hash("correctPassword", 10),
        },
        {
          username: "sampleUsername2",
          password: await bcrypt.hash("correctPassword", 10),
        },
      ]);

      token = users[0].generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should get user data by userId", async () => {
      identifier = users[1]._id;
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(users[1].username);
      expect(res.body.password).toBe(users[1].password);
    });

    it("should get user data by username", async () => {
      identifier = users[1].username;
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.username).toBe(users[1].username);
      expect(res.body.password).toBe(users[1].password);
    });

    it("should return 404 if no user found", async () => {
      identifier = "unknownUser";
      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.body).toStrictEqual({});
    });
  });

  describe("POST /", () => {
    let payload: Partial<IUser>;

    const exec = async () => {
      return await request(app).post(`/api/users/`).send(payload);
    };

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should create a new user with valid data", async () => {
      payload = {
        username: "testUser",
        password: "testPassword",
      };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.header["x-auth-token"]).toBeDefined();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("username", "testUser");
    });

    it("should return 400 if user data is invalid", async () => {
      payload = {
        username: "testUser",
      };

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if username already exists", async () => {
      await User.create({
        username: "testUser", // Username that will be duplicated
        password: await bcrypt.hash("existingPassword", 10),
      });

      payload = {
        username: "testUser",
        password: "newPassword",
      };

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("Username already exists.");
    });
  });

  describe("PUT /update-password", () => {
    let token: string;
    let payload: any;

    const exec = async () => {
      return await request(app)
        .put(`/api/users/update-password`)
        .send(payload)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      const testUser = await User.create({
        username: "testUser",
        password: await bcrypt.hash("oldPassword", 10),
      });

      token = testUser.generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should update user password", async () => {
      payload = {
        oldPassword: "oldPassword",
        newPassword: "newPassword123",
      };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.text).toBe("Password updated successfully");
    });

    it("should return 400 if current password is invalid", async () => {
      payload = {
        oldPassword: "invalidPassword",
        newPassword: "newPassword123",
      };

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("Invalid old password");
    });

    it("should handle user not found", async () => {
      await User.deleteMany({});

      payload = {
        oldPassword: "oldPassword",
        newPassword: "newPassword123",
      };

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.text).toBe("User not found");
    });
  });

  describe("PUT /update-privacy", () => {
    let token: string;
    let currentUserId: string;
    let payload: any;

    const exec = async () => {
      return await request(app)
        .put(`/api/users/update-privacy`)
        .send(payload)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      const testUser = await User.create({
        username: "testUser",
        password: await bcrypt.hash("oldPassword", 10),
        isPrivate: false,
      });

      token = testUser.generateAuthToken();
      currentUserId = testUser._id;

      await Entry.insertMany([
        {
          title: "To not die",
          text: "Gibberish",
          userId: currentUserId,
          isPrivate: false,
        },
        {
          title: "ORV",
          text: "Gibberish",
          userId: currentUserId,
          isPrivate: false,
        },
        {
          title: "The world after the end",
          text: "Gibberish",
          userId: currentUserId,
          isPrivate: false,
        },
      ]);
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should update user privacy", async () => {
      payload = {
        isPrivate: true,
      };

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.text).toBe("User privacy updated successfully");

      // Check if the user privacy is updated
      const updatedUser = await User.findById(currentUserId);
      expect(updatedUser?.isPrivate).toBe(true);

      // Check if user entries' privacy is updated
      const updatedEntries = await Entry.find({ userId: currentUserId });
      updatedEntries.forEach((entry) => {
        expect(entry.isPrivate).toBe(true);
      });
    });

    it("should handle user not found", async () => {
      await User.deleteMany({});

      payload = {
        isPrivate: true,
      };

      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.text).toBe("User not found");
    });
  });

  describe("PUT /:id/follow", () => {
    let token: string;
    let currentUserId: string;
    let userIdToFollow: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/users/${userIdToFollow}/follow`)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      const currentUser = await User.create({
        username: "currentUser",
        password: await bcrypt.hash("oldPassword", 10),
      });

      const userToFollow = await User.create({
        username: "testUserToFollow",
        password: await bcrypt.hash("oldPassword", 10),
      });

      currentUserId = currentUser._id;
      userIdToFollow = userToFollow._id;
      token = currentUser.generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should follow another user successfully", async () => {
      const res = await exec();

      expect(res.status).toBe(200);

      const followedUser = await User.findById(userIdToFollow);
      expect(followedUser?.followers).toContainEqual(currentUserId);
    });

    it("should not allow user to follow themselves", async () => {
      userIdToFollow = currentUserId;
      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("You can't follow yourself");
    });

    it("should handle user not found", async () => {
      userIdToFollow = new mongoose.Types.ObjectId().toHexString();
      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.text).toBe("User not found");
    });

    it("should handle already following user", async () => {
      await exec(); // first follow

      const response = await exec();

      expect(response.status).toBe(400);
      expect(response.text).toBe("You are already following this user");
    });
  });

  describe("PUT /:id/unfollow", () => {
    let token: string;
    let currentUserId: string;
    let userIdToUnfollow: string;

    const exec = async () => {
      return await request(app)
        .put(`/api/users/${userIdToUnfollow}/unfollow`)
        .set("x-auth-token", token);
    };

    beforeEach(async () => {
      // Create users
      const currentUser = await User.create({
        username: "currentUser",
        password: await bcrypt.hash("oldPassword", 10),
      });
      const userToUnfollow = await User.create({
        username: "testUserToFollow",
        password: await bcrypt.hash("oldPassword", 10),
      });

      // Assign variables
      currentUserId = currentUser._id;
      userIdToUnfollow = userToUnfollow._id;

      // Follow other
      currentUser.following.push(userToUnfollow._id);
      userToUnfollow.followers.push(currentUser._id);
      await Promise.all([currentUser.save(), userToUnfollow.save()]);

      // Generate token
      token = currentUser.generateAuthToken();
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should unfollow another user successfully", async () => {
      const res = await exec();

      expect(res.status).toBe(200);

      const followedUser = await User.findById(userIdToUnfollow);
      expect(followedUser?.followers).not.toContainEqual(currentUserId);
    });

    it("should not allow user to unfollow themselves", async () => {
      userIdToUnfollow = currentUserId;
      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("You can't unfollow yourself");
    });

    it("should handle user not found", async () => {
      userIdToUnfollow = new mongoose.Types.ObjectId().toHexString();
      const res = await exec();

      expect(res.status).toBe(404);
      expect(res.text).toBe("User not found");
    });

    it("should handle not following user", async () => {
      await exec(); // first unfollow

      const response = await exec();

      expect(response.status).toBe(400);
      expect(response.text).toBe("You're not following this user");
    });
  });

  describe("DELETE /delete-account", () => {
    let token: string;
    let password: string;
    let userId: string;

    const exec = async () => {
      return await request(app)
        .delete(`/api/users/delete-account`)
        .set("x-auth-token", token)
        .send({ password });
    };

    beforeEach(async () => {
      const testUser = await User.create({
        username: "testUser",
        password: await bcrypt.hash("correctPassword", 10),
      });

      token = testUser.generateAuthToken();
      password = "correctPassword";
      userId = testUser._id;
    });

    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should delete the user account successfully", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.text).toBe("User account deleted successfully");
    });

    it("should delete user's entries", async () => {
      // Add entries
      await Entry.insertMany([
        {
          text: "This is a new entry.",
          userId,
        },
        {
          text: "This is a new entry 2.",
          userId,
        },
      ]);
      const res = await exec();

      expect(res.status).toBe(200);

      const entries = await Entry.find({ userId });
      expect(entries).toHaveLength(0);
    });

    it("should return 404 if invalid password", async () => {
      password = "incorrectPassword";
      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("Invalid password");
    });

    it("should handle user not found", async () => {
      await exec(); // delete user account first

      const response = await exec();

      expect(response.status).toBe(404);
      expect(response.text).toBe("User not found");
    });
  });
});
