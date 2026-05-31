import { NextResponse } from "next/server";
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

export interface RefreshPriceResult {
  id: string;
  name: string;
  price: number;
  previousSuggestion: number | null;
  newSuggestion: number | null;
}

export async function POST() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cards = await readCollection();

    const results: RefreshPriceResult[] = [];
    const updated: CardCollectionEntry[] = [];
    const today = new Date().toISOString().slice(0, 10);

    for (const card of cards) {
      const suggestion = await fetchSuggestedPrice({
        name: card.name,
        setNumber: card.setNumber,
        rarity: card.rarity,
      });

      const previousSuggestion = card.suggestedPrice ?? null;
      const newSuggestion = suggestion?.suggestedPrice ?? null;

      results.push({
        id: card.id,
        name: card.name,
        price: card.price,
        previousSuggestion,
        newSuggestion,
      });

      // Only update suggestedPrice + priceCheckedAt — never touch price
      const updatedCard: CardCollectionEntry = {
        ...card,
        suggestedPrice: newSuggestion ?? card.suggestedPrice,
        priceCheckedAt: today,
      };
      updated.push(updatedCard);
    }

    await commitFiles(
      [{ path: COLLECTION_PATH, content: JSON.stringify(updated, null, 2) }],
      `admin: refresh suggested prices for ${cards.length} cards`
    );

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
