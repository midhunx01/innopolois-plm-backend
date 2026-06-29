import type { NextFunction, Request, Response } from "express";
import { AuthenticationError, AuthorizeError } from "../../util/error";
import type { Role } from "../../db/schema";

/**
 * Role-set authorization (FRD §17). PLM roles are not a clean ladder, so access
 * is granted by membership rather than a numeric hierarchy. `Administrator`
 * always passes. Call with the roles allowed for the route, e.g.
 *   authorize("Engineering", "Purchase")
 * Pass no roles to require only a valid authenticated user.
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.id || !req.auth.role) {
        throw new AuthenticationError("Authentication required");
      }

      const role = req.auth.role;
      if (role === "Administrator") return next(); // full access

      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        throw new AuthorizeError(
          `Access denied. Requires one of: ${allowedRoles.join(", ")}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
