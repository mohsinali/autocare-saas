import { DateTime, IANAZone } from "luxon";

export function safeBranchTimezone(timezone?: string | null): string {
  return timezone && IANAZone.isValidZone(timezone) ? timezone : "UTC";
}

export function parseUtc(value: string): DateTime {
  return DateTime.fromISO(value, { zone: "utc", setZone: true });
}
export function formatAppointmentDateTime(
  value: string,
  timezone: string,
): string {
  const date = parseUtc(value).setZone(timezone);
  return date.isValid
    ? date.toLocaleString({
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Invalid date";
}
export function formatAppointmentTime(value: string, timezone: string): string {
  const date = parseUtc(value).setZone(timezone);
  return date.isValid
    ? date.toLocaleString({
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : "Invalid time";
}
export function utcToBranchFormValues(
  value: string,
  timezone: string,
): { date: string; time: string } {
  const date = parseUtc(value).setZone(timezone);
  if (!date.isValid) return { date: "", time: "" };
  return { date: date.toFormat("yyyy-LL-dd"), time: date.toFormat("HH:mm") };
}
export function branchLocalToApi(
  date: string,
  time: string,
  timezone: string,
): string {
  const local = DateTime.fromFormat(`${date} ${time}`, "yyyy-LL-dd HH:mm", {
    zone: timezone,
    setZone: true,
  });
  if (!local.isValid)
    throw new Error(local.invalidExplanation ?? "Invalid date or time");
  return local.toFormat("yyyy-LL-dd'T'HH:mm:ss");
}
export function branchDayUtcRange(
  date: string,
  timezone: string,
): { startDate: string; endDate: string } {
  const zone = safeBranchTimezone(timezone);
  const day = DateTime.fromISO(date, { zone });
  if (!day.isValid) {
    const fallback = DateTime.now().setZone(zone);
    return {
      startDate: fallback.startOf("day").toUTC().toISO()!,
      endDate: fallback.endOf("day").toUTC().toISO()!,
    };
  }
  return {
    startDate: day.startOf("day").toUTC().toISO()!,
    endDate: day.endOf("day").toUTC().toISO()!,
  };
}
export function todayInTimezone(timezone: string): string {
  return DateTime.now().setZone(safeBranchTimezone(timezone)).toISODate()!;
}
export function formatBusinessTime(value: string): string {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? value.slice(0, 5);
}
