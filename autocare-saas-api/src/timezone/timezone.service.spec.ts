import { BadRequestException } from '@nestjs/common';
import { TimezoneService } from './timezone.service';

describe('TimezoneService', () => {
  const service = new TimezoneService();
  it('converts tenant-local time to a UTC instant', () => { expect(service.convertLocalToUtc('2026-08-01T09:30:00', 'Asia/Karachi').toISOString()).toBe('2026-08-01T04:30:00.000Z'); });
  it('converts a UTC instant to a tenant-local time', () => { expect(service.convertUtcToLocal(new Date('2026-08-01T04:30:00.000Z'), 'Asia/Karachi')).toBe('2026-08-01T09:30:00'); });
  it('rejects invalid IANA timezone identifiers', () => { expect(service.isValidTimezone('GMT+05:00')).toBe(false); expect(() => service.convertLocalToUtc('2026-08-01T09:30:00', 'GMT+05:00')).toThrow(BadRequestException); });
  it('uses daylight-saving rules for local-to-UTC conversion', () => { expect(service.convertLocalToUtc('2026-03-08T01:30:00', 'America/New_York').toISOString()).toBe('2026-03-08T06:30:00.000Z'); expect(service.convertLocalToUtc('2026-03-08T03:30:00', 'America/New_York').toISOString()).toBe('2026-03-08T07:30:00.000Z'); });
});
