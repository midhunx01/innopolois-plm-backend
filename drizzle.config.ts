import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";
dotenv.config();

export default defineConfig({
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_URL as string,
  },
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  verbose: true,
  strict: true,
});
