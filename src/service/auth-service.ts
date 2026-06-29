import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { LoginDtoType } from "../api/dto/auth-req-dto";
import { UserRepoType } from "../repository";
import { AuthenticationError } from "../util/error";

const sanitizeUser = (user: {
  id: string;
  name: string;
  email: string;
  role: string;
  team: string | null;
  initials: string | null;
  hue: number;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  team: user.team,
  initials: user.initials,
  hue: user.hue,
});

const login = async (dto: LoginDtoType, userRepo: UserRepoType) => {
  const email = dto.email.toLowerCase();
  const user = await userRepo.findByEmail(email);
  if (!user || !user.is_active) {
    throw new AuthenticationError("Invalid email or password");
  }

  const ok = await bcrypt.compare(dto.password, user.password_hash);
  if (!ok) throw new AuthenticationError("Invalid email or password");

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"] }
  );

  return { token, user: sanitizeUser(user) };
};

const me = async (userId: string, userRepo: UserRepoType) => {
  const user = await userRepo.findById(userId);
  if (!user) throw new AuthenticationError("User not found");
  return sanitizeUser(user);
};

export const authService = {
  login,
  me,
};
