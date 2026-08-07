import { z } from "zod";
const decimal = /^\d+(?:\.\d{1,2})?$/;
export const invoiceEditSchema = z.object({
  dueDate: z.string(),
  taxLabel: z.string().max(100),
  discountAmount: z.string().regex(decimal, "Enter a non-negative amount"),
  notes: z.string().max(2000),
  internalNotes: z.string().max(2000),
});
export const invoiceLineSchema = z.object({
  type: z.enum(["SERVICE", "PART", "LABOR", "OTHER"]),
  description: z.string().trim().min(1, "Description is required").max(500),
  quantity: z
    .string()
    .regex(
      /^(?=.*[1-9])\d+(?:\.\d{1,2})?$/,
      "Quantity must be greater than zero",
    ),
  unitPrice: z.string().regex(decimal, "Unit price must be zero or greater"),
  taxRate: z
    .string()
    .regex(
      /^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/,
      "Tax rate must be between 0 and 100",
    ),
});
export type InvoiceEditValues = z.infer<typeof invoiceEditSchema>;
export type InvoiceLineValues = z.infer<typeof invoiceLineSchema>;
