import type { AppointmentStatus } from "@/types";

export interface StatusAction {
  status: AppointmentStatus;
  label: string;
  confirmation: boolean;
}
export const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; className: string; actions: StatusAction[] }
> = {
  SCHEDULED: {
    label: "Scheduled",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    actions: [
      { status: "CONFIRMED", label: "Confirm", confirmation: false },
      { status: "CANCELLED", label: "Cancel appointment", confirmation: true },
    ],
  },
  CONFIRMED: {
    label: "Confirmed",
    className:
      "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300",
    actions: [
      { status: "CHECKED_IN", label: "Check in", confirmation: false },
      { status: "NO_SHOW", label: "Mark no-show", confirmation: true },
      { status: "CANCELLED", label: "Cancel appointment", confirmation: true },
    ],
  },
  CHECKED_IN: {
    label: "Checked in",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    actions: [
      { status: "IN_SERVICE", label: "Start service", confirmation: false },
      { status: "CANCELLED", label: "Cancel appointment", confirmation: true },
    ],
  },
  IN_SERVICE: {
    label: "In service",
    className:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    actions: [{ status: "COMPLETED", label: "Complete", confirmation: true }],
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    actions: [],
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    actions: [],
  },
  NO_SHOW: {
    label: "No-show",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    actions: [],
  },
};
export const TERMINAL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
