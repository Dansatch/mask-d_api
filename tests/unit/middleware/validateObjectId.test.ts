import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import validateObjectId from "../../../src/middleware/validateObjectId";

describe("validateObjectId middleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as Partial<Response>;
    next = jest.fn();
  });

  it("should call next for a valid object ID", () => {
    req = {
      params: {
        id: new mongoose.Types.ObjectId().toHexString(),
      },
    };

    validateObjectId(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("should handle a case where the object ID is invalid", () => {
    req = {
      params: {
        id: "invalidId",
      },
    };

    validateObjectId(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith("Invalid ID.");
    expect(next).not.toHaveBeenCalled();
  });
});
