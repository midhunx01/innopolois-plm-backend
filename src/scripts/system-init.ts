import bcrypt from "bcryptjs";
import { uuidv7 } from "uuidv7";
import { config } from "../config";
import { userRepo } from "../repository";
import { NewUser } from "../db/schema";
import { logger } from "../util";

/**
 * Idempotent startup bootstrap. Ensures the seed Administrator exists so the
 * system is usable on a fresh database. Runs on every boot; does nothing if the
 * admin already exists.
 */
export const ensureSystemInitialization = async (): Promise<void> => {
  const email = config.admin.email.toLowerCase();
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    logger.info("System init: admin user already present");
    return;
  }

  const passwordHash = await bcrypt.hash(config.admin.password, 10);
  const initials = config.admin.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const admin: NewUser = {
    id: uuidv7(),
    name: config.admin.name,
    email,
    password_hash: passwordHash,
    role: "Administrator",
    team: "Admin",
    initials,
    hue: 280,
    is_active: true,
  };

  await userRepo.create(admin);
  logger.info(`System init: created Administrator ${email}`);
};
