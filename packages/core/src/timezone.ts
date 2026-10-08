/**
 * IANA timezone helpers. The database also checks `client.timezone`
 * against `pg_timezone_names`, so this is a fast first gate for forms.
 */

const FALLBACK_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Managua",
  "America/Panama",
  "America/Bogota",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Berlin",
];

/** True when the runtime accepts `tz` as an IANA zone name. Rejects offsets like "+02:00" and empty strings. */
export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string") return false;
  const value = tz.trim();
  if (value.length === 0 || value !== tz) return false;
  // Offsets and abbreviations are not IANA names, even when Intl accepts them.
  if (/^[+-]\d/.test(value) || (/^[A-Z]{3,4}$/.test(value) && value !== "UTC")) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** Sorted list of zones for pickers. Uses Intl when available. */
export function listTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  const zones = typeof intl.supportedValuesOf === "function" ? intl.supportedValuesOf("timeZone") : FALLBACK_TIMEZONES;
  const set = new Set(zones);
  set.add("UTC");
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Formats the current UTC offset of a zone, e.g. "UTC-06:00". */
export function formatUtcOffset(tz: string, at: Date = new Date()): string {
  if (!isValidTimeZone(tz)) throw new RangeError(`Unknown time zone: ${tz}`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  if (name === "GMT") return "UTC+00:00";
  return name.replace("GMT", "UTC");
}
