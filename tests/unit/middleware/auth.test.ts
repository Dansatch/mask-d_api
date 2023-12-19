import mongoose from "mongoose";
import { Request, Response } from "express";
import auth, { AuthRequest } from "./../../../src/middleware/auth";
import User, { IUser } from "./../../../src/models/User";

describe("auth middleware", () => {
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it("should populate req.user with the payload of a valid JWT", () => {
    const user: Partial<IUser> = {
      _id: new mongoose.Types.ObjectId().toHexString(),
    };
    const req: Partial<Request> = {
      header: jest.fn().mockReturnValue(new User(user).generateAuthToken()),
    };

    auth(req as Request, res as Response, next);

    expect((req as AuthRequest).user).toMatchObject(user);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 for no token", () => {
    const req: Partial<Request> = {
      header: jest.fn().mockReturnValue(undefined),
    };

    auth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 for an invalid token", () => {
    const req: Partial<Request> = {
      header: jest.fn().mockReturnValue("invalid-token"),
    };

    auth(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
