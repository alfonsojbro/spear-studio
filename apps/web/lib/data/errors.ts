/**
 * Typed errors from the scoped data layer.
 * NotFoundError covers both "does not exist" and "you may not see it", so ids never leak.
 */
export class DataError extends Error {}

export class NotFoundError extends DataError {
  override name = "NotFoundError";
  constructor(what = "Resource") {
    super(`${what} not found`);
  }
}

export class ForbiddenError extends DataError {
  override name = "ForbiddenError";
  constructor(message = "You do not have permission to do this.") {
    super(message);
  }
}

export class ValidationError extends DataError {
  override name = "ValidationError";
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export function isDataError(error: unknown): error is DataError {
  return error instanceof DataError;
}

/** D1 surfaces constraint failures as plain Errors; detect unique violations. */
export function isUniqueViolation(error: unknown): boolean {
  const text = error instanceof Error ? `${error.message} ${String((error as { cause?: unknown }).cause ?? "")}` : "";
  return /UNIQUE constraint failed/i.test(text);
}
