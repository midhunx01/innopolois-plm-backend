import { Static, TSchema } from "@sinclair/typebox";
import Ajv from "ajv";
import ajvErrors from "ajv-errors";
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, strict: false, coerceTypes: true });
ajvErrors(ajv);
addFormats(ajv);

/** Recursively trim string values in the request payload. */
export function sanitizeStrings<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === "string") {
    return input.trim() as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeStrings(item)) as unknown as T;
  }

  if (typeof input === "object") {
    const result: Record<string, any> = {};
    for (const key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        result[key] = sanitizeStrings((input as Record<string, any>)[key]);
      }
    }
    return result as T;
  }

  return input;
}

/** Generic validator using TypeBox schemas + Ajv. */
export function ValidateRequest<T extends TSchema>(
  data: unknown,
  schema: T
): { valid: true; data: Static<T> } | { valid: false; error: string } {
  const sanitizedData = sanitizeStrings(data);
  const validate = ajv.compile(schema);
  const isValid = validate(sanitizedData);

  if (isValid) return { valid: true, data: sanitizedData as Static<T> };

  const errorMessages = validate.errors?.map((e) => e.message).filter(Boolean);
  return {
    valid: false,
    error: errorMessages?.[0] || "Validation failed",
  };
}
