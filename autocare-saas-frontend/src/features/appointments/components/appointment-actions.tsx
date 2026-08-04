"use client";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  APPOINTMENT_STATUS,
  TERMINAL_APPOINTMENT_STATUSES,
  type StatusAction,
} from "../appointment-status";
import {
  branchLocalToApi,
  formatAppointmentDateTime,
  formatBusinessTime,
  utcToBranchFormValues,
} from "../appointment-date-utils";
import {
  useDeleteAppointment,
  useRescheduleAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
} from "../appointment-hooks";
import type { Appointment, Branch, Customer, Vehicle } from "@/types";

const editSchema = z.object({
  estimatedDurationMinutes: z.coerce.number().int().min(1).max(1440),
  serviceRequested: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(4000),
});
export function AppointmentActions({
  appointment,
  branch,
  customer,
  vehicle,
}: {
  appointment: Appointment;
  branch: Branch;
  customer?: Customer;
  vehicle?: Vehicle;
}): React.JSX.Element {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [reschedule, setReschedule] = useState(false);
  const [action, setAction] = useState<StatusAction>();
  const [remove, setRemove] = useState(false);
  const statusMutation = useUpdateAppointmentStatus(appointment.id);
  const deleteMutation = useDeleteAppointment(appointment.id);
  const modifiable = !TERMINAL_APPOINTMENT_STATUSES.includes(
    appointment.status,
  );
  function runAction(next: StatusAction): void {
    if (next.confirmation) setAction(next);
    else statusMutation.mutate({ status: next.status });
  }
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {modifiable && (
          <>
            <Button variant="outline" onClick={() => setEdit(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={() => setReschedule(true)}>
              Reschedule
            </Button>
          </>
        )}
        {APPOINTMENT_STATUS[appointment.status].actions.map((item) => (
          <Button
            key={item.status}
            variant={item.status === "CANCELLED" ? "destructive" : "default"}
            onClick={() => runAction(item)}
            disabled={statusMutation.isPending}
          >
            {item.label}
          </Button>
        ))}
        {modifiable && (
          <Button
            variant="ghost"
            aria-label="Delete appointment"
            onClick={() => setRemove(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <h2 className="text-lg font-semibold">Edit appointment</h2>
          <EditForm appointment={appointment} onDone={() => setEdit(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={reschedule} onOpenChange={setReschedule}>
        <DialogContent>
          <h2 className="text-lg font-semibold">Reschedule appointment</h2>
          <p className="text-sm text-slate-500">
            Currently{" "}
            {formatAppointmentDateTime(
              appointment.appointmentDateTimeUtc,
              branch.timezone,
            )}
          </p>
          <RescheduleForm
            appointment={appointment}
            branch={branch}
            onDone={() => setReschedule(false)}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(action)}
        onOpenChange={(open) => {
          if (!open) setAction(undefined);
        }}
      >
        <DialogContent>
          <h2 className="text-lg font-semibold">{action?.label}?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {action?.status === "CANCELLED"
              ? `Cancel ${customer ? `${customer.firstName} ${customer.lastName}’s` : "this"} appointment for ${vehicle?.registrationNumber ?? "the selected vehicle"}? It will remain in appointment history.`
              : "This status change cannot be undone through the current workflow."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAction(undefined)}>
              Keep appointment
            </Button>
            <Button
              variant={
                action?.status === "CANCELLED" ? "destructive" : "default"
              }
              disabled={statusMutation.isPending}
              onClick={() => {
                if (action)
                  statusMutation.mutate(
                    { status: action.status },
                    { onSuccess: () => setAction(undefined) },
                  );
              }}
            >
              {statusMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {action?.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={remove} onOpenChange={setRemove}>
        <DialogContent>
          <h2 className="text-lg font-semibold">Delete appointment?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This removes the appointment from normal history. Use cancellation
            for ordinary customer cancellations.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemove(false)}>
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteMutation.mutate(undefined, {
                  onSuccess: () => router.push("/appointments"),
                })
              }
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function EditForm({
  appointment,
  onDone,
}: {
  appointment: Appointment;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useUpdateAppointment(appointment.id);
  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      estimatedDurationMinutes: appointment.estimatedDurationMinutes,
      serviceRequested: appointment.serviceRequested,
      notes: appointment.notes ?? "",
    },
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate(values, {
          onSuccess: onDone,
          onError: (error) =>
            form.setError("root", { message: apiMessage(error) }),
        }),
      )}
    >
      <Field
        label="Estimated duration (minutes)"
        error={form.formState.errors.estimatedDurationMinutes?.message}
      >
        <Input type="number" {...form.register("estimatedDurationMinutes")} />
      </Field>
      <Field
        label="Requested service"
        error={form.formState.errors.serviceRequested?.message}
      >
        <textarea
          className="min-h-24 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("serviceRequested")}
        />
      </Field>
      <Field label="Notes" error={form.formState.errors.notes?.message}>
        <textarea
          className="min-h-20 w-full rounded-lg border bg-transparent p-3 text-sm"
          {...form.register("notes")}
        />
      </Field>
      {form.formState.errors.root?.message && (
        <p role="alert" className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button className="w-full" disabled={mutation.isPending}>
        Save changes
      </Button>
    </form>
  );
}
function RescheduleForm({
  appointment,
  branch,
  onDone,
}: {
  appointment: Appointment;
  branch: Branch;
  onDone: () => void;
}): React.JSX.Element {
  const mutation = useRescheduleAppointment(appointment.id);
  const defaults = utcToBranchFormValues(
    appointment.appointmentDateTimeUtc,
    branch.timezone,
  );
  const form = useForm<{ date: string; time: string }>({
    defaultValues: defaults,
  });
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        try {
          mutation.mutate(
            {
              appointmentDateTime: branchLocalToApi(
                values.date,
                values.time,
                branch.timezone,
              ),
            },
            {
              onSuccess: onDone,
              onError: (error) =>
                form.setError("root", { message: apiMessage(error) }),
            },
          );
        } catch {
          form.setError("time", { message: "Invalid local date or time." });
        }
      })}
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="New date">
          <Input type="date" required {...form.register("date")} />
        </Field>
        <Field label="New time" error={form.formState.errors.time?.message}>
          <Input type="time" required {...form.register("time")} />
        </Field>
      </div>
      <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
        Times are in {branch.timezone}. Branch hours:{" "}
        {formatBusinessTime(branch.businessOpeningTime)}–
        {formatBusinessTime(branch.businessClosingTime)}.
      </p>
      {form.formState.errors.root?.message && (
        <p role="alert" className="text-sm text-red-600">
          {form.formState.errors.root.message}
        </p>
      )}
      <Button className="w-full" disabled={mutation.isPending}>
        Reschedule
      </Button>
    </form>
  );
}
function apiMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
    const message = error.response?.data.message;
    return Array.isArray(message)
      ? message.join(". ")
      : (message ?? "The request could not be completed.");
  }
  return "The request could not be completed.";
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
      {error && (
        <span role="alert" className="block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
