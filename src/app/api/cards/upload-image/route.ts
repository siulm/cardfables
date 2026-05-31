import { NextRequest, NextResponse } from "next/server";
import { commitFiles } from "@/lib/github";
import { isAuthenticated } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    const id = form.get("id") as string | null;
    if (!file || !id) {
      return NextResponse.json({ error: "image and id required" }, { status: 400 });
    }
    const safeId = id.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `public/images/cards-collection/${safeId}.${ext}`;
    const arrayBuf = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuf).toString("base64");
    await commitFiles(
      [{ path, content: base64, encoding: "base64" }],
      `admin: upload card image ${safeId}`
    );
    return NextResponse.json({ ok: true, path: `/images/cards-collection/${safeId}.${ext}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
