import { IANAZone } from 'luxon';

export function isValidIanaTimezone(timezone: unknown): timezone is string {
  return typeof timezone === 'string' && IANAZone.isValidZone(timezone);
}
