import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

// GET — read current story bible (includes arc)
export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seriesId = new URL(request.url).searchParams.get("seriesId") ?? "flames-of-our-lives";
    const { content } = await readFile(`clients/pokemon-fables/series/${seriesId}/story-bible.json`);
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — update story arc in bible
export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { story_arc, seriesId: rawSeriesId } = await request.json();
    const seriesId = rawSeriesId ?? "flames-of-our-lives";
    if (!story_arc) {
      return NextResponse.json({ error: "Missing story_arc" }, { status: 400 });
    }

    const { content } = await readFile(`clients/pokemon-fables/series/${seriesId}/story-bible.json`);
    const bible = JSON.parse(content);
    bible.story_arc = story_arc;

    await commitFiles(
      [{ path: `clients/pokemon-fables/series/${seriesId}/story-bible.json`, content: JSON.stringify(bible, null, 2) }],
      `feat: update story arc — act: ${story_arc.act}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — ask Claude to propose an arc for a new series/season
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const seriesId = new URL(request.url).searchParams.get("seriesId") ?? "flames-of-our-lives";
    const { content } = await readFile(`clients/pokemon-fables/series/${seriesId}/story-bible.json`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a story architect. Here is the current story bible:

${content}

Based on what has happened, propose a story arc for the remaining episodes. Include:
1. What act the story is currently in (setup/rising_action/climax/resolution)
2. How many total episodes the series should run (8-12 ideal)
3. A brief arc summary (2 sentences)
4. What the climax should be (1-2 sentences)
5. What the resolution should be (1-2 sentences — satisfying but leave hooks for a potential next season)
6. Season 2 hooks (2-3 unresolved threads)
7. Brief outline of remaining episodes (1 line each)

Reply with ONLY valid JSON:
{
  "season": 1,
  "act": "...",
  "total_episodes": 10,
  "arc_summary": "...",
  "climax": "...",
  "resolution": "...",
  "season2_hooks": ["..."],
  "remaining_episodes": [{ "episode": 6, "outline": "..." }]
}`
      }]
    });

    let text = res.content.filter(b => b.type === "text").map(b => b.text).join("").trim();
    if (text.startsWith("```")) {
      text = text.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    return NextResponse.json({ proposed_arc: JSON.parse(text) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
