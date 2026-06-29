import { Role } from "../../db/schema";

declare global {
  namespace Express {
    interface Request {
      auth?: {
        id: string;
        role: Role;
        email: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
