const config = require("config");
import request from "supertest";
import { Server } from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../../src/models/User";

describe("POST /", () => {
  let server: Server;
  let payload: any;

  const exec = async () =>
    await request(server).post(`/api/auth`).send(payload);

  beforeEach(() => {
    server = require("../../src/index");
  });

  afterEach(async () => {
    server.close();
    await User.deleteMany({});
  });

  it("should return 400 if username is missing", async () => {
    payload = { password: "samplePassword" };

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if password is missing", async () => {
    payload = { username: "sampleUser" };

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if username is invalid", async () => {
    payload = { username: 123, password: "samplePassword" };

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if password is invalid", async () => {
    payload = { username: "sampleUser", password: 123 };

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it("should return 400 if user is not found", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null);

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
    expect(res.header).toHaveProperty("x-auth-token");

    const decoded = jwt.verify(
      res.header["x-auth-token"],
      config.get("jwtPrivateKey")
    );
    expect(decoded).toHaveProperty("_id");
  });
});
