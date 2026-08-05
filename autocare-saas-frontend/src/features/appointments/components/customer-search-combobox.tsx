"use client";

import { ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomerSearch } from "../reference-hooks";
import type { Customer } from "@/types";

const SEARCH_DELAY_MS = 300;

export function CustomerSearchCombobox({
  value,
  selectedCustomer,
  disabled,
  invalid,
  onChange,
  onCreate,
}: {
  value: string;
  selectedCustomer?: Customer;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (customer: Customer) => void;
  onCreate: (search: string) => void;
}): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const query = useCustomerSearch(debouncedSearch, open && !disabled);
  const customers = query.data?.data ?? [];
  const optionCount = customers.length + 1;

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DELAY_MS,
    );
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function show(): void {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(0);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function select(customer: Customer): void {
    onChange(customer);
    setSearch("");
    setOpen(false);
  }

  function create(): void {
    setOpen(false);
    onCreate(search.trim());
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, optionCount - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const customer = customers[activeIndex];
      if (customer) select(customer);
      else if (activeIndex === customers.length) create();
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {open ? (
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-slate-400" />
          <Input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={`${listboxId}-${activeIndex}`}
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search by name, phone, or email"
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between px-3 font-normal"
          disabled={disabled}
          aria-label="Customer"
          aria-invalid={invalid}
          aria-haspopup="listbox"
          onClick={show}
        >
          <span className="truncate">
            {selectedCustomer
              ? `${selectedCustomer.firstName} ${selectedCustomer.lastName} · ${selectedCustomer.phone}`
              : value
                ? "Selected customer"
                : "Search customers"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-slate-400" />
        </Button>
      )}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-lg dark:bg-slate-900"
        >
          {query.isLoading && (
            <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" /> Loading customers…
            </div>
          )}
          {query.isError && (
            <div role="alert" className="px-3 py-3 text-sm text-red-600">
              Could not load customers. Try again.
            </div>
          )}
          {!query.isLoading && !query.isError && customers.length === 0 && (
            <div className="px-3 py-3 text-sm text-slate-500">
              No customers found
            </div>
          )}
          {!query.isError &&
            customers.map((customer, index) => (
              <button
                id={`${listboxId}-${index}`}
                key={customer.id}
                type="button"
                role="option"
                aria-selected={customer.id === value}
                className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                  activeIndex === index
                    ? "bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(customer)}
              >
                <span className="block font-medium">
                  {customer.firstName} {customer.lastName}
                </span>
                <span className="block text-xs text-slate-500">
                  {[customer.phone, customer.email].filter(Boolean).join(" · ")}
                </span>
              </button>
            ))}
          <button
            id={`${listboxId}-${customers.length}`}
            type="button"
            role="option"
            aria-selected={false}
            className={`mt-1 flex w-full items-center gap-2 rounded-md border-t px-3 py-2 text-left text-sm font-medium text-blue-700 dark:text-blue-300 ${
              activeIndex === customers.length
                ? "bg-blue-50 dark:bg-blue-950/50"
                : "hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
            onMouseEnter={() => setActiveIndex(customers.length)}
            onClick={create}
          >
            <Plus className="size-4" /> Create new customer
          </button>
        </div>
      )}
    </div>
  );
}
