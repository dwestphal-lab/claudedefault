"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList } from "lucide-react";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">
            Audit Log wird in Phase 3 implementiert.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
