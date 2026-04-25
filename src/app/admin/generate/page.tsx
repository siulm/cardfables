"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useAdmin } from "../context";

type GenerateState = "ready" | "generating" | "preview" | "publishing";

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

export default function GeneratePage() {
  const { selectedSeries, setError, setSuccess, preloadedFiles, setPreloadedFiles } = useAdmin();
  const router = useRouter();

  const [files, setFiles] = useState<File[]>([]);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [bibleUpdates, setBibleUpdates] = useState<BibleUpdates | null>(null);
  const [state, setState] = useState<GenerateState>("ready");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On mount: consume any preloaded files from submissions
  useEffect(() => {
    if (preloadedFiles.length > 0) {
      setFiles(preloadedFiles);
      setPreloadedFiles([]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function handleGenerate() {
    setError("");
    setState("generating");

    const formData = new FormData();
    files.forEach((f) => formData.append("images", f));
    formData.append("seriesId", selectedSeries);

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

  async function handlePublish() {
    if (!episode || !bibleUpdates) return;
    setError("");
    setState("publishing");

    try {
      const res = await fetch("/api/publish-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode, bible_updates: bibleUpdates, seriesId: selectedSeries }),
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

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-text-primary">Generate Episode</h1>

      {/* ── Ready ── */}
      {state === "ready" && (
        <div className="space-y-6">
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
      {state === "generating" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">
            Generating episode... this takes 15–30 seconds.
          </p>
        </div>
      )}

      {/* ── Preview ── */}
      {state === "preview" && episode && (
        <div className="space-y-8">
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
      {state === "publishing" && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">
            Publishing to GitHub...
          </p>
        </div>
      )}
    </div>
  );
}
