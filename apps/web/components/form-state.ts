/** Shape returned by every server action that backs a form. */
export type FormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Changes on every submit so client forms can reset after success. */
  at?: number;
  /** Submitted values, echoed back on error: React resets uncontrolled forms after an action. */
  values?: Record<string, string>;
};

export const idleState: FormState = { status: "idle" };
