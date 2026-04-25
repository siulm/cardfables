import { NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await readFile("clients/pokemon-fables/series.json");
    return NextResponse.json({ series: JSON.parse(content) });
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
    const { series } = await request.json();
    if (!series || !Array.isArray(series)) {
      return NextResponse.json({ error: "Invalid series data" }, { status: 400 });
    }

    await commitFiles(
      [
        {
          path: "clients/pokemon-fables/series.json",
          content: JSON.stringify(series, null, 2),
        },
      ],
      "feat: update series metadata"
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST — create a new series (creates directory + starter story bible)
export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newSeries = await request.json();
    if (!newSeries.id || !newSeries.title) {
      return NextResponse.json({ error: "Series needs an id and title" }, { status: 400 });
    }

    // Read existing series list
    const { content } = await readFile("clients/pokemon-fables/series.json");
    const seriesList = JSON.parse(content);

    // Check for duplicate
    if (seriesList.some((s: { id: string }) => s.id === newSeries.id)) {
      return NextResponse.json({ error: "Series ID already exists" }, { status: 400 });
    }

    // Add to series list
    seriesList.push({
      id: newSeries.id,
      title: newSeries.title,
      tagline: newSeries.tagline || "",
      genre: newSeries.genre || "",
      type: newSeries.type || "",
      color: newSeries.color || "#94A3B8",
      accent: newSeries.accent || "#CBD5E1",
      bg: newSeries.bg || `linear-gradient(135deg, ${newSeries.color || "#94A3B8"} 0%, ${newSeries.color || "#94A3B8"}88 50%, ${newSeries.color || "#94A3B8"}44 100%)`,
      desc: newSeries.desc || "",
      status: "Coming Soon",
    });

    // Create starter story bible
    const starterBible = {
      show_title: newSeries.title,
      last_episode: 0,
      characters: [],
      current_plot: "No episodes yet.",
      setting: newSeries.setting || "Unknown",
      running_themes: [],
      story_arc: null,
    };

    // Commit series.json + new story bible + .gitkeep for episodes dir
    await commitFiles(
      [
        {
          path: "clients/pokemon-fables/series.json",
          content: JSON.stringify(seriesList, null, 2),
        },
        {
          path: `clients/pokemon-fables/series/${newSeries.id}/story-bible.json`,
          content: JSON.stringify(starterBible, null, 2),
        },
        {
          path: `clients/pokemon-fables/series/${newSeries.id}/episodes/.gitkeep`,
          content: "",
        },
      ],
      `feat: create new series — ${newSeries.title}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
