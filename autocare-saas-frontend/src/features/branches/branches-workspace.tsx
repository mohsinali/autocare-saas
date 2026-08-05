"use client";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useBranches } from "./branch-hooks";
import { BranchDialog } from "./branch-dialog";
import { BranchTable } from "./branch-table";

export function BranchesWorkspace(): React.JSX.Element {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const query = useBranches({ page, limit: 10, search: search || undefined });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Manage workshop locations, local hours, and appointment availability."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus className="size-4" />
            Add branch
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4 max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="pl-9"
              placeholder="Search name, city, phone, or email"
              aria-label="Search branches"
            />
          </div>
          <BranchTable
            data={query.data}
            isLoading={query.isLoading}
            isError={query.isError}
            page={page}
            sortDirection={sortDirection}
            onPageChange={setPage}
            onRetry={() => void query.refetch()}
            onToggleSort={() =>
              setSortDirection((value) => (value === "asc" ? "desc" : "asc"))
            }
          />
        </CardContent>
      </Card>
      <BranchDialog open={adding} onOpenChange={setAdding} />
    </div>
  );
}
