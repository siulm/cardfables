import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { commitFiles, deleteFile, listDir, readFile } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

async function screenImage(base64Data: string, mediaType: string): Promise<boolean> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 10,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: "Does this image contain sexual content, nudity, child abuse/exploitation, extreme violence, or other harmful content? Reply with only YES or NO.",
          },
        ],
      },
    ],
  });

  const answer = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim()
    .toUpperCase();

  return answer === "NO";
}

const submitAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_SUBMISSIONS = 5;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const record = submitAttempts.get(ip);

  if (record && now < record.resetAt && record.count >= MAX_SUBMISSIONS) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  const entry = record && now < record.resetAt
    ? { count: record.count + 1, resetAt: record.resetAt }
    : { count: 1, resetAt: now + SUBMIT_WINDOW_MS };
  submitAttempts.set(ip, entry);

  try {
    const formData = await request.formData();

    const cardName = formData.get("cardName") as string | null;
    const photo = formData.get("photo") as File | null;
    const name = (formData.get("name") as string) || "";
    const series = (formData.get("series") as string) || "";
    const reason = (formData.get("reason") as string) || "";

    if (!cardName || !cardName.trim()) {
      return NextResponse.json({ error: "Card name is required" }, { status: 400 });
    }

    if (!photo || photo.size === 0) {
      return NextResponse.json({ error: "Card photo is required" }, { status: 400 });
    }

    // Read photo as base64
    const buffer = Buffer.from(await photo.arrayBuffer());
    const base64Data = buffer.toString("base64");
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg";
    const mediaTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mediaType = mediaTypes[ext] || "image/jpeg";

    // Safety screening
    let isSafe: boolean;
    try {
      isSafe = await screenImage(base64Data, mediaType);
    } catch {
      // Fail closed — reject if safety check can't run
      return NextResponse.json(
        { error: "Submission could not be processed" },
        { status: 500 }
      );
    }

    if (!isSafe) {
      return NextResponse.json(
        { error: "Submission could not be processed" },
        { status: 400 }
      );
    }

    // Build submission JSON
    const timestamp = new Date().toISOString();
    const submission = {
      name,
      cardName,
      series,
      reason,
      photo: `data:${mediaType};base64,${base64Data}`,
      timestamp,
    };

    // Save to GitHub
    const filename = timestamp.replace(/:/g, "-").replace(/\./g, "-");
    await commitFiles(
      [
        {
          path: `clients/pokemon-fables/submissions/${filename}.json`,
          content: JSON.stringify(submission, null, 2),
        },
      ],
      `feat: new card submission — ${cardName}`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Auth check — admin only
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const files = await listDir("clients/pokemon-fables/submissions");
    const jsonFiles = files.filter((f) => f.name.endsWith(".json"));

    const submissions = await Promise.all(
      jsonFiles.map(async (f) => {
        try {
          const { content } = await readFile(f.path);
          return JSON.parse(content);
        } catch {
          return null;
        }
      })
    );

    // Filter nulls and sort by timestamp descending (LIFO)
    const sorted = submissions
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ submissions: sorted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { timestamp } = await request.json();
    if (!timestamp) {
      return NextResponse.json({ error: "Missing timestamp" }, { status: 400 });
    }

    const filename = timestamp.replace(/:/g, "-").replace(/\./g, "-");
    await deleteFile(
      `clients/pokemon-fables/submissions/${filename}.json`,
      `chore: remove card submission`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
