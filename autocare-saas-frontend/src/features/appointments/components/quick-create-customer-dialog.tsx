"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreateCustomer } from "@/features/customers/customer-hooks";
import {
  customerFormSchema,
  type CustomerFormValues,
} from "@/features/customers/customer-schema";
import type { Customer } from "@/types";

function errorMessage(error: unknown): string {
  if (!axios.isAxiosError<{ message?: string | string[] }>(error))
    return "Unable to create customer.";
  const message = error.response?.data.message;
  return Array.isArray(message)
    ? message.join(". ")
    : (message ?? "Unable to create customer.");
}

export function QuickCreateCustomerDialog({
  open,
  initialSearch,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  initialSearch: string;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}): React.JSX.Element {
  const titleId = useId();
  const mutation = useCreateCustomer();
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
    if (!open) return;
    const parts = initialSearch.trim().split(/\s+/).filter(Boolean);
    form.reset({
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" "),
      email: initialSearch.includes("@") ? initialSearch : "",
      phone: /^\+?[\d\s()-]+$/.test(initialSearch) ? initialSearch : "",
      notes: "",
    });
  }, [form, initialSearch, open]);

  function submit(values: CustomerFormValues): void {
    mutation.mutate(
      {
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || null,
        notes: null,
      },
      {
        onSuccess: (customer) => {
          onOpenChange(false);
          onCreated(customer);
        },
        onError: (error) =>
          form.setError("root", { message: errorMessage(error) }),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-labelledby={titleId} aria-describedby={undefined}>
        <h2 id={titleId} className="mb-5 text-lg font-semibold">
          Create new customer
        </h2>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(submit)}
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              required
              error={form.formState.errors.firstName?.message}
            >
              <Input autoFocus {...form.register("firstName")} />
            </Field>
            <Field
              label="Last name"
              required
              error={form.formState.errors.lastName?.message}
            >
              <Input {...form.register("lastName")} />
            </Field>
          </div>
          <Field
            label="Phone"
            required
            error={form.formState.errors.phone?.message}
          >
            <Input type="tel" {...form.register("phone")} />
          </Field>
          <Field label="Email" error={form.formState.errors.email?.message}>
            <Input type="email" {...form.register("email")} />
          </Field>
          {form.formState.errors.root?.message && (
            <p role="alert" className="text-sm text-red-600">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Create customer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      {label}
      {required && <span className="text-red-600"> *</span>}
      {children}
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
