import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional();
export const serviceHistorySchema = z.object({
  branchId: z.string().uuid("Select a branch"),
  customerId: z.string().uuid("Select a customer"),
  vehicleId: z.string().uuid("Select a vehicle"),
  appointmentId: z.string().optional(),
  date: z.string().min(1, "Select a date"),
  time: z.string().min(1, "Select a time"),
  mileageAtService: z.union([z.literal(""), z.coerce.number().int().min(0)]),
  initialRequest: z
    .string()
    .trim()
    .min(1, "Enter the initial request")
    .max(4000),
  customerComplaint: optionalText(2000),
  diagnosis: optionalText(4000),
  workSummary: optionalText(4000),
  recommendations: optionalText(4000),
  internalNotes: optionalText(4000),
});
export const lineItemSchema = z.object({
  type: z.enum(["SERVICE", "PART", "LABOR", "OTHER"]),
  description: z.string().trim().min(1).max(500),
  quantity: z
    .string()
    .regex(
      /^(?=.*[1-9])\d+(?:\.\d{1,3})?$/,
      "Enter a positive quantity with up to 3 decimals",
    ),
  unitPrice: z
    .string()
    .regex(
      /^\d+(?:\.\d{1,2})?$/,
      "Enter a non-negative price with up to 2 decimals",
    ),
  notes: optionalText(2000),
});
export const completionSchema = z.object({
  mileageAtService: z.coerce.number().int().min(0),
  workSummary: optionalText(4000),
  recommendations: optionalText(4000),
});
export type ServiceHistoryFormValues = z.infer<typeof serviceHistorySchema>;
export type LineItemFormValues = z.infer<typeof lineItemSchema>;
