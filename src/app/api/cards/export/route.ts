import { NextResponse } from "next/server";
import { readFile } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";
import type { CardCollectionEntry } from "@/lib/types";

const COLLECTION_PATH = "clients/pokemon-fables/cards-collection.json";

const COLUMNS: (keyof CardCollectionEntry)[] = [
  "id", "name", "set", "setNumber", "year", "type", "rarity",
  "artist", "image", "description", "price", "originalPrice",
  "condition", "stock", "status", "addedAt",
  "suggestedPrice", "priceCheckedAt",
];

function escapeCSV(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let cards: CardCollectionEntry[] = [];
  try {
    const { content } = await readFile(COLLECTION_PATH);
    cards = JSON.parse(content);
  } catch {
    cards = [];
  }

  const header = COLUMNS.join(",");
  const rows = cards.map((c) =>
    COLUMNS.map((col) => escapeCSV(c[col])).join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cards-collection-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
