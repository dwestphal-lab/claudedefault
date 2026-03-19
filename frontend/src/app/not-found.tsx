import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>404 — Nicht gefunden</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Die angeforderte Seite existiert nicht.
          </p>
          <Button asChild className="w-full">
            <Link href="/">Zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
