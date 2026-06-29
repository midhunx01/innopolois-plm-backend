import dotenv from "dotenv";
import { z } from "zod";
import { logger } from "../util";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const envSchema = z.object({
  // App config
  APP_NAME: z.string(),
  APP_ENV: z.enum(["development", "production", "test"]),
  APP_PORT: z.string().regex(/^\d+$/, "APP_PORT must be a number"),

  // DB
  DB_URL: z.string().min(1, "DB_URL is required"),

  // Auth
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("12h"),

  // Seed admin
  ADMIN_NAME: z.string().default("Administrator"),
  ADMIN_EMAIL: z.string().email("Invalid admin email"),
  ADMIN_PASSWORD: z.string().min(6, "ADMIN_PASSWORD must be at least 6 characters"),
});

logger.info("Loading environment variables...");
const result = envSchema.safeParse(process.env);

if (!result.success) {
  logger.error("Environment variable validation failed");
  logger.error(z.treeifyError(result.error));
  process.exit(1);
}

const env = result.data;
logger.info("Environment variables loaded & validated successfully");

export const config = {
  app: {
    name: env.APP_NAME,
    environment: env.APP_ENV,
    port: Number(env.APP_PORT),
  },
  db: {
    url: env.DB_URL,
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  },
  admin: {
    name: env.ADMIN_NAME,
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
  },
};
