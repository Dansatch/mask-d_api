import crypto from "crypto";

// Generate a random string for JWT private key
const generateJWTPrivateKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Usage
const jwtPrivateKey = generateJWTPrivateKey();
console.log(jwtPrivateKey);
