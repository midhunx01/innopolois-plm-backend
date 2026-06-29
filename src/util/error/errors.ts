import { STATUS_CODES } from "./status-codes";

class BaseError extends Error {
  public readonly name: string;
  public readonly status: number;
  public readonly message: string;

  constructor(name: string, status: number, description: string) {
    super(description);
    this.name = name;
    this.status = status;
    this.message = description;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

// 500 Internal Error
export class APIError extends BaseError {
  constructor(description = "api error") {
    super("api internal server error", STATUS_CODES.INTERNAL_ERROR, description);
  }
}

// 400 Validation Error
export class ValidationError extends BaseError {
  constructor(description = "bad request") {
    super("bad request", STATUS_CODES.BAD_REQUEST, description);
  }
}

// 401 Authentication Error
export class AuthenticationError extends BaseError {
  constructor(description = "authentication required") {
    super("unauthenticated", STATUS_CODES.UN_AUTHENTICATED, description);
  }
}

// 403 Authorization Error
export class AuthorizeError extends BaseError {
  constructor(description = "access denied") {
    super("access denied", STATUS_CODES.FORBIDDEN, description);
  }
}

// 404 Not Found
export class NotFoundError extends BaseError {
  constructor(description = "not found") {
    super(description, STATUS_CODES.NOT_FOUND, description);
  }
}

// 409 Conflict
export class ConflictError extends BaseError {
  constructor(description = "conflict") {
    super("conflict", STATUS_CODES.CONFLICT, description);
  }
}
