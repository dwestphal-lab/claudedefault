import { auth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getHealth(): Promise<{ status: string; db: string; version: string } | null> {
  try {
    const res = await fetch(
      `${process.env.BACKEND_URL || "http://localhost:4000"}/api/v1/health`,
      { cache: "no-store" }
    );
    return res.json();
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const health = await getHealth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Angemeldet als
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">
              {session?.user?.name || session?.user?.email || "Unbekannt"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${health?.status === "ok" ? "text-green-600" : "text-red-500"}`}>
              {health ? `${health.status} (v${health.version})` : "Nicht erreichbar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Datenbank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-lg font-semibold ${health?.db === "connected" ? "text-green-600" : "text-red-500"}`}>
              {health?.db || "Nicht erreichbar"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
