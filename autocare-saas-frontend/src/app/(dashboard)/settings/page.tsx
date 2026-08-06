import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SettingsWorkspace } from "@/features/settings/settings-workspace";

export default function SettingsPage(): React.JSX.Element {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold">Workspace settings</h3>
        </CardHeader>
        <CardContent>
          <SettingsWorkspace />
        </CardContent>
      </Card>
    </div>
  );
}
