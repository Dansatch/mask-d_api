import { Schema } from "joi";

declare module "joi" {
  interface Root {
    objectId(): Schema;
  }
}
