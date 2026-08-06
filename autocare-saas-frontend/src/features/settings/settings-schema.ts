import { z } from "zod";

export const settingsFormSchema = z.object({
  currencyCode: z
    .string()
    .min(1, "Currency code is required.")
    .length(3, "Currency code must be exactly three characters.")
    .regex(/^[A-Z]{3}$/, "Currency code must use three uppercase letters."),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
