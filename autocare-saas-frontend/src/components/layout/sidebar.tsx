"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Car,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  LayoutDashboard,
  MapPin,
  LogOut,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Branches", href: "/branches", icon: MapPin },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Service History", href: "/service-history", icon: Wrench },
  { label: "Vehicles", href: "#", icon: Car, disabled: true },
  { label: "Appointments", href: "/appointments", icon: CalendarDays },
  { label: "Invoices", href: "#", icon: FileText, disabled: true },
  { label: "Reports", href: "#", icon: ChartNoAxesCombined, disabled: true },
];
export function Sidebar({
  onLogout,
  compact = false,
}: {
  onLogout: () => void;
  compact?: boolean;
}): React.JSX.Element {
  const pathname = usePathname();
  return (
    <aside
      aria-label={compact ? "Mobile workspace navigation" : undefined}
      className={cn(
        "flex shrink-0 bg-white dark:bg-slate-950",
        compact ? "w-full border-b p-2" : "h-full w-64 flex-col border-r p-4",
      )}
    >
      <Link
        href="/dashboard"
        className={cn(
          "mb-8 items-center gap-3 px-2 text-lg font-bold",
          compact ? "hidden" : "flex",
        )}
      >
        <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-white">
          <Gauge className="size-5" />
        </span>
        AutoCare
      </Link>
      <nav
        className={cn(
          compact ? "flex w-full gap-1 overflow-x-auto" : "space-y-1",
        )}
      >
        {items.map(({ label, href, icon: Icon, disabled }) => (
          <Link
            key={label}
            href={href}
            aria-disabled={disabled}
            onClick={(event) => {
              if (disabled) event.preventDefault();
            }}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors dark:text-slate-400",
              (pathname === href || pathname.startsWith(`${href}/`)) &&
                "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
              disabled
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-slate-100 dark:hover:bg-slate-900",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className={cn("mt-auto space-y-1", compact && "hidden")}>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900",
            pathname === "/settings" && "bg-blue-50 text-blue-700",
          )}
        >
          <Settings className="size-4" />
          Settings
        </Link>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 dark:text-slate-400"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
