import { NextResponse } from "next/server";
import { readFile, commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await readFile("clients/pokemon-fables/shop.json");
    const shop = JSON.parse(content);
    return NextResponse.json(shop);
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
    const shop = await request.json();

    if (!shop.products || !Array.isArray(shop.products)) {
      return NextResponse.json({ error: "Invalid shop data" }, { status: 400 });
    }

    await commitFiles(
      [
        {
          path: "clients/pokemon-fables/shop.json",
          content: JSON.stringify(shop, null, 2),
        },
      ],
      "feat: update shop products"
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
