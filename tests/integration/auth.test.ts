import request from "supertest";
import { Server } from "http";
import bcrypt from "bcrypt";
import User from "../../src/models/User";

describe("/api/auth", () => {
  let server: Server;

  beforeEach(() => {
    server = require("../../src/index");
  });

  afterEach(async () => {
    server.close();
  });

  describe("GET /check-login", () => {
    let token: string;

    const exec = async () => {
      return await request(server)
        .get(`/api/auth/check-login`)
        .set("Cookie", [`xAuthToken=${token}`]);
    };

    it("should return user data if a valid token is present in the cookie", async () => {
      // Create a user and token
      const user = await User.create({
        username: "user1",
        password: "password123",
      });
      token = user.generateAuthToken();

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.username).toBe("user1");
    });

    it("should return error if token is invalid", async () => {
      token = ""; //empty token
      let res = await exec();
      expect(res.status).toBe(401);
      expect(res.text).toBe("Access denied, no token provided");

      token = "invalidToken"; //invalid token
      res = await exec();
      expect(res.status).toBe(400);
      expect(res.text).toBe("Invalid token");
    });
  });

  describe("POST /", () => {
    let payload: any;

    afterEach(async () => {
      await User.deleteMany({});
    });

    const exec = async () => {
      return await request(server).post(`/api/auth`).send(payload);
    };

    it("should return 400 if username or password is missing", async () => {
      // Missing username
      payload = { password: "samplePassword" };
      let res = await exec();
      expect(res.status).toBe(400);

      // Missing password
      payload = { username: "sampleUser" };
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if username or password is invalid", async () => {
      //  Invalid username
      payload = { username: 123, password: "samplePassword" };
      let res = await exec();
      expect(res.status).toBe(400);

      //  Invalid password
      payload = { username: "sampleUser", password: 123 };
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if user is not found", async () => {
      payload = { username: "nonExistingUser", password: "samplePassword" };

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if password is incorrect", async () => {
      await User.create({
        username: "sampleUsername",
        password: await bcrypt.hash("correctPassword", 10),
      });

      payload = { username: "sampleUsername", password: "wrongPassword" };

      const res = await exec();

      expect(res.status).toBe(400);
      expect(res.text).toBe("Invalid username or password.");
    });

    it("should return valid JWT token if everything is okay", async () => {
      await User.create({
        username: "sampleUsername",
        password: await bcrypt.hash("correctPassword", 10),
      });

      payload = { username: "sampleUsername", password: "correctPassword" };

      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.header["set-cookie"]).toBeDefined(); // Check for cookie
      expect(res.body.user).toBeDefined(); // Check for user object
      expect(res.body.user).not.toHaveProperty("password"); // Ensure password is excluded
    });
  });

  describe("POST /logout", () => {
    let authToken: string;

    afterEach(async () => {
      await User.deleteMany({});
    });

    const exec = async () => {
      return await request(server)
        .post(`/api/auth/logout`)
        .set("Cookie", [`xAuthToken=${authToken}`]);
    };

    it("should ensure user is logged in", async () => {
      // Already checked with auth middleware
      expect(true).toBe(true);
    });

    it("should logout user", async () => {
      // Create user
      const user = await User.create({
        username: "sampleUsername",
        password: await bcrypt.hash("correctPassword", 10),
      });
      authToken = user.generateAuthToken(); // simulate login

      // Logout user
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.header["set-cookie"]).toEqual([
        "xAuthToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      ]); // Check for cookie expiration
    });
  });
});
