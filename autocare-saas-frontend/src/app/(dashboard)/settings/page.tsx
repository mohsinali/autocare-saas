import { Card, CardContent, CardHeader } from "@/components/ui/card";
export default function SettingsPage(): React.JSX.Element {
  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold">Settings</h2>
      <Card className="mt-6">
        <CardHeader>
          <h3 className="font-semibold">Workspace settings</h3>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Workspace administration will be available as tenant settings and
            RBAC are added to the API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
