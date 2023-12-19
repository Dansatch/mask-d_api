import mongoose from "mongoose";
import Entry, { IEntry } from "../../../src/models/Entry";
import { AuthRequest } from "../../../src/middleware/auth";
import validateEntryRights from "../../../src/middleware/validateEntryRights";
import { Response, NextFunction } from "express";

jest.mock("../../../src/models/Entry");

describe("validateEntryRights middleware", () => {
  const userId = new mongoose.Types.ObjectId();
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {
        id: "mockedEntryId",
      },
      user: {
        _id: userId.toHexString(),
      },
    } as Partial<AuthRequest>;
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as Partial<Response>;
    next = jest.fn();
  });

  it("should call next function", async () => {
    const mockEntry: Partial<IEntry> = {
      _id: "mockedEntryId",
      userId, // mocked user id
    };

    (Entry.findById as jest.Mock).mockResolvedValueOnce(mockEntry);

    await validateEntryRights(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("should handle a case where the entry is not found", async () => {
    (Entry.findById as jest.Mock).mockResolvedValueOnce(null);

    await validateEntryRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Entry not found");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 when user is not the creator of the entry", async () => {
    const mockEntry: Partial<IEntry> = {
      _id: "mockedEntryId",
      userId: new mongoose.Types.ObjectId(), // mocked false user id
    };

    (Entry.findById as jest.Mock).mockResolvedValueOnce(mockEntry);

    await validateEntryRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied.");
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle internal server errors", async () => {
    (Entry.findById as jest.Mock).mockRejectedValueOnce(
      new Error("Server error")
    );

    await validateEntryRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Server error");
    expect(next).not.toHaveBeenCalled();
  });
});
