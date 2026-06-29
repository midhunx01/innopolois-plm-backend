import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config";
import { AuthenticationError } from "../../util/error";
import type { Role } from "../../db/schema";

export interface JwtPayload {
  id: string;
  role: Role;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Verifies the Bearer JWT and attaches the decoded user to `req.auth`.
 * Self-issued HS256 token (see auth-service). Replaces cloudder's Auth0 layer.
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or malformed Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const decoded = jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
      req.auth = decoded;
      next();
    } catch {
      throw new AuthenticationError("Invalid or expired token");
    }
  } catch (error) {
    next(error);
  }
};
