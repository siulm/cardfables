import { NextRequest, NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";
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

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const cards = await readCollection();
    return NextResponse.json({ cards });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as CardCollectionEntry;
    if (!body.id || !body.name) {
      return NextResponse.json({ error: "id and name are required" }, { status: 400 });
    }
    const cards = await readCollection();
    if (cards.find((c) => c.id === body.id)) {
      return NextResponse.json({ error: "id already exists" }, { status: 409 });
    }
    cards.push(body);
    await commitFiles(
      [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
      `admin: add card ${body.name}`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
