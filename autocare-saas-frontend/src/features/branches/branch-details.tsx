"use client";
import { ArrowLeft, Mail, MapPin, Pencil, Phone, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { useBranch } from "./branch-hooks";
import { BranchBusinessHours } from "./branch-business-hours";
import { BranchDialog } from "./branch-dialog";
import { DeleteBranchDialog } from "./delete-branch-dialog";
import { branchAddress } from "./branch-utils";

export function BranchDetails({
  branchId,
}: {
  branchId: string;
}): React.JSX.Element {
  const router = useRouter();
  const query = useBranch(branchId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  if (query.isLoading) return <LoadingState rows={5} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        title="Branch not found"
        description="This branch may have been removed or you may not have access to it."
        onRetry={() => void query.refetch()}
      />
    );
  const branch = query.data;
  return (
    <div className="space-y-6">
      <Link
        href="/branches"
        className="inline-flex items-center gap-2 rounded-sm text-sm text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft className="size-4" />
        Back to branches
      </Link>
      <PageHeader
        eyebrow="Branch Workspace"
        title={branch.name}
        description={`${branch.city}, ${branch.stateProvince} · ${branch.timezone}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleting(true)}>
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        }
      />
      <div className="border-b">
        <span className="inline-block border-b-2 border-blue-600 px-1 pb-3 text-sm font-medium text-blue-600">
          Overview
        </span>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-semibold">Location and contact</h3>
            <dl className="mt-5 grid gap-5 text-sm sm:grid-cols-2">
              <Detail
                icon={<MapPin className="size-4" />}
                label="Complete address"
                value={branchAddress(branch)}
              />
              <Detail
                icon={<Phone className="size-4" />}
                label="Phone"
                value={branch.phone}
              />
              <Detail
                icon={<Mail className="size-4" />}
                label="Email"
                value={branch.email ?? "—"}
              />
              <Detail
                label="Status"
                value={branch.isActive ? "Active" : "Inactive"}
              />
              <Detail label="Created" value={formatDate(branch.createdAt)} />
              <Detail
                label="Last updated"
                value={formatDate(branch.updatedAt)}
              />
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold">Business hours</h3>
            <BranchBusinessHours
              openingTime={branch.businessOpeningTime}
              closingTime={branch.businessClosingTime}
              timezone={branch.timezone}
            />
          </CardContent>
        </Card>
      </div>
      <BranchDialog open={editing} onOpenChange={setEditing} branch={branch} />
      <DeleteBranchDialog
        branch={deleting ? branch : null}
        onClose={() => setDeleting(false)}
        onDeleted={() => router.replace("/branches")}
      />
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div>
      <dt className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
