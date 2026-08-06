"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceHistoryForm } from "@/features/service-history/components/service-history-form";
function Content(): React.JSX.Element {
  const params = useSearchParams();
  const returnTo = params.get("returnTo") ?? "/service-history";
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link
        href={returnTo}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back
      </Link>
      <div>
        <h1 className="text-2xl font-bold">New Service Record</h1>
        <p className="mt-1 text-slate-500">
          Create an active job using the selected branch’s local date and time.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <ServiceHistoryForm
            defaults={{
              branchId: params.get("branchId") ?? undefined,
              customerId: params.get("customerId") ?? undefined,
              vehicleId: params.get("vehicleId") ?? undefined,
              appointmentId: params.get("appointmentId") ?? undefined,
              date: params.get("date") ?? undefined,
              time: params.get("time") ?? undefined,
              initialRequest: params.get("initialRequest") ?? undefined,
            }}
            returnTo={returnTo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
export default function NewServiceHistoryPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingState rows={7} />}>
      <Content />
    </Suspense>
  );
}
