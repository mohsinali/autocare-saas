"use client";
import { useParams } from "next/navigation";
import { InvoiceDetail } from "@/features/invoices/components/invoice-detail";
export default function InvoiceDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  return <InvoiceDetail id={params.id} />;
}
