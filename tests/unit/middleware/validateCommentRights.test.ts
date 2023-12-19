import mongoose from "mongoose";
import Comment, { IComment } from "../../../src/models/Comment";
import { AuthRequest } from "../../../src/middleware/auth";
import validateCommentRights from "../../../src/middleware/validateCommentRights";
import { Response, NextFunction } from "express";

jest.mock("../../../src/models/Comment");

describe("validateCommentRights middleware", () => {
  const userId = new mongoose.Types.ObjectId();
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      params: {
        id: "mockedCommentId",
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
    const mockComment: Partial<IComment> = {
      _id: "mockedCommentId",
      userId, // mocked user id
    };

    (Comment.findById as jest.Mock).mockResolvedValueOnce(mockComment);

    await validateCommentRights(req as AuthRequest, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("should handle a case where the comment is not found", async () => {
    (Comment.findById as jest.Mock).mockResolvedValueOnce(null);

    await validateCommentRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith("Comment not found");
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 when user is not the creator of the comment", async () => {
    const mockEntry: Partial<IComment> = {
      _id: "mockedCommentId",
      userId: new mongoose.Types.ObjectId(), // mocked false user id
    };

    (Comment.findById as jest.Mock).mockResolvedValueOnce(mockEntry);

    await validateCommentRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith("Access denied.");
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle internal server errors", async () => {
    (Comment.findById as jest.Mock).mockRejectedValueOnce(
      new Error("Server error")
    );

    await validateCommentRights(req as AuthRequest, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith("Server error");
    expect(next).not.toHaveBeenCalled();
  });
});
