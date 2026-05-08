import { NextResponse } from "next/server";
import { readFile, listDir, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

const CLIENT = "pokemon-fables";

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const seriesId = searchParams.get("seriesId");
  if (!seriesId) {
    return NextResponse.json({ error: "seriesId required" }, { status: 400 });
  }

  try {
    const files = await listDir(
      `clients/${CLIENT}/series/${seriesId}/episodes`
    );
    const episodes = [];

    for (const file of files) {
      if (!file.name.endsWith(".json")) continue;
      const { content } = await readFile(file.path);
      episodes.push(JSON.parse(content));
    }

    episodes.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
    return NextResponse.json({ episodes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { seriesId, episodeId, cardIndex, sold } = await request.json();

    if (!seriesId || episodeId == null || cardIndex == null || sold == null) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const path = `clients/${CLIENT}/series/${seriesId}/episodes/episode-${episodeId}.json`;
    const { content } = await readFile(path);
    const episode = JSON.parse(content);

    if (!episode.cards[cardIndex]) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    episode.cards[cardIndex].sold = sold;

    await commitFiles(
      [{ path, content: JSON.stringify(episode, null, 2) }],
      `feat: mark ${episode.cards[cardIndex].name} as ${sold ? "sold" : "available"} in episode ${episodeId}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
