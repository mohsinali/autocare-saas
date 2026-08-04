import { Suspense } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { AppointmentsWorkspace } from "@/features/appointments/components/appointments-workspace";
export default function AppointmentsPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingState rows={6} />}>
      <AppointmentsWorkspace />
    </Suspense>
  );
}
