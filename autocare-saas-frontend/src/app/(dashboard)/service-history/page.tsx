"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { customersService } from "@/services/api/customers.service";
import { serviceHistoryService } from "@/services/api/service-history.service";
const schema = z.object({
  customerId: z.string().uuid("Select a customer"),
  serviceDate: z.string().min(1, "Select a date"),
  description: z.string().min(3, "Describe the service"),
  mileage: z.coerce.number().int().nonnegative().optional(),
  totalAmount: z.coerce.number().nonnegative("Enter a valid amount"),
});
type Values = z.infer<typeof schema>;
export default function ServiceHistoryPage(): React.JSX.Element {
  const queryClient = useQueryClient();
  const customers = useQuery({
    queryKey: ["customers", "selector"],
    queryFn: () => customersService.list({ page: 1, limit: 100 }),
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      serviceDate: new Date().toISOString().slice(0, 10),
      description: "",
      totalAmount: 0,
    },
  });
  const mutation = useMutation({
    mutationFn: serviceHistoryService.create,
    onSuccess: () => {
      toast.success("Service record added");
      form.reset({
        serviceDate: new Date().toISOString().slice(0, 10),
        description: "",
        totalAmount: 0,
      });
      void queryClient.invalidateQueries({ queryKey: ["service-history"] });
    },
    onError: () => toast.error("Could not save service record"),
  });
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-sm text-slate-500">
          Record completed work and maintain a complete customer record.
        </p>
        <h2 className="mt-1 text-2xl font-semibold">Service history</h2>
      </div>
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Add service record</h3>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <Field
              label="Customer"
              error={form.formState.errors.customerId?.message}
            >
              <select
                className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm"
                defaultValue=""
                {...form.register("customerId")}
              >
                <option value="" disabled>
                  Select a customer
                </option>
                {customers.data?.data.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.firstName} {customer.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Service date"
              error={form.formState.errors.serviceDate?.message}
            >
              <Input type="date" {...form.register("serviceDate")} />
            </Field>
            <Field
              label="Service description"
              error={form.formState.errors.description?.message}
            >
              <textarea
                className="min-h-24 w-full rounded-lg border bg-transparent p-3 text-sm"
                {...form.register("description")}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Mileage">
                <Input type="number" min="0" {...form.register("mileage")} />
              </Field>
              <Field
                label="Total amount"
                error={form.formState.errors.totalAmount?.message}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  {...form.register("totalAmount")}
                />
              </Field>
            </div>
            <Button disabled={mutation.isPending || customers.isLoading}>
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Save record
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
