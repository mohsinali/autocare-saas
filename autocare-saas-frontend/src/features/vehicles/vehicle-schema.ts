import { z } from "zod";

const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).optional();

export const vehicleFormSchema = z.object({
  registrationNumber: optionalText(40),
  make: optionalText(80),
  model: optionalText(80),
  variant: optionalText(80),
  year: z
    .string()
    .regex(/^(|18[89]\d|19\d{2}|20\d{2}|[3-9]\d{3})$/, "Enter a valid year")
    .refine(
      (value) => !value || Number(value) <= new Date().getFullYear() + 1,
      "Year cannot be more than one year in the future",
    )
    .optional(),
  currentMileage: z.coerce.number().int().min(0, "Mileage cannot be negative"),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "SCRAPPED"]),
  notes: z.string().trim().max(2000).optional(),
});

export const quickVehicleSchema = vehicleFormSchema
  .pick({
    registrationNumber: true,
    make: true,
    model: true,
    year: true,
    currentMileage: true,
  })
  .extend({
    make: z.string().trim().min(1, "Make is required").max(80),
    model: z.string().trim().min(1, "Model is required").max(80),
  });

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;
export type QuickVehicleValues = z.infer<typeof quickVehicleSchema>;
