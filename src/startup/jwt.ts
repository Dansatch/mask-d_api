import getEnv from "../utils/getEnv";

export default function checkJwtPrivateKey(): void {
  if (!getEnv().jwtPrivateKey) {
    throw new Error("FATAL ERROR: JWTPrivateKey is not defined");
  }
}
