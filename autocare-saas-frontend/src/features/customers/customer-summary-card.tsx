import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Customer } from "@/types";
export function CustomerSummaryCard({
  customer,
}: {
  customer: Customer;
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-sm text-slate-500">Customer workspace</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {customer.firstName} {customer.lastName}
            </h2>
          </div>
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <Mail className="size-4" />
              {customer.email ?? "No email on file"}
            </span>
            <span className="flex items-center gap-2">
              <Phone className="size-4" />
              {customer.phone}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
