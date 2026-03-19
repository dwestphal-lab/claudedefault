"use client";

import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageToggle() {
  function switchLocale() {
    const current = document.cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1] || "de";

    const next = current === "de" ? "en" : "de";
    document.cookie = `locale=${next};path=/;max-age=31536000`;
    window.location.reload();
  }

  return (
    <Button variant="ghost" size="icon" onClick={switchLocale} title="Sprache wechseln">
      <Languages className="h-4 w-4" />
    </Button>
  );
}
