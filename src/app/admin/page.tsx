"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type PageState = "locked" | "ready" | "generating" | "preview" | "publishing";

interface StoryBlock {
  t: "p" | "q" | "a" | "end";
  c: string;
  speaker?: string;
}

interface Episode {
  id: number;
  slug: string;
  title: string;
  cards: { name: string; set: string; artist: string; emoji: string }[];
  status: string;
  junior: { scene: string; paragraphs: StoryBlock[] };
  full: { scene: string; paragraphs: StoryBlock[] };
}

interface BibleUpdates {
  new_characters: { name: string; card: string; role: string }[];
  current_plot: string;
  new_themes: string[];
  last_episode: number;
}

interface Submission {
  name: string;
  cardName: string;
  series: string;
  reason: string;
  photo: string;
  timestamp: string;
}

export default function AdminPage() {
  const [state, setState] = useState<PageState>("locked");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [bibleUpdates, setBibleUpdates] = useState<BibleUpdates | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"generate" | "submissions">("generate");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // ── Auth ──────────────────────────────────────────────────

  async function handleLogin() {
    setError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setState("ready");
      setPassword("");
    } else {
      setError("Invalid password");
    }
  }

  // ── File handling ─────────────────────────────────────────

  function handleFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const accepted = Array.from(newFiles)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name))
      .slice(0, 3);
    setFiles(accepted);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  // ── Generate ──────────────────────────────────────────────

  async function handleGenerate() {
    setError("");
    setState("generating");

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));

    try {
      const res = await fetch("/api/generate-episode", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Generation failed");
        setState("ready");
        return;
      }

      setEpisode(data.episode);
      setBibleUpdates(data.bible_updates);
      setState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("ready");
    }
  }

  // ── Publish ───────────────────────────────────────────────

  async function handlePublish() {
    if (!episode || !bibleUpdates) return;
    setError("");
    setState("publishing");

    try {
      const res = await fetch("/api/publish-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode, bible_updates: bibleUpdates }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Publish failed");
        setState("preview");
        return;
      }

      setSuccess(`Episode ${data.episodeId} — "${episode.title}" published!`);
      setEpisode(null);
      setBibleUpdates(null);
      setFiles([]);
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setState("preview");
    }
  }

  // ── Edit helpers ──────────────────────────────────────────

  function updateParagraph(
    mode: "junior" | "full",
    index: number,
    field: "c" | "speaker",
    value: string
  ) {
    if (!episode) return;
    const updated = { ...episode };
    const paragraphs = [...updated[mode].paragraphs];
    paragraphs[index] = { ...paragraphs[index], [field]: value };
    updated[mode] = { ...updated[mode], paragraphs };
    setEpisode(updated);
  }

  async function loadSubmissions() {
    setLoadingSubmissions(true);
    setError("");
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load submissions");
        return;
      }
      setSubmissions(data.submissions);
    } catch {
      setError("Failed to load submissions");
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function dismissSubmission(submission: Submission) {
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timestamp: submission.timestamp }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to remove submission");
        return;
      }
      setSubmissions(submissions.filter((s) => s.timestamp !== submission.timestamp));
    } catch {
      setError("Failed to remove submission");
    }
  }

  function useForEpisode(submission: Submission) {
    // Convert base64 data URI back to a File
    const parts = submission.photo.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(parts[1]);
    const arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) arr[i] = bstr.charCodeAt(i);
    const ext = mime.split("/")[1] || "jpg";
    const file = new File([arr], `${submission.cardName}.${ext}`, { type: mime });

    setFiles([file]);
    setTab("generate");
    setState("ready");
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-3xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        CardFables Admin
      </h1>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
          <button
            onClick={() => setSuccess("")}
            className="ml-2 text-green-300 underline cursor-pointer"
          >
            dismiss
          </button>
        </div>
      )}

      {/* ── Tabs ── */}
      {state !== "locked" && (
        <div className="mt-6 mb-8 flex gap-1 rounded-xl border border-border p-1">
          <button
            onClick={() => setTab("generate")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "generate"
                ? "bg-[rgba(212,137,58,0.15)] text-[#D4893A]"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => {
              setTab("submissions");
              if (submissions.length === 0) loadSubmissions();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "submissions"
                ? "bg-[rgba(212,137,58,0.15)] text-[#D4893A]"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            Submissions
          </button>
        </div>
      )}

      {/* ── Locked ── */}
      {state === "locked" && (
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <p className="text-sm text-text-secondary">Enter password to continue.</p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">Password</label>
            <input
              type="password"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-dim outline-none transition-colors duration-200 focus:border-[rgba(212,137,58,0.3)]"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit">
            Enter
          </Button>
        </form>
      )}

      {/* ── Ready ── */}
      {tab === "generate" && state === "ready" && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-text-secondary">
            Upload 1–3 card images to generate the next episode.
          </p>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed text-sm text-text-dim transition-colors hover:border-[rgba(212,137,58,0.3)] hover:text-text-secondary"
            style={{ borderColor: "rgba(74,64,53,0.10)" }}
          >
            <span className="text-3xl">🃏</span>
            <span>Drop card images here or click to browse</span>
            <span className="text-xs text-text-dim">JPG, PNG, or WebP — up to 3 images</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          {/* Selected files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-text-secondary">
                Selected ({files.length}):
              </p>
              {files.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                >
                  <span>📎</span>
                  <span>{f.name}</span>
                  <span className="text-text-dim">
                    ({(f.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleGenerate}
            className={files.length === 0 ? "opacity-50 pointer-events-none" : ""}
          >
            Generate Episode →
          </Button>
        </div>
      )}

      {/* ── Generating ── */}
      {tab === "generate" && state === "generating" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">
            Generating episode... this takes 15–30 seconds.
          </p>
        </div>
      )}

      {/* ── Preview ── */}
      {tab === "generate" && state === "preview" && episode && (
        <div className="mt-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Preview — Episode {episode.id}
            </h2>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { setState("generating"); handleGenerate(); }}>
                Regenerate
              </Button>
              <Button onClick={handlePublish}>
                Publish →
              </Button>
            </div>
          </div>

          {/* Title & slug */}
          <div className="space-y-4">
            <Field
              label="Title"
              value={episode.title}
              onChange={(v) => setEpisode({ ...episode, title: v })}
            />
            <Field
              label="Slug"
              value={episode.slug}
              onChange={(v) => setEpisode({ ...episode, slug: v })}
            />
          </div>

          {/* Cards */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
              Cards
            </h3>
            {episode.cards.map((card, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-4 text-sm text-text-primary">
                <span className="mr-2">{card.emoji}</span>
                {card.name} — {card.set} — {card.artist}
              </div>
            ))}
          </div>

          {/* Junior story */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-green-400">
              🐣 Junior Fables
            </h3>
            <Field
              label="Scene"
              value={episode.junior.scene}
              onChange={(v) =>
                setEpisode({
                  ...episode,
                  junior: { ...episode.junior, scene: v },
                })
              }
            />
            <div className="mt-4 space-y-3">
              {episode.junior.paragraphs.map((block, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface px-2 py-0.5 text-xs text-text-dim font-mono">
                      {block.t}
                    </span>
                    {block.speaker && (
                      <input
                        className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text-secondary outline-none focus:border-[rgba(212,137,58,0.3)]"
                        value={block.speaker}
                        onChange={(e) =>
                          updateParagraph("junior", i, "speaker", e.target.value)
                        }
                      />
                    )}
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-[rgba(212,137,58,0.3)]"
                    value={block.c}
                    onChange={(e) =>
                      updateParagraph("junior", i, "c", e.target.value)
                    }
                    rows={block.t === "end" ? 1 : 2}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Full story */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-400">
              🔥 Full Fables
            </h3>
            <Field
              label="Scene"
              value={episode.full.scene}
              onChange={(v) =>
                setEpisode({
                  ...episode,
                  full: { ...episode.full, scene: v },
                })
              }
            />
            <div className="mt-4 space-y-3">
              {episode.full.paragraphs.map((block, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface px-2 py-0.5 text-xs text-text-dim font-mono">
                      {block.t}
                    </span>
                    {block.speaker && (
                      <input
                        className="rounded border border-border bg-surface px-2 py-0.5 text-xs text-text-secondary outline-none focus:border-[rgba(212,137,58,0.3)]"
                        value={block.speaker}
                        onChange={(e) =>
                          updateParagraph("full", i, "speaker", e.target.value)
                        }
                      />
                    )}
                  </div>
                  <textarea
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-[rgba(212,137,58,0.3)]"
                    value={block.c}
                    onChange={(e) =>
                      updateParagraph("full", i, "c", e.target.value)
                    }
                    rows={block.t === "end" ? 1 : 3}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Bottom publish bar */}
          <div className="flex justify-end gap-3 border-t border-border pt-6">
            <Button variant="ghost" onClick={() => { setState("generating"); handleGenerate(); }}>
              Regenerate
            </Button>
            <Button onClick={handlePublish}>
              Publish Episode {episode.id} →
            </Button>
          </div>
        </div>
      )}

      {/* ── Publishing ── */}
      {tab === "generate" && state === "publishing" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">
            Publishing to GitHub...
          </p>
        </div>
      )}
      {/* ── Submissions Tab ── */}
      {tab === "submissions" && state !== "locked" && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Card Submissions
            </h2>
            <Button variant="ghost" onClick={loadSubmissions}>
              Refresh
            </Button>
          </div>

          {loadingSubmissions && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
              <p className="text-sm text-text-secondary">Loading submissions...</p>
            </div>
          )}

          {!loadingSubmissions && submissions.length === 0 && (
            <p className="py-16 text-center text-sm text-text-dim">No submissions yet.</p>
          )}

          {!loadingSubmissions && submissions.length > 0 && (
            <div className="space-y-4">
              {submissions.map((sub, i) => (
                <div
                  key={i}
                  className="flex gap-4 rounded-xl border border-border bg-surface p-4"
                >
                  {/* Photo thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={sub.photo}
                      alt={sub.cardName}
                      className="h-[150px] w-[110px] rounded-lg object-cover border border-border"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text-primary">{sub.cardName}</h3>
                    {sub.name && (
                      <p className="text-sm text-text-secondary">by {sub.name}</p>
                    )}
                    {sub.series && (
                      <p className="mt-1 text-xs text-text-dim">Series: {sub.series}</p>
                    )}
                    {sub.reason && (
                      <p className="mt-2 text-sm text-text-secondary italic">&ldquo;{sub.reason}&rdquo;</p>
                    )}
                    <p className="mt-2 text-xs text-text-dim">
                      {new Date(sub.timestamp).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => useForEpisode(sub)}
                        className="text-xs px-3 py-1.5"
                      >
                        Use for Episode →
                      </Button>
                      <button
                        onClick={() => dismissSubmission(sub)}
                        className="rounded-lg px-3 py-1.5 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
