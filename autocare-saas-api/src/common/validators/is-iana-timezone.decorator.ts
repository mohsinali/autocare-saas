import { ValidationOptions, ValidateBy } from 'class-validator';
import { isValidIanaTimezone } from '../../timezone/timezone.utils';

export function IsIanaTimezone(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy({ name: 'isIanaTimezone', validator: { validate: isValidIanaTimezone, defaultMessage: () => 'timezone must be a valid IANA timezone identifier' } }, validationOptions);
}
