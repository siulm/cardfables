import { NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

interface BibleUpdates {
  new_characters: { name: string; card: string; role: string }[];
  current_plot: string;
  new_themes: string[];
  last_episode: number;
}

interface Bible {
  show_title: string;
  last_episode: number;
  characters: { name: string; card: string; role: string }[];
  current_plot: string;
  setting: string;
  running_themes: string[];
}

function mergeBibleUpdates(bible: Bible, updates: BibleUpdates): Bible {
  const merged = { ...bible };

  merged.last_episode = updates.last_episode;
  merged.current_plot = updates.current_plot;

  if (updates.new_characters && updates.new_characters.length > 0) {
    merged.characters = [...bible.characters, ...updates.new_characters];
  }

  if (updates.new_themes && updates.new_themes.length > 0) {
    const existingThemes = new Set(bible.running_themes);
    const deduped = updates.new_themes.filter(
      (theme) => !existingThemes.has(theme)
    );
    merged.running_themes = [...bible.running_themes, ...deduped];
  }

  return merged;
}

export async function POST(request: Request) {
  // Auth check
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { episode, bible_updates, seriesId: rawSeriesId } = await request.json();
    const seriesId = rawSeriesId ?? "flames-of-our-lives";

    if (!episode || !bible_updates) {
      return NextResponse.json(
        { error: "Missing episode or bible_updates" },
        { status: 400 }
      );
    }

    // Read current story bible from GitHub
    const { content: bibleRaw } = await readFile(
      `clients/pokemon-fables/series/${seriesId}/story-bible.json`
    );
    const bible: Bible = JSON.parse(bibleRaw);

    // Validate episode ID — must be exactly last_episode + 1
    const expectedId = bible.last_episode + 1;
    if (episode.id !== expectedId) {
      return NextResponse.json(
        { error: `Episode ID mismatch: expected ${expectedId}, got ${episode.id}` },
        { status: 400 }
      );
    }

    // Merge updates
    const updatedBible = mergeBibleUpdates(bible, bible_updates);

    // Commit both files in a single commit
    const episodeId = episode.id;
    await commitFiles(
      [
        {
          path: `clients/pokemon-fables/series/${seriesId}/episodes/episode-${episodeId}.json`,
          content: JSON.stringify(episode, null, 2),
        },
        {
          path: `clients/pokemon-fables/series/${seriesId}/story-bible.json`,
          content: JSON.stringify(updatedBible, null, 2),
        },
      ],
      `feat: publish episode ${episodeId} — "${episode.title}"`
    );

    return NextResponse.json({ ok: true, episodeId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
