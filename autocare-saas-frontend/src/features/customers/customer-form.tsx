"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  customersService,
  type CustomerInput,
} from "@/services/api/customers.service";
import type { Customer } from "@/types";
import { customerFormSchema, type CustomerFormValues } from "./customer-schema";
export function CustomerForm({
  customer,
  onSuccess,
}: {
  customer?: Customer;
  onSuccess: () => void;
}): React.JSX.Element {
  const queryClient = useQueryClient();
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
    },
  });
  useEffect(() => {
    if (customer)
      form.reset({
        ...customer,
        email: customer.email ?? "",
        notes: customer.notes ?? "",
      });
  }, [customer, form]);
  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) => {
      const input: CustomerInput = {
        ...values,
        email: values.email || null,
        notes: values.notes || null,
      };
      return customer
        ? customersService.update(customer.id, input)
        : customersService.create(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success(customer ? "Customer updated" : "Customer added");
      onSuccess();
    },
    onError: () => toast.error("Could not save customer"),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="First name"
          error={form.formState.errors.firstName?.message}
        >
          <Input {...form.register("firstName")} />
        </Field>
        <Field
          label="Last name"
          error={form.formState.errors.lastName?.message}
        >
          <Input {...form.register("lastName")} />
        </Field>
      </div>
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" {...form.register("email")} />
      </Field>
      <Field label="Phone" error={form.formState.errors.phone?.message}>
        <Input {...form.register("phone")} />
      </Field>
      <Field label="Notes">
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      <Button className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
        {customer ? "Save changes" : "Add customer"}
      </Button>
    </form>
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
