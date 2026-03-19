"use client";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Fehler</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ein unerwarteter Fehler ist aufgetreten.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-muted-foreground">
              Referenz: {error.digest}
            </p>
          )}
          <Button onClick={reset} className="w-full">
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
