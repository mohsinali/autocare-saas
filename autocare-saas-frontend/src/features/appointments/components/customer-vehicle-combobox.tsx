"use client";

import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Vehicle } from "@/types";

function vehicleLabel(vehicle: Vehicle): string {
  const description = [vehicle.year, vehicle.make, vehicle.model]
    .filter(Boolean)
    .join(" ");
  return `${description || vehicle.vehicleCode}${
    vehicle.registrationNumber ? ` · ${vehicle.registrationNumber}` : ""
  }`;
}

export const CustomerVehicleCombobox = forwardRef<
  HTMLButtonElement,
  {
    customerId: string;
    value: string;
    vehicles: Vehicle[];
    loading: boolean;
    error: boolean;
    invalid?: boolean;
    onChange: (vehicle: Vehicle) => void;
    onCreate: () => void;
  }
>(function CustomerVehicleCombobox(
  { customerId, value, vehicles, loading, error, invalid, onChange, onCreate },
  forwardedRef,
) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const selected = vehicles.find((vehicle) => vehicle.id === value);

  useEffect(() => {
    setOpen(false);
    setActiveIndex(0);
  }, [customerId]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>): void {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, vehicles.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const vehicle = vehicles[activeIndex];
      if (vehicle) {
        onChange(vehicle);
        setOpen(false);
      } else if (activeIndex === vehicles.length) {
        setOpen(false);
        onCreate();
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <Button
        ref={forwardedRef}
        type="button"
        variant="outline"
        className="w-full justify-between px-3 font-normal"
        disabled={!customerId}
        aria-label="Vehicle"
        aria-invalid={invalid}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={onKeyDown}
      >
        <span className="truncate">
          {!customerId
            ? "Select a customer first"
            : selected
              ? vehicleLabel(selected)
              : loading
                ? "Loading vehicles…"
                : "Select vehicle"}
        </span>
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : (
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        )}
      </Button>
      {open && customerId && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-lg dark:bg-slate-900"
        >
          {loading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Loading vehicles…
            </div>
          )}
          {error && (
            <div role="alert" className="px-3 py-3 text-sm text-red-600">
              Could not load vehicles. Try again.
            </div>
          )}
          {!loading && !error && vehicles.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-500">
              No vehicles found for this customer
            </div>
          )}
          {!error &&
            vehicles.map((vehicle, index) => (
              <button
                id={`${listboxId}-${index}`}
                key={vehicle.id}
                type="button"
                role="option"
                aria-selected={vehicle.id === value}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                  activeIndex === index
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(vehicle);
                  setOpen(false);
                }}
              >
                <span>{vehicleLabel(vehicle)}</span>
                {vehicle.id === value && <Check className="size-4" />}
              </button>
            ))}
          {!error && !loading && (
            <button
              id={`${listboxId}-${vehicles.length}`}
              type="button"
              role="option"
              aria-selected={false}
              className={`mt-1 flex w-full items-center gap-2 rounded-md border-t px-3 py-2 text-left text-sm font-medium text-blue-700 dark:text-blue-300 ${
                activeIndex === vehicles.length
                  ? "bg-blue-50 dark:bg-blue-950/50"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onMouseEnter={() => setActiveIndex(vehicles.length)}
              onClick={() => {
                setOpen(false);
                onCreate();
              }}
            >
              <Plus className="size-4" /> Add vehicle
            </button>
          )}
        </div>
      )}
    </div>
  );
});
