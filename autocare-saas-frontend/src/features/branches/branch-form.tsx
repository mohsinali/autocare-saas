"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BranchInput } from "@/services/api/branches.service";
import type { Branch } from "@/types";
import {
  getBranchErrorMessage,
  useCreateBranch,
  useUpdateBranch,
} from "./branch-hooks";
import { branchFormSchema, type BranchFormValues } from "./branch-schema";
import { branchTimeValue } from "./branch-utils";
import { TimezoneSelect } from "./timezone-select";

const defaults: BranchFormValues = {
  name: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  stateProvince: "",
  postalCode: "",
  country: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  businessOpeningTime: "09:00",
  businessClosingTime: "17:00",
  isActive: true,
};

export function BranchForm({
  branch,
  onSuccess,
}: {
  branch?: Branch;
  onSuccess: () => void;
}): React.JSX.Element {
  const create = useCreateBranch();
  const update = useUpdateBranch();
  const mutation = branch ? update : create;
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: defaults,
  });
  useEffect(() => {
    form.reset(
      branch
        ? {
            name: branch.name,
            phone: branch.phone,
            email: branch.email ?? "",
            addressLine1: branch.addressLine1,
            addressLine2: branch.addressLine2 ?? "",
            city: branch.city,
            stateProvince: branch.stateProvince,
            postalCode: branch.postalCode,
            country: branch.country,
            timezone: branch.timezone,
            businessOpeningTime: branchTimeValue(branch.businessOpeningTime),
            businessClosingTime: branchTimeValue(branch.businessClosingTime),
            isActive: branch.isActive,
          }
        : defaults,
    );
  }, [branch, form]);

  function submit(values: BranchFormValues): void {
    const input: BranchInput = {
      ...values,
      email: values.email || undefined,
      addressLine2: values.addressLine2 || undefined,
    };
    const options = {
      onSuccess: () => {
        if (!branch) form.reset(defaults);
        onSuccess();
      },
      onError: (error: unknown) => {
        const message = getBranchErrorMessage(error, "Could not save branch.");
        form.setError("root", { message });
        toast.error(message);
      },
    };
    if (branch) update.mutate({ id: branch.id, input }, options);
    else create.mutate(input, options);
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(submit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Branch name" error={form.formState.errors.name?.message}>
          <Input
            {...form.register("name")}
            aria-invalid={Boolean(form.formState.errors.name)}
          />
        </Field>
        <Field label="Phone" error={form.formState.errors.phone?.message}>
          <Input
            type="tel"
            {...form.register("phone")}
            aria-invalid={Boolean(form.formState.errors.phone)}
          />
        </Field>
      </div>
      <Field
        label="Email"
        description="Optional branch contact email."
        error={form.formState.errors.email?.message}
      >
        <Input
          type="email"
          {...form.register("email")}
          aria-invalid={Boolean(form.formState.errors.email)}
        />
      </Field>
      <Field
        label="Address line 1"
        error={form.formState.errors.addressLine1?.message}
      >
        <Input
          {...form.register("addressLine1")}
          aria-invalid={Boolean(form.formState.errors.addressLine1)}
        />
      </Field>
      <Field
        label="Address line 2"
        error={form.formState.errors.addressLine2?.message}
      >
        <Input {...form.register("addressLine2")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" error={form.formState.errors.city?.message}>
          <Input {...form.register("city")} />
        </Field>
        <Field
          label="State or province"
          error={form.formState.errors.stateProvince?.message}
        >
          <Input {...form.register("stateProvince")} />
        </Field>
        <Field
          label="Postal code"
          error={form.formState.errors.postalCode?.message}
        >
          <Input {...form.register("postalCode")} />
        </Field>
        <Field label="Country" error={form.formState.errors.country?.message}>
          <Input {...form.register("country")} />
        </Field>
      </div>
      <Field
        label="Timezone"
        description="Appointments and hours use this branch-local IANA timezone."
        error={form.formState.errors.timezone?.message}
      >
        <Controller
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <TimezoneSelect
              id="branch-timezone"
              value={field.value}
              onChange={field.onChange}
              invalid={Boolean(form.formState.errors.timezone)}
            />
          )}
        />
      </Field>
      <fieldset className="rounded-lg border p-4">
        <legend className="px-1 text-sm font-semibold">
          Daily business hours
        </legend>
        <p className="mb-4 text-xs text-slate-500">
          The current API applies one local opening window to every day.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Opening time"
            error={form.formState.errors.businessOpeningTime?.message}
          >
            <Input type="time" {...form.register("businessOpeningTime")} />
          </Field>
          <Field
            label="Closing time"
            error={form.formState.errors.businessClosingTime?.message}
          >
            <Input type="time" {...form.register("businessClosingTime")} />
          </Field>
        </div>
      </fieldset>
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4"
          {...form.register("isActive")}
        />
        <span>
          <span className="block font-medium">Active branch</span>
          <span className="text-xs text-slate-500">
            Active branches are available for appointment scheduling.
          </span>
        </span>
      </label>
      {form.formState.errors.root?.message && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {form.formState.errors.root.message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button disabled={mutation.isPending || !form.formState.isDirty}>
          {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
          {branch ? "Save changes" : "Add branch"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
      {description && (
        <span className="block text-xs font-normal text-slate-500">
          {description}
        </span>
      )}
      {error && (
        <span role="alert" className="block text-xs font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
