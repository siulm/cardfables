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

interface ShopProduct {
  id: number;
  icon: string;
  name: string;
  desc: string;
  price: string;
  cat: string;
  url?: string;
}

interface StoryArc {
  season: number;
  act: "setup" | "rising_action" | "climax" | "resolution";
  total_episodes: number;
  arc_summary: string;
  climax: string;
  resolution: string;
  season2_hooks: string[];
  remaining_episodes: { episode: number; outline: string }[];
}

const ACTS: StoryArc["act"][] = ["setup", "rising_action", "climax", "resolution"];
const ACT_LABELS: Record<string, string> = {
  setup: "Setup",
  rising_action: "Rising Action",
  climax: "Climax",
  resolution: "Resolution",
};

const SHOP_ICONS = ["🔥", "📦", "🛡️", "📒", "🎴", "🔍", "⚡", "💎", "🎯", "🃏", "🏆", "⭐", "🎁", "🧩"];

const ALL_SERIES = [
  { id: "flames-of-our-lives", title: "Flames of Our Lives" },
  { id: "oceans-deep", title: "Ocean's Deep" },
  { id: "grass-is-greener", title: "Grass Is Greener" },
  { id: "thunderstruck", title: "Thunderstruck" },
  { id: "shadow-protocol", title: "Shadow Protocol" },
  { id: "iron-will", title: "Iron Will" },
];

export default function AdminPage() {
  const [state, setState] = useState<PageState>("locked");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("flames-of-our-lives");
  const [files, setFiles] = useState<File[]>([]);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [bibleUpdates, setBibleUpdates] = useState<BibleUpdates | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"generate" | "submissions" | "shop" | "arc">("generate");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [loadingShop, setLoadingShop] = useState(false);
  const [savingShop, setSavingShop] = useState(false);
  const [storyArc, setStoryArc] = useState<StoryArc | null>(null);
  const [lastEpisode, setLastEpisode] = useState(0);
  const [loadingArc, setLoadingArc] = useState(false);
  const [savingArc, setSavingArc] = useState(false);
  const [proposingArc, setProposingArc] = useState(false);

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

  // ── Publish ───────────────────────────────────────────────

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

  // ── Shop ──────────────────────────────────────────────────

  async function loadShop() {
    setLoadingShop(true);
    setError("");
    try {
      const res = await fetch("/api/shop");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load shop");
        return;
      }
      setShopProducts(data.products);
      setShopCategories(data.categories);
    } catch {
      setError("Failed to load shop");
    } finally {
      setLoadingShop(false);
    }
  }

  async function saveShop() {
    setSavingShop(true);
    setError("");
    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: shopProducts, categories: shopCategories, browseTypes: ["All", "Fire", "Water", "Grass", "Electric", "Dark", "Steel"] }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save shop");
        return;
      }
      setSuccess("Shop products saved!");
    } catch {
      setError("Failed to save shop");
    } finally {
      setSavingShop(false);
    }
  }

  function updateProduct(index: number, field: keyof ShopProduct, value: string | number) {
    const updated = [...shopProducts];
    updated[index] = { ...updated[index], [field]: value };
    setShopProducts(updated);
  }

  function addProduct() {
    const newId = shopProducts.length > 0 ? Math.max(...shopProducts.map(p => p.id)) + 1 : 1;
    setShopProducts([...shopProducts, {
      id: newId,
      icon: "🎴",
      name: "New Product",
      desc: "Product description",
      price: "~$0",
      cat: shopCategories[1] || "Featured",
      url: "#",
    }]);
  }

  function removeProduct(index: number) {
    setShopProducts(shopProducts.filter((_, i) => i !== index));
  }

  // ── Story Arc ─────────────────────────────────────────────

  async function loadArc() {
    setLoadingArc(true);
    setError("");
    try {
      const res = await fetch(`/api/story-arc?seriesId=${selectedSeries}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load arc"); return; }
      setStoryArc(data.story_arc || null);
      setLastEpisode(data.last_episode || 0);
    } catch { setError("Failed to load arc"); }
    finally { setLoadingArc(false); }
  }

  async function saveArc() {
    if (!storyArc) return;
    setSavingArc(true);
    setError("");
    try {
      const res = await fetch("/api/story-arc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story_arc: storyArc, seriesId: selectedSeries }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to save"); return; }
      setSuccess("Story arc saved!");
    } catch { setError("Failed to save arc"); }
    finally { setSavingArc(false); }
  }

  async function proposeArc() {
    setProposingArc(true);
    setError("");
    try {
      const res = await fetch(`/api/story-arc?seriesId=${selectedSeries}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to propose arc"); return; }
      setStoryArc(data.proposed_arc);
    } catch { setError("Failed to propose arc"); }
    finally { setProposingArc(false); }
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
          <button
            onClick={() => {
              setTab("shop");
              if (shopProducts.length === 0) loadShop();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "shop"
                ? "bg-[rgba(212,137,58,0.15)] text-[#D4893A]"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => {
              setTab("arc");
              if (!storyArc) loadArc();
            }}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              tab === "arc"
                ? "bg-[rgba(212,137,58,0.15)] text-[#D4893A]"
                : "text-text-dim hover:text-text-secondary"
            }`}
          >
            Story Arc
          </button>
        </div>
      )}

      {/* ── Series Selector ── */}
      {state !== "locked" && (tab === "generate" || tab === "arc") && (
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-text-secondary">Series:</label>
          <select
            value={selectedSeries}
            onChange={(e) => {
              setSelectedSeries(e.target.value);
              setStoryArc(null);
              setLastEpisode(0);
            }}
            className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
          >
            {ALL_SERIES.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
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

      {/* ── Shop Tab ── */}
      {tab === "shop" && state !== "locked" && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Shop Products
            </h2>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={addProduct}>
                + Add Product
              </Button>
              <Button
                onClick={saveShop}
                className={savingShop ? "opacity-50 pointer-events-none" : ""}
              >
                {savingShop ? "Saving..." : "Save to GitHub"}
              </Button>
            </div>
          </div>

          {loadingShop && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
              <p className="text-sm text-text-secondary">Loading shop products...</p>
            </div>
          )}

          {!loadingShop && shopProducts.length === 0 && (
            <p className="py-16 text-center text-sm text-text-dim">No products yet.</p>
          )}

          {!loadingShop && shopProducts.length > 0 && (
            <div className="space-y-4">
              {shopProducts.map((product, i) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-border bg-surface p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.icon}</span>
                      <span className="text-sm font-bold text-text-primary">#{product.id}</span>
                      <span className="rounded bg-surface-light px-2 py-0.5 text-xs text-text-dim">{product.cat}</span>
                    </div>
                    <button
                      onClick={() => removeProduct(i)}
                      className="rounded-lg px-3 py-1.5 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Icon picker */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-text-secondary">Icon</label>
                    <div className="flex flex-wrap gap-1.5">
                      {SHOP_ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => updateProduct(i, "icon", icon)}
                          className={`h-9 w-9 rounded-lg text-lg transition-colors cursor-pointer ${
                            product.icon === icon
                              ? "bg-[rgba(212,137,58,0.15)] border border-[rgba(212,137,58,0.3)]"
                              : "bg-surface-light border border-border hover:border-[rgba(74,64,53,0.20)]"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Name"
                      value={product.name}
                      onChange={(v) => updateProduct(i, "name", v)}
                    />
                    <Field
                      label="Price"
                      value={product.price}
                      onChange={(v) => updateProduct(i, "price", v)}
                    />
                  </div>

                  <Field
                    label="Description"
                    value={product.desc}
                    onChange={(v) => updateProduct(i, "desc", v)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-medium text-text-secondary">Category</label>
                      <select
                        value={product.cat}
                        onChange={(e) => updateProduct(i, "cat", e.target.value)}
                        className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none transition-colors duration-200 focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
                      >
                        {shopCategories.filter(c => c !== "All").map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <Field
                      label="Amazon URL"
                      value={product.url || "#"}
                      onChange={(v) => updateProduct(i, "url", v)}
                      placeholder="https://amazon.com/..."
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Story Arc Tab ── */}
      {tab === "arc" && state !== "locked" && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-text-primary">
              Story Arc — Season {storyArc?.season || 1}
            </h2>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={proposeArc}
                className={proposingArc ? "opacity-50 pointer-events-none" : ""}
              >
                {proposingArc ? "Thinking..." : "Ask Claude to Propose"}
              </Button>
              <Button
                onClick={saveArc}
                className={savingArc || !storyArc ? "opacity-50 pointer-events-none" : ""}
              >
                {savingArc ? "Saving..." : "Save to GitHub"}
              </Button>
            </div>
          </div>

          {loadingArc && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
              <p className="text-sm text-text-secondary">Loading story arc...</p>
            </div>
          )}

          {proposingArc && (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
              <p className="text-sm text-text-secondary">Claude is planning the story arc...</p>
            </div>
          )}

          {!loadingArc && !proposingArc && !storyArc && (
            <div className="py-16 text-center">
              <p className="text-sm text-text-dim mb-4">No story arc defined yet.</p>
              <Button onClick={proposeArc}>Let Claude Propose an Arc</Button>
            </div>
          )}

          {!loadingArc && !proposingArc && storyArc && (
            <div className="space-y-6">
              {/* Progress bar */}
              <div className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-primary">
                    Episode {lastEpisode} of {storyArc.total_episodes}
                  </span>
                  <span className="rounded-full bg-[rgba(212,137,58,0.15)] px-3 py-1 text-xs font-bold text-[#D4893A]">
                    {ACT_LABELS[storyArc.act]}
                  </span>
                </div>
                <div className="flex gap-1">
                  {ACTS.map((act) => {
                    const actIndex = ACTS.indexOf(act);
                    const currentIndex = ACTS.indexOf(storyArc.act);
                    const isComplete = actIndex < currentIndex;
                    const isCurrent = actIndex === currentIndex;
                    return (
                      <div key={act} className="flex-1 flex flex-col gap-1">
                        <div
                          className="h-2 rounded-full transition-colors"
                          style={{
                            background: isComplete
                              ? "#D4893A"
                              : isCurrent
                              ? "linear-gradient(90deg, #D4893A, rgba(212,137,58,0.3))"
                              : "rgba(74,64,53,0.10)",
                          }}
                        />
                        <span className={`text-[10px] ${isCurrent ? "text-[#D4893A] font-bold" : "text-text-dim"}`}>
                          {ACT_LABELS[act]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Act selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-text-secondary">Current Act</label>
                <select
                  value={storyArc.act}
                  onChange={(e) => setStoryArc({ ...storyArc, act: e.target.value as StoryArc["act"] })}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)] cursor-pointer"
                >
                  {ACTS.map((act) => (
                    <option key={act} value={act}>{ACT_LABELS[act]}</option>
                  ))}
                </select>
              </div>

              {/* Arc summary */}
              <Field
                label="Arc Summary"
                value={storyArc.arc_summary}
                onChange={(v) => setStoryArc({ ...storyArc, arc_summary: v })}
                multiline
                rows={3}
              />

              {/* Climax & Resolution */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Climax"
                  value={storyArc.climax}
                  onChange={(v) => setStoryArc({ ...storyArc, climax: v })}
                  multiline
                  rows={3}
                />
                <Field
                  label="Resolution"
                  value={storyArc.resolution}
                  onChange={(v) => setStoryArc({ ...storyArc, resolution: v })}
                  multiline
                  rows={3}
                />
              </div>

              {/* Season 2 Hooks */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                  Season 2 Hooks
                </h3>
                <div className="space-y-2">
                  {storyArc.season2_hooks.map((hook, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
                        value={hook}
                        onChange={(e) => {
                          const hooks = [...storyArc.season2_hooks];
                          hooks[i] = e.target.value;
                          setStoryArc({ ...storyArc, season2_hooks: hooks });
                        }}
                      />
                      <button
                        onClick={() => setStoryArc({ ...storyArc, season2_hooks: storyArc.season2_hooks.filter((_, j) => j !== i) })}
                        className="rounded-lg px-2 text-xs text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setStoryArc({ ...storyArc, season2_hooks: [...storyArc.season2_hooks, ""] })}
                    className="text-xs text-gold hover:underline cursor-pointer"
                  >
                    + Add hook
                  </button>
                </div>
              </div>

              {/* Remaining Episodes */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                  Episode Outlines
                </h3>
                <div className="space-y-2">
                  {storyArc.remaining_episodes.map((ep, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className={`mt-2 flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        ep.episode <= lastEpisode
                          ? "bg-[rgba(34,197,94,0.15)] text-green-600"
                          : "bg-surface-light text-text-dim"
                      }`}>
                        Ep {ep.episode}
                      </span>
                      <textarea
                        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
                        value={ep.outline}
                        onChange={(e) => {
                          const eps = [...storyArc.remaining_episodes];
                          eps[i] = { ...eps[i], outline: e.target.value };
                          setStoryArc({ ...storyArc, remaining_episodes: eps });
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Total episodes */}
              <div className="flex items-center gap-4 border-t border-border pt-4">
                <label className="text-sm font-medium text-text-secondary">Total Episodes</label>
                <input
                  type="number"
                  min={lastEpisode}
                  className="w-20 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-[rgba(212,137,58,0.3)]"
                  value={storyArc.total_episodes}
                  onChange={(e) => setStoryArc({ ...storyArc, total_episodes: parseInt(e.target.value) || storyArc.total_episodes })}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
