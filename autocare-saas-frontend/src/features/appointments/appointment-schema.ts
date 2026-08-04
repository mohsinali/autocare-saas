import { z } from "zod";

export const appointmentFormSchema = z.object({
  branchId: z.string().uuid("Select a branch"),
  customerId: z.string().uuid("Select a customer"),
  vehicleId: z.string().uuid("Select a vehicle"),
  date: z.string().min(1, "Select a date"),
  time: z.string().min(1, "Select a time"),
  estimatedDurationMinutes: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 minute")
    .max(1440),
  serviceRequested: z
    .string()
    .trim()
    .min(1, "Describe the requested service")
    .max(500),
  notes: z.string().trim().max(4000).optional(),
});
export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
export const rescheduleSchema = appointmentFormSchema.pick({
  date: true,
  time: true,
});
