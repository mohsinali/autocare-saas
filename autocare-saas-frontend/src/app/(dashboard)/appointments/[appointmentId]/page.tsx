"use client";
import { useParams } from "next/navigation";
import { AppointmentDetailsView } from "@/features/appointments/components/appointment-details-view";
export default function AppointmentDetailPage(): React.JSX.Element {
  const params = useParams<{ appointmentId: string }>();
  return <AppointmentDetailsView appointmentId={params.appointmentId} />;
}
