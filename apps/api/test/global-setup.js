const { execSync } = require("node:child_process");
const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

module.exports = async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL 未配置");

  execSync("pnpm exec prisma migrate deploy", {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
};