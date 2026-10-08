import { isDataError, NotFoundError, ValidationError } from "@/lib/data";
import type { FormState } from "@/components/form-state";

/** Maps data-layer errors to form state. Unknown errors are rethrown to the error boundary. */
export function toFormState(error: unknown, values?: Record<string, string>): FormState {
  if (error instanceof ValidationError) {
    return { status: "error", message: error.message, fieldErrors: error.fieldErrors, at: Date.now(), values };
  }
  if (error instanceof NotFoundError) {
    return { status: "error", message: "This item no longer exists or you lost access to it.", at: Date.now(), values };
  }
  if (isDataError(error)) return { status: "error", message: error.message, at: Date.now(), values };
  throw error;
}

export function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") out[key] = value;
  return out;
}
