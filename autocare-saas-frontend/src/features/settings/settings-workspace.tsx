"use client";

import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { SettingsForm } from "./settings-form";
import { useTenantSettings } from "./settings-hooks";

export function SettingsWorkspace(): React.JSX.Element {
  const query = useTenantSettings();

  if (query.isLoading) return <LoadingState rows={2} />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Could not load workspace settings"
        onRetry={() => void query.refetch()}
      />
    );
  }

  return <SettingsForm settings={query.data} />;
}
