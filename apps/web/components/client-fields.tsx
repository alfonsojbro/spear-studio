import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";

export type Option = { value: string; label: string };

export type ClientFieldOptions = { timezones: Option[]; languages: Option[]; regions: Option[] };

export type ClientFieldValues = { name: string; timezone: string; language: string; region: string };

/** Shared fields for "New client" and client settings. */
export function ClientFields({
  idPrefix,
  options,
  defaults,
  errors = {},
  disabled,
}: {
  idPrefix: string;
  options: ClientFieldOptions;
  defaults: ClientFieldValues;
  errors?: Record<string, string>;
  disabled?: boolean;
}) {
  const id = (k: string) => `${idPrefix}-${k}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={id("name")} label="Client name" error={errors.name} className="sm:col-span-2">
        <Input
          id={id("name")}
          name="name"
          defaultValue={defaults.name}
          required
          maxLength={80}
          autoComplete="off"
          disabled={disabled}
          aria-invalid={!!errors.name}
          placeholder="Casa Lumbre"
        />
      </Field>
      <Field
        id={id("timezone")}
        label="Time zone"
        hint="Posting slots use this zone."
        error={errors.timezone}
        className="sm:col-span-2"
      >
        <Select id={id("timezone")} name="timezone" defaultValue={defaults.timezone} disabled={disabled} aria-invalid={!!errors.timezone}>
          {options.timezones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={id("language")} label="Content language" error={errors.language}>
        <Select id={id("language")} name="language" defaultValue={defaults.language} disabled={disabled} aria-invalid={!!errors.language}>
          {options.languages.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={id("region")} label="Region" error={errors.region}>
        <Select id={id("region")} name="region" defaultValue={defaults.region} disabled={disabled} aria-invalid={!!errors.region}>
          {options.regions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
