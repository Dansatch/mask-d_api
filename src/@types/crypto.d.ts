declare module "crypto" {
  import { Buffer } from "buffer";

  namespace crypto {
    function randomBytes(size: number): Buffer;
  }

  export = crypto;
}
