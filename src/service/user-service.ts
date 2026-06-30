import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { uuidv7 } from "uuidv7";
import {
  CreateUserDtoType,
  ResetPasswordDtoType,
  UpdateUserDtoType,
} from "../api/dto/user-req-dto";
import { NewUser, User } from "../db/schema";
import { UserFilters, UserRepoType } from "../repository";
import { ConflictError, NotFoundError, ValidationError } from "../util/error";

// Readable random temporary password, e.g. "Tmp-9fK2aQ7p".
const generateTempPassword = () => `Tmp-${randomBytes(6).toString("base64url")}`;

// Never expose the password hash.
const sanitize = (u: User) => {
  const { password_hash, ...rest } = u;
  return rest;
};

const deriveInitials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const create = async (dto: CreateUserDtoType, repo: UserRepoType) => {
  const email = dto.email.trim().toLowerCase();
  if (await repo.findByEmail(email)) {
    throw new ConflictError(`A user with email "${email}" already exists`);
  }

  const newUser: NewUser = {
    id: uuidv7(),
    name: dto.name,
    email,
    password_hash: await bcrypt.hash(dto.password, 10),
    role: dto.role,
    team: dto.team ?? null,
    initials: dto.initials ?? deriveInitials(dto.name),
    hue: dto.hue ?? 210,
    is_active: true,
    // New users keep the password the admin sets — no forced change on first
    // login. Only an admin reset (reset-password) forces a change.
    must_change_password: false,
  };

  const created = await repo.create(newUser);
  if (!created) throw new ValidationError("Failed to create user");
  return sanitize(created);
};

const list = async (filters: UserFilters, repo: UserRepoType) => {
  const { rows, total } = await repo.listPaged(filters);
  return { rows: rows.map(sanitize), total };
};

const getById = async (id: string, repo: UserRepoType) => {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError("User not found");
  return sanitize(user);
};

const update = async (
  id: string,
  dto: UpdateUserDtoType,
  actingUserId: string,
  repo: UserRepoType
) => {
  const existing = await repo.findById(id);
  if (!existing) throw new NotFoundError("User not found");

  const patch: Partial<NewUser> = {};

  if (dto.email !== undefined) {
    const email = dto.email.trim().toLowerCase();
    if (email !== existing.email) {
      if (await repo.findByEmail(email)) {
        throw new ConflictError(`A user with email "${email}" already exists`);
      }
      patch.email = email;
    }
  }
  if (dto.name !== undefined) patch.name = dto.name;
  if (dto.team !== undefined) patch.team = dto.team;
  if (dto.initials !== undefined) patch.initials = dto.initials;
  if (dto.hue !== undefined) patch.hue = dto.hue;

  // Guard against locking the system out of admin access.
  const losingAdmin =
    existing.role === "Administrator" &&
    ((dto.role !== undefined && dto.role !== "Administrator") ||
      dto.is_active === false);
  if (losingAdmin) {
    const admins = await repo.countActiveByRole("Administrator");
    if (admins <= 1) {
      throw new ValidationError(
        "Cannot demote or deactivate the last active Administrator"
      );
    }
  }
  if (dto.is_active === false && id === actingUserId) {
    throw new ValidationError("You cannot deactivate your own account");
  }

  if (dto.role !== undefined) patch.role = dto.role;
  if (dto.is_active !== undefined) patch.is_active = dto.is_active;

  const updated = await repo.update(id, patch);
  if (!updated) throw new ValidationError("Failed to update user");
  return sanitize(updated);
};

const remove = async (
  id: string,
  actingUserId: string,
  repo: UserRepoType
) => {
  if (id === actingUserId) {
    throw new ValidationError("You cannot delete your own account");
  }
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError("User not found");

  if (user.role === "Administrator") {
    const admins = await repo.countActiveByRole("Administrator");
    if (admins <= 1) {
      throw new ValidationError("Cannot delete the last active Administrator");
    }
  }

  const ok = await repo.softDelete(id);
  if (!ok) throw new NotFoundError("User not found");
  return { message: "User deactivated successfully" };
};

/**
 * Administrator resets a user's password to a temporary one and flags the
 * account so the user must change it at next login. If no temporary password is
 * supplied, a random one is generated and returned (once) for the admin to relay.
 */
const resetPassword = async (
  id: string,
  dto: ResetPasswordDtoType,
  repo: UserRepoType
) => {
  const user = await repo.findById(id);
  if (!user) throw new NotFoundError("User not found");

  const tempPassword = dto.temporary_password?.trim() || generateTempPassword();
  const updated = await repo.update(id, {
    password_hash: await bcrypt.hash(tempPassword, 10),
    must_change_password: true,
  });
  if (!updated) throw new ValidationError("Failed to reset password");

  return {
    user_id: id,
    temporary_password: tempPassword,
    message:
      "Temporary password set. Share it with the user; they must change it at next login.",
  };
};

export const userService = {
  create,
  list,
  getById,
  update,
  remove,
  resetPassword,
};
