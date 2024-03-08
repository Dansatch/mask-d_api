const nodeEnv = process.env.NODE_ENV;

export default () => {
  const jwtPrivateKey = String(
    nodeEnv === "test"
      ? process.env.TEST_JWTPRIVATEKEY
      : process.env.JWTPRIVATEKEY
  );

  const dbUrl = String(
    nodeEnv === "test"
      ? process.env.TEST_DB_URL
      : nodeEnv === "production"
      ? process.env.PROD_DB_URL
      : process.env.DB_URL
  );

  const port = Number(process.env.PORT);

  const webUrl = String(
    nodeEnv === "production" ? process.env.PROD_WEB_URL : process.env.WEB_URL
  );

  return { jwtPrivateKey, dbUrl, port, webUrl };
};
