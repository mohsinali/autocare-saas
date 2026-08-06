"use client";
import { useParams } from "next/navigation";
import { ServiceHistoryDetails } from "@/features/service-history/components/service-history-details";
export default function ServiceHistoryDetailPage(): React.JSX.Element {
  const params = useParams<{ serviceHistoryId: string }>();
  return <ServiceHistoryDetails id={params.serviceHistoryId} />;
}
