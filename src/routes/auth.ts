import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";
import config from "config";
import User from "../models/User";
import auth from "../middleware/auth";

const router = express.Router();

router.get("/check-login", (req: Request, res: Response) => {
  try {
    const token = req.cookies.xAuthToken;
    if (!token) throw new Error(); // to return false in catch

    jwt.verify(token, config.get<string>("jwtPrivateKey"));

    res.json(true);
  } catch (error) {
    return res.json(false);
  }
});

router.post("/", async (req: Request, res: Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.where({ username: req.body.username }).findOne();
  if (!user) return res.status(400).send("Invalid username or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid username or password.");

  const token = user.generateAuthToken();

  const { password, ...userWithoutPassword } = user.toObject();
  res
    .cookie("xAuthToken", token, {
      httpOnly: true,
      maxAge: req.body.rememberMe ? 1209600000 : 7200000,
    }) // 14days || 2hrs
    .send({ user: userWithoutPassword });
});

router.post("/logout", auth, (req: Request, res: Response) => {
  res.clearCookie("xAuthToken"); // Clear the cookie
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
