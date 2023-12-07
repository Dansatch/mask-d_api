import config from "config";

export default function checkJwtPrivateKey(): void {
  if (!config.get<string>("jwtPrivateKey")) {
    throw new Error("FATAL ERROR: JWTPrivateKey is not defined");
  }
}
