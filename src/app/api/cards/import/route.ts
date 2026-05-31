import { NextRequest, NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";
import { parseCSV, validateCSVRows } from "@/lib/cardsCollection";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

async function readCollection(): Promise<CardCollectionEntry[]> {
  try {
    const { content } = await readFile(COLLECTION_PATH);
    return JSON.parse(content);
  } catch {
    return [];
  }
}

// POST { csv: string, commit?: boolean }
// When commit=false (default): validate only, return preview result
// When commit=true: validate then write if no errors
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { csv, commit } = (await req.json()) as { csv: string; commit?: boolean };
  if (!csv) {
    return NextResponse.json({ error: "csv body required" }, { status: 400 });
  }

  const existing = await readCollection();
  const rows = parseCSV(csv);
  const result = validateCSVRows(rows, existing);

  if (!commit) {
    return NextResponse.json({ result });
  }

  if (result.totalErrors > 0) {
    return NextResponse.json(
      { error: "Cannot commit with errors", result },
      { status: 400 }
    );
  }

  const byId = new Map(existing.map((c) => [c.id, c]));
  for (const row of result.rows) {
    if (row.entry) {
      byId.set(row.entry.id, row.entry);
    }
  }
  const next = [...byId.values()];
  await commitFiles(
    [{ path: COLLECTION_PATH, content: JSON.stringify(next, null, 2) }],
    `admin: import ${result.totalCreate} new + ${result.totalUpdate} updated cards`
  );
  return NextResponse.json({ ok: true, result });
}
