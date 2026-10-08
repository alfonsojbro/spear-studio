import { z } from "zod";
import { AGENCY_ROLES, isValidTimeZone } from "@spear/core";
import { PLATFORMS } from "@spear/db";
import { ValidationError } from "./errors";

export const LANGUAGES = [
  { value: "es", label: "Spanish" },
  { value: "en", label: "English" },
  { value: "pt", label: "Portuguese" },
] as const;

export const REGIONS = [
  { value: "US", label: "United States" },
  { value: "MX", label: "Mexico" },
  { value: "NI", label: "Nicaragua" },
  { value: "CR", label: "Costa Rica" },
  { value: "PA", label: "Panama" },
  { value: "CO", label: "Colombia" },
  { value: "PE", label: "Peru" },
  { value: "AR", label: "Argentina" },
  { value: "CL", label: "Chile" },
  { value: "BR", label: "Brazil" },
  { value: "ES", label: "Spain" },
] as const;

export const clientInput = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters.").max(80, "Use 80 characters or fewer."),
  timezone: z.string().refine(isValidTimeZone, "Pick a valid time zone."),
  language: z.enum(LANGUAGES.map((l) => l.value) as [string, ...string[]], { error: "Pick a language." }),
  region: z.enum(REGIONS.map((r) => r.value) as [string, ...string[]], { error: "Pick a region." }),
});
export type ClientInput = z.infer<typeof clientInput>;

export const socialAccountInput = z.object({
  platform: z.enum(PLATFORMS, { error: "Pick a platform." }),
  handle: z
    .string()
    .trim()
    .transform((h) => h.replace(/^@+/, ""))
    .pipe(
      z
        .string()
        .min(1, "Enter a handle.")
        .max(60, "Handles are 60 characters or fewer.")
        .regex(/^[A-Za-z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores."),
    ),
});
export type SocialAccountInput = z.infer<typeof socialAccountInput>;

export const inviteInput = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email.")),
  role: z.enum(AGENCY_ROLES, { error: "Pick a role." }),
  clientId: z
    .string()
    .optional()
    .transform((v) => (v ? v : undefined)),
});
export type InviteInput = z.infer<typeof inviteInput>;

/** Parses or throws a ValidationError with per-field messages for forms. */
export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  throw new ValidationError("Check the highlighted fields.", fieldErrors);
}

export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "client";
}
