import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

function buildSystemPrompt(config: {
  brand: string;
  tone: string;
  output_format: string;
  audience_full: string;
  audience_junior: string;
}): string {
  return `You are a story writer for "${config.brand}".

Tone: ${config.tone}
Output format: ${config.output_format}

You will receive 1-3 trading card images and a story bible with existing characters, plot, and themes. Analyze the card art — the Pokémon, scene, mood, and any text visible — then write the next episode continuing the ongoing story.

## Story Arc

The story bible includes a "story_arc" section with the planned arc for this season. Follow it:
- Check which "act" the story is in (setup, rising_action, climax, resolution)
- Check "remaining_episodes" for the outline of the episode you are writing
- Write toward the planned climax and resolution
- If the act is "resolution" or this is the final episode, write a satisfying ending (not a cliffhanger) but leave any "season2_hooks" subtly open
- The card image determines WHO appears, but the arc determines WHERE the story goes

## Story Format

Write TWO versions of the same episode:

### Full Fables (${config.audience_full})
- Scene directions in brackets: [Scene opens on...]
- Inner monologue and emotional depth
- Character dialogue with speaker attribution
- Cliffhanger ending: "To be continued..."
- 600–900 words

### Junior Fables (${config.audience_junior})
- Same plot, same characters, same cliffhanger
- Short punchy sentences
- Sound effects: CRUNCH. SNAP.
- More action, less inner monologue
- 300–500 words

## Output Format

Return ONLY valid JSON with this exact structure (no markdown, no code fences):

{
  "episode": {
    "id": <next episode number>,
    "slug": "<title-lowercased-and-hyphenated>",
    "title": "<episode title>",
    "cards": [
      {
        "name": "<card name and set info visible on the card>",
        "set": "<set name if visible>",
        "artist": "<artist name if visible>",
        "emoji": "<one emoji that fits the card>"
      }
    ],
    "status": "live",
    "junior": {
      "scene": "<one-line scene description>",
      "paragraphs": [
        { "t": "p", "c": "<narrative paragraph>" },
        { "t": "q", "speaker": "<Character Name>", "c": "<dialogue in quotes>" },
        { "t": "a", "c": "<action or scene direction>" },
        { "t": "end", "c": "To be continued..." }
      ]
    },
    "full": {
      "scene": "<one-line scene description>",
      "paragraphs": [
        { "t": "p", "c": "<narrative paragraph>" },
        { "t": "q", "speaker": "<Character Name>", "c": "<dialogue in quotes>" },
        { "t": "a", "c": "<action or scene direction>" },
        { "t": "end", "c": "To be continued..." }
      ]
    }
  },
  "bible_updates": {
    "new_characters": [
      { "name": "<name>", "card": "<card name>", "role": "<role description>" }
    ],
    "current_plot": "<updated plot state including cliffhanger>",
    "new_themes": ["<any new running themes>"],
    "last_episode": <episode number>
  }
}

Story block types:
- "p" = narrative paragraph
- "q" = dialogue (MUST include "speaker" field)
- "a" = action/scene direction
- "end" = cliffhanger ending (always "To be continued...")

Each story MUST end with a block of type "end".`;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  // Auth check
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Read uploaded images from FormData
    const formData = await request.formData();
    const imageFiles = formData.getAll("images") as File[];
    const seriesId = (formData.get("seriesId") as string | null) ?? "flames-of-our-lives";

    if (imageFiles.length < 1 || imageFiles.length > 3) {
      return NextResponse.json(
        { error: "Upload 1-3 images" },
        { status: 400 }
      );
    }

    // Read config and story bible from GitHub
    const { content: configRaw } = await readFile("clients/pokemon-fables/config.example.json");
    const config = JSON.parse(configRaw);

    const { content: bibleRaw } = await readFile(`clients/pokemon-fables/series/${seriesId}/story-bible.json`);
    const bible = JSON.parse(bibleRaw);

    // Encode images as base64
    const imageBlocks = await Promise.all(
      imageFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const mediaTypes: Record<string, string> = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          gif: "image/gif",
          webp: "image/webp",
        };
        return {
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: (mediaTypes[ext] || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: buffer.toString("base64"),
          },
        };
      })
    );

    // Build prompt and call Claude
    const systemPrompt = buildSystemPrompt(config);
    const nextEpisode = bible.last_episode + 1;

    const userContent = [
      ...imageBlocks,
      {
        type: "text" as const,
        text: `Here is the current story bible:\n\n${JSON.stringify(bible, null, 2)}\n\nAnalyze the card image(s) above and write episode ${nextEpisode}. Continue the ongoing story based on the bible context. The new card(s) should introduce or develop characters and advance the plot.`,
      },
    ];

    const apiKey = process.env.ANTHROPIC_API_KEY || config.anthropic_api_key;
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });

    // Parse response
    let responseText = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    if (responseText.startsWith("```")) {
      responseText = responseText
        .replace(/^```(?:json)?\s*\n?/, "")
        .replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(responseText);

    if (!parsed.episode || !parsed.bible_updates) {
      return NextResponse.json(
        { error: "Invalid response from Claude", raw: responseText },
        { status: 500 }
      );
    }

    if (!parsed.episode.slug) {
      parsed.episode.slug = slugify(parsed.episode.title);
    }

    return NextResponse.json({
      episode: parsed.episode,
      bible_updates: parsed.bible_updates,
      nextEpisode,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
