import { formatUtcOffset, listTimeZones } from "@spear/core";
import type { ClientFieldOptions } from "@/components/client-fields";
import { LANGUAGES, REGIONS } from "@/lib/data";

/** Built on the server so client bundles never import the data layer. */
export function clientFieldOptions(): ClientFieldOptions {
  const now = new Date();
  return {
    timezones: listTimeZones().map((tz) => ({
      value: tz,
      label: `${tz.replaceAll("_", " ")} (${formatUtcOffset(tz, now)})`,
    })),
    languages: LANGUAGES.map((l) => ({ ...l })),
    regions: REGIONS.map((r) => ({ ...r })),
  };
}
