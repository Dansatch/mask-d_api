import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import User from "../models/User";
import auth, { AuthRequest } from "../middleware/auth";
import getEnv from "../utils/getEnv";

const router = express.Router();

router.get("/check-login", auth, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?._id).select("-password");
  return res.send(user);
});

router.post("/", async (req: Request, res: Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.where({
    username: req.body.username.toLowerCase(),
  }).findOne();
  if (!user) return res.status(400).send("Invalid username or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid username or password.");

  const token = user.generateAuthToken();

  const { password, ...userWithoutPassword } = user.toObject();
  const secure = getEnv().webUrl.startsWith("https://");

  res
    .cookie("xAuthToken", token, {
      httpOnly: true,
      secure, // Dynamic secure flag based on webUrl
      sameSite: secure ? "none" : "strict", // api and web on different domains when deployed
      maxAge: req.body.rememberMe ? 1209600000 : 7200000, // 14days || 2hrs
    })
    .send({ user: userWithoutPassword });
});

router.post("/logout", auth, (req: Request, res: Response) => {
  const secure = getEnv().webUrl.startsWith("https://");

  res.clearCookie("xAuthToken", {
    secure,
    sameSite: secure ? "none" : "strict", // api and web on different domains when deployed
    path: "/",
  });
  res.sendStatus(200);
});

function validate(req: any) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    rememberMe: Joi.boolean(),
  });

  return schema.validate(req);
}

export default router;
