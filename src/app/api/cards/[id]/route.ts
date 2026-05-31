import { NextRequest, NextResponse } from "next/server";
import { readFile, commitFiles, deleteFile } from "@/lib/github";
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

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await ctx.params;
    const updates = (await req.json()) as Partial<CardCollectionEntry>;
    const cards = await readCollection();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    cards[idx] = { ...cards[idx], ...updates, id };
    await commitFiles(
      [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
      `admin: update card ${cards[idx].name}`
    );
    return NextResponse.json({ ok: true, card: cards[idx] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await ctx.params;
    const cards = await readCollection();
    const idx = cards.findIndex((c) => c.id === id);
    if (idx < 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const removed = cards.splice(idx, 1)[0];
    await commitFiles(
      [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
      `admin: delete card ${removed.name}`
    );
    // Best-effort image cleanup; tolerate missing images
    if (removed.image && removed.image.startsWith("/images/cards-collection/")) {
      try {
        await deleteFile(`public${removed.image}`, `admin: delete card image ${removed.id}`);
      } catch {
        // ignore — image may not exist or have been managed manually
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
