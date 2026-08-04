"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { AppointmentForm } from "@/features/appointments/components/appointment-form";
function Content(): React.JSX.Element {
  const params = useSearchParams();
  const customerId = params.get("customerId") ?? undefined;
  const returnTo = params.get("returnTo") ?? undefined;
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={returnTo ?? "/appointments"}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New appointment</h1>
        <p className="mt-1 text-slate-500">
          Schedule a visit in the selected branch’s local time.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <AppointmentForm lockedCustomerId={customerId} returnTo={returnTo} />
        </CardContent>
      </Card>
    </div>
  );
}
export default function NewAppointmentPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <Content />
    </Suspense>
  );
}
