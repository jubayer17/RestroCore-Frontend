import React, { useMemo, useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ExportData = Record<string, unknown>;

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  const keys = Array.from(
    rows.reduce((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );

  const esc = (v: unknown) => {
    const str = v == null ? "" : String(v);
    const needsQuotes = /[",\n]/.test(str);
    const safe = str.replace(/"/g, '""');
    return needsQuotes ? `"${safe}"` : safe;
  };

  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

interface ExportAnalyticsMenuProps {
  filenamePrefix: string;
  json: ExportData;
  csvRows: Array<Record<string, unknown>>;
  className?: string;
}

export function ExportAnalyticsMenu({ filenamePrefix, json, csvRows, className }: ExportAnalyticsMenuProps) {
  const [busy, setBusy] = useState(false);
  const safePrefix = useMemo(() => filenamePrefix.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""), [filenamePrefix]);
  const timestamp = useMemo(() => new Date().toISOString().replace(/[:.]/g, "-"), []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-2 text-xs font-semibold hover:bg-muted/30 transition-colors",
            className,
          )}
          aria-label="Export analytics"
          disabled={busy}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[190px]">
        <DropdownMenuItem
          onSelect={async () => {
            setBusy(true);
            try {
              const content = JSON.stringify(json, null, 2);
              downloadBlob(`${safePrefix}-${timestamp}.json`, new Blob([content], { type: "application/json" }));
            } finally {
              setBusy(false);
            }
          }}
          className="flex items-center gap-2"
        >
          <FileJson className="h-4 w-4" />
          Export JSON
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            setBusy(true);
            try {
              const content = toCsv(csvRows);
              downloadBlob(`${safePrefix}-${timestamp}.csv`, new Blob([content], { type: "text/csv;charset=utf-8" }));
            } finally {
              setBusy(false);
            }
          }}
          className="flex items-center gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

