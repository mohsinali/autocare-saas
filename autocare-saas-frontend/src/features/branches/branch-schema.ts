import { IANAZone } from "luxon";
import { z } from "zod";

const phonePattern = /^[+0-9().\-\s]{7,30}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export const branchFormSchema = z
  .object({
    name: z.string().trim().min(1, "Branch name is required.").max(120),
    phone: z.string().trim().regex(phonePattern, "Enter a valid phone number."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .max(254)
      .or(z.literal("")),
    addressLine1: z.string().trim().min(1, "Address is required.").max(160),
    addressLine2: z.string().trim().max(160),
    city: z.string().trim().min(1, "City is required.").max(100),
    stateProvince: z
      .string()
      .trim()
      .min(1, "State or province is required.")
      .max(100),
    postalCode: z.string().trim().min(1, "Postal code is required.").max(30),
    country: z.string().trim().min(1, "Country is required.").max(100),
    timezone: z
      .string()
      .trim()
      .refine((value) => IANAZone.isValidZone(value), {
        message: "Select a valid IANA timezone.",
      }),
    businessOpeningTime: z.string().regex(timePattern, "Use HH:mm format."),
    businessClosingTime: z.string().regex(timePattern, "Use HH:mm format."),
    isActive: z.boolean(),
  })
  .refine((values) => values.businessOpeningTime < values.businessClosingTime, {
    path: ["businessClosingTime"],
    message: "Closing time must be after opening time.",
  });

export type BranchFormValues = z.infer<typeof branchFormSchema>;
