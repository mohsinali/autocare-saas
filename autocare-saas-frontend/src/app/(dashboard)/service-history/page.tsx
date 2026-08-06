import { Suspense } from "react";
import { LoadingState } from "@/components/common/loading-state";
import { ServiceHistoryWorkspace } from "@/features/service-history/components/service-history-workspace";
export default function ServiceHistoryPage(): React.JSX.Element {
  return (
    <Suspense fallback={<LoadingState rows={7} />}>
      <ServiceHistoryWorkspace />
    </Suspense>
  );
}
