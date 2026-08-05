import { z } from "zod";

export const customerFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")),
  phone: z.string().trim().min(1, "Phone is required").max(30),
  notes: z.string().trim().max(2000).optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
