const nodeEnv = process.env.NODE_ENV;

export default () => {
  const jwtPrivateKey = String(
    nodeEnv === "test"
      ? process.env.TEST_JWTPRIVATEKEY
      : process.env.JWTPRIVATEKEY
  );

  const dbUrl = String(
    nodeEnv === "test" ? process.env.TEST_DB_URL : process.env.DB_URL
  );

  const port = Number(process.env.PORT);

  return { jwtPrivateKey, dbUrl, port };
};
