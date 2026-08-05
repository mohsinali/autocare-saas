import { Clock3 } from "lucide-react";
import { branchTimeValue } from "./branch-utils";

export function BranchBusinessHours({
  openingTime,
  closingTime,
  timezone,
  compact = false,
}: {
  openingTime: string;
  closingTime: string;
  timezone: string;
  compact?: boolean;
}): React.JSX.Element {
  return (
    <div className={compact ? "text-sm" : "rounded-lg border p-4"}>
      <div className="flex items-center gap-2 font-medium">
        <Clock3 className="size-4 text-slate-400" />
        Daily hours
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {branchTimeValue(openingTime)}–{branchTimeValue(closingTime)} ·{" "}
        {timezone}
      </p>
      {!compact && (
        <p className="mt-2 text-xs text-slate-500">
          These local hours currently apply every day of the week.
        </p>
      )}
    </div>
  );
}
