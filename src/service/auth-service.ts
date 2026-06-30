import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { LoginDtoType } from "../api/dto/auth-req-dto";
import { SetPasswordDtoType } from "../api/dto/user-req-dto";
import { User } from "../db/schema";
import { UserRepoType } from "../repository";
import { AuthenticationError, AuthorizeError } from "../util/error";

const sanitizeUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  team: user.team,
  initials: user.initials,
  hue: user.hue,
  is_active: user.is_active,
  must_change_password: user.must_change_password,
});

const signToken = (user: User, mustChange: boolean) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      ...(mustChange ? { must_change: true } : {}),
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
  );

const login = async (dto: LoginDtoType, userRepo: UserRepoType) => {
  const email = dto.email.toLowerCase();
  const user = await userRepo.findByEmail(email);
  if (!user || !user.is_active) {
    throw new AuthenticationError("Invalid email or password");
  }

  const ok = await bcrypt.compare(dto.password, user.password_hash);
  if (!ok) throw new AuthenticationError("Invalid email or password");

  // A flagged account gets a RESTRICTED token (must_change). The password-change
  // gate blocks every endpoint except set-password until they change it.
  const token = signToken(user, user.must_change_password);
  return {
    token,
    must_change_password: user.must_change_password,
    user: sanitizeUser(user),
  };
};

const me = async (userId: string, userRepo: UserRepoType) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AuthenticationError("User not found");
  return sanitizeUser(user);
};

/**
 * Forced first-login password change. Only allowed while the account is flagged
 * `must_change_password` (set by admin create/reset) — this is the ONLY way a
 * user sets their own password; routine self-service changes are not offered.
 * On success the flag clears and a fresh, unrestricted token is issued.
 */
const setPassword = async (
  userId: string,
  dto: SetPasswordDtoType,
  userRepo: UserRepoType
) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AuthenticationError("User not found");

  if (!user.must_change_password) {
    throw new AuthorizeError(
      "Password changes are managed by your administrator"
    );
  }

  const ok = await bcrypt.compare(dto.current_password, user.password_hash);
  if (!ok) throw new AuthenticationError("Temporary password is incorrect");

  if (dto.current_password === dto.new_password) {
    throw new AuthenticationError(
      "New password must differ from the temporary password"
    );
  }

  const updated = await userRepo.update(userId, {
    password_hash: await bcrypt.hash(dto.new_password, 10),
    must_change_password: false,
  });
  if (!updated) throw new AuthenticationError("Failed to set password");

  return { token: signToken(updated, false), user: sanitizeUser(updated) };
};

export const authService = {
  login,
  me,
  setPassword,
};
