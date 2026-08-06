import { BadRequestException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { isValidIanaTimezone } from './timezone.utils';

@Injectable()
export class TimezoneService {
  isValidTimezone(timezone: string): boolean { return isValidIanaTimezone(timezone); }

  convertLocalToUtc(localDateTime: string, timezone: string): Date {
    this.assertValidTimezone(timezone);
    if (this.hasUtcOffset(localDateTime)) throw new BadRequestException('Local date/time must not contain a UTC offset');
    const local = DateTime.fromISO(localDateTime, { zone: timezone });
    if (!local.isValid) throw new BadRequestException(`Invalid local date/time: ${local.invalidExplanation ?? local.invalidReason ?? 'unknown reason'}`);
    return local.toUTC().toJSDate();
  }

  convertUtcToLocal(utcDateTime: Date, timezone: string): string {
    this.assertValidTimezone(timezone);
    const utc = DateTime.fromJSDate(utcDateTime, { zone: 'utc' });
    if (!utc.isValid) throw new BadRequestException('Invalid UTC date/time');
    return utc.setZone(timezone).toFormat("yyyy-LL-dd'T'HH:mm:ss");
  }

  localDayUtcRange(timezone: string, dayOffset = 0, now = new Date()): { startDate: Date; endDate: Date } {
    this.assertValidTimezone(timezone);
    const localDay = DateTime.fromJSDate(now, { zone: 'utc' }).setZone(timezone).plus({ days: dayOffset });
    if (!localDay.isValid) throw new BadRequestException('Invalid reference date');
    return {
      startDate: localDay.startOf('day').toUTC().toJSDate(),
      endDate: localDay.endOf('day').toUTC().toJSDate(),
    };
  }

  private assertValidTimezone(timezone: string): void {
    if (!this.isValidTimezone(timezone)) throw new BadRequestException('timezone must be a valid IANA timezone identifier');
  }

  private hasUtcOffset(value: string): boolean { return /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value); }
}
