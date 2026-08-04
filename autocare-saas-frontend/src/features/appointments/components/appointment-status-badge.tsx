import { APPOINTMENT_STATUS } from "../appointment-status";
import type { AppointmentStatus } from "@/types";

export function AppointmentStatusBadge({
  status,
}: {
  status: AppointmentStatus;
}): React.JSX.Element {
  const config = APPOINTMENT_STATUS[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}
