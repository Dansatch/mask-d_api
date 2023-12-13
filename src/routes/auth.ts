import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import User from "../models/User";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ username: req.body.username });
  if (!user) return res.status(400).send("Invalid username or password.");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword)
    return res.status(400).send("Invalid username or password.");

  const token = user.generateAuthToken();
  res.header("x-auth-token", token).send(token);
});

function validate(req: any) {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  });

  return schema.validate(req);
}

export default router;
