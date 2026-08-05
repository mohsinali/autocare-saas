"use client";
import { Input } from "@/components/ui/input";

const fallbackTimezones = [
  "America/Chicago",
  "America/Los_Angeles",
  "America/New_York",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "UTC",
];

function availableTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return fallbackTimezones;
  }
}

const timezones = availableTimezones();

export function TimezoneSelect({
  value,
  onChange,
  id,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
  invalid?: boolean;
}): React.JSX.Element {
  return (
    <>
      <Input
        id={id}
        list={`${id}-options`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search IANA timezones"
        autoComplete="off"
        aria-invalid={invalid}
      />
      <datalist id={`${id}-options`}>
        {timezones.map((timezone) => (
          <option key={timezone} value={timezone} />
        ))}
      </datalist>
    </>
  );
}
