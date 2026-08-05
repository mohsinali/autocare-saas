export function branchTimeValue(value: string): string {
  const match = /T(\d{2}:\d{2})/.exec(value);
  return match?.[1] ?? value.slice(0, 5);
}

export function branchAddress(branch: {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
}): string {
  return [
    branch.addressLine1,
    branch.addressLine2,
    branch.city,
    branch.stateProvince,
    branch.postalCode,
    branch.country,
  ]
    .filter(Boolean)
    .join(", ");
}
