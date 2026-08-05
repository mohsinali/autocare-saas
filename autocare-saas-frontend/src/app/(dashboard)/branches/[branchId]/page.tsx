"use client";
import { useParams } from "next/navigation";
import { BranchDetails } from "@/features/branches/branch-details";

export default function BranchDetailPage(): React.JSX.Element {
  const params = useParams<{ branchId: string }>();
  return <BranchDetails branchId={params.branchId} />;
}
