"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Printer className="h-4 w-4" />
      Imprimir / PDF
    </button>
  );
}
