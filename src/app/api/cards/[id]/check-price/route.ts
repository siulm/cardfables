import { NextRequest, NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";
import { fetchSuggestedPrice } from "@/lib/cardPricing";
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

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
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

    const card = cards[idx];
    const today = new Date().toISOString().slice(0, 10);

    const suggestion = await fetchSuggestedPrice({
      name: card.name,
      setNumber: card.setNumber,
      rarity: card.rarity,
    });

    const suggestedPrice = suggestion?.suggestedPrice ?? null;

    // Always record the check date; update suggestedPrice if we got one
    const updatedCard: CardCollectionEntry = {
      ...card,
      priceCheckedAt: today,
      ...(suggestedPrice !== null ? { suggestedPrice } : {}),
    };

    // Apply asking-price rule: only set price when the card has no existing asking price
    const hasNoPrice = !card.price || card.price <= 0;
    if (hasNoPrice && suggestedPrice !== null) {
      updatedCard.price = Math.round(suggestedPrice * 0.9 * 100) / 100;
    }

    cards[idx] = updatedCard;

    await commitFiles(
      [{ path: COLLECTION_PATH, content: JSON.stringify(cards, null, 2) }],
      `admin: check price for ${card.name}`
    );

    return NextResponse.json({
      id,
      suggestedPrice,
      price: updatedCard.price,
      priceCheckedAt: today,
      matched: suggestedPrice !== null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
