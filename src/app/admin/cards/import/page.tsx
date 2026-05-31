"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../context";
import type { CSVImportResult } from "@/lib/types";

export default function ImportCardsPage() {
  const { authenticated } = useAdmin();
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<CSVImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  if (!authenticated) return null;

  const onFile = async (file: File) => {
    const text = await file.text();
    setCsv(text);
    setPreview(null);
  };

  const runPreview = async () => {
    if (!csv) {
      alert("Paste CSV or choose a file first");
      return;
    }
    const res = await fetch("/api/cards/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: false }),
    });
    const data = await res.json();
    setPreview(data.result ?? null);
  };

  const commitImport = async () => {
    if (!preview || preview.totalErrors > 0) return;
    setImporting(true);
    const res = await fetch("/api/cards/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, commit: true }),
    });
    setImporting(false);
    if (!res.ok) {
      const err = await res.text();
      alert(`Import failed: ${err}`);
      return;
    }
    router.push("/admin/cards");
  };

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="mb-4 font-heading text-2xl font-bold text-text-primary">
        Import Cards from CSV
      </h1>
      <p className="mb-4 text-sm text-text-secondary">
        Required columns: <code>name, price, condition</code>. Other columns optional. Existing cards (matched by <code>id</code>) are updated; new ones are created.
      </p>

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          className="mb-2 block text-sm"
        />
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder="…or paste CSV here"
          rows={10}
          className="w-full rounded-lg border border-border bg-bg p-3 font-mono text-xs"
        />
      </div>

      <button
        type="button"
        onClick={runPreview}
        className="rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium"
      >
        Preview import
      </button>

      {preview && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-2 font-bold text-text-primary">Preview</h2>
          <ul className="mb-3 space-y-1 text-sm">
            <li>{preview.totalCreate} new cards</li>
            <li>{preview.totalUpdate} updates</li>
            <li className={preview.totalErrors > 0 ? "text-red-600 font-bold" : ""}>
              {preview.totalErrors} errors
            </li>
            <li>{preview.totalWarnings} warnings</li>
          </ul>

          {preview.totalErrors > 0 && (
            <details className="mb-3 text-xs" open>
              <summary className="cursor-pointer font-bold text-red-600">Errors</summary>
              <ul className="ml-4 mt-1 list-disc">
                {preview.rows
                  .filter((r) => r.errors.length > 0)
                  .map((r) => (
                    <li key={r.rowNumber}>
                      Row {r.rowNumber}: {r.errors.join("; ")}
                    </li>
                  ))}
              </ul>
            </details>
          )}

          {preview.totalWarnings > 0 && (
            <details className="mb-3 text-xs">
              <summary className="cursor-pointer font-bold text-yellow-700">Warnings</summary>
              <ul className="ml-4 mt-1 list-disc">
                {preview.rows
                  .filter((r) => r.warnings.length > 0)
                  .map((r) => (
                    <li key={r.rowNumber}>
                      Row {r.rowNumber}: {r.warnings.join("; ")}
                    </li>
                  ))}
              </ul>
            </details>
          )}

          <button
            type="button"
            onClick={commitImport}
            disabled={preview.totalErrors > 0 || importing}
            className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            {importing
              ? "Importing…"
              : `Import ${preview.totalCreate} new + ${preview.totalUpdate} updates`}
          </button>
        </div>
      )}

      <hr className="my-8 border-border" />

      <h2 className="mb-2 font-bold text-text-primary">Export</h2>
      <p className="mb-3 text-sm text-text-secondary">
        Download the current collection as CSV (backup, bulk-edit in a spreadsheet, then re-import).
      </p>
      <a
        href="/api/cards/export"
        className="inline-block rounded-lg border border-border bg-surface px-4 py-1.5 text-sm font-medium"
      >
        Download CSV
      </a>
    </div>
  );
}
