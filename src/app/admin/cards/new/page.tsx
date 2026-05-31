"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdmin } from "../../context";
import { slugifyCardId } from "@/lib/cardsCollection";
import type {
  CardCollectionEntry,
  CardCondition,
  CardStatus,
  PokemonType,
} from "@/lib/types";

const TYPES: PokemonType[] = ["Fire", "Water", "Grass", "Electric", "Dark", "Steel", "Psychic", "Fighting", "Normal", "Dragon", "Fairy"];
const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DMG"];
const STATUSES: CardStatus[] = ["available", "sold", "reserved", "hidden"];

export default function NewCardPage() {
  const { authenticated } = useAdmin();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<CardCollectionEntry>>({
    name: "",
    set: "",
    year: new Date().getFullYear(),
    type: "Normal",
    rarity: "Common",
    price: 0,
    condition: "NM",
    status: "available",
    image: "",
  });

  if (!authenticated) return null;

  const update = (patch: Partial<CardCollectionEntry>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      alert("Name and price are required");
      return;
    }
    setSaving(true);
    const id = slugifyCardId(form.name, form.set ?? "");
    const today = new Date().toISOString().slice(0, 10);
    const entry: CardCollectionEntry = {
      id,
      name: form.name!,
      set: form.set ?? "",
      year: form.year ?? new Date().getFullYear(),
      type: form.type as PokemonType,
      rarity: form.rarity ?? "Common",
      image: form.image ?? "",
      price: Number(form.price),
      condition: form.condition as CardCondition,
      status: form.status as CardStatus,
      addedAt: today,
      ...(form.setNumber ? { setNumber: form.setNumber } : {}),
      ...(form.artist ? { artist: form.artist } : {}),
      ...(form.description ? { description: form.description } : {}),
      ...(form.originalPrice ? { originalPrice: Number(form.originalPrice) } : {}),
      ...(form.stock ? { stock: Number(form.stock) } : {}),
    };
    const res = await fetch("/api/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    setSaving(false);
    if (!res.ok) {
      const error = await res.text();
      alert(`Failed to save: ${error}`);
      return;
    }
    router.push("/admin/cards");
  };

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="mb-4 font-heading text-2xl font-bold text-text-primary">Add Card</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name *">
          <input value={form.name ?? ""} onChange={(e) => update({ name: e.target.value })} className={input} required />
        </Field>
        <Field label="Set">
          <input value={form.set ?? ""} onChange={(e) => update({ set: e.target.value })} className={input} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Year">
            <input type="number" value={form.year ?? ""} onChange={(e) => update({ year: Number(e.target.value) })} className={input} />
          </Field>
          <Field label="Set Number">
            <input value={form.setNumber ?? ""} onChange={(e) => update({ setNumber: e.target.value })} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select value={form.type ?? "Normal"} onChange={(e) => update({ type: e.target.value as PokemonType })} className={input}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Rarity">
            <input value={form.rarity ?? ""} onChange={(e) => update({ rarity: e.target.value })} className={input} />
          </Field>
        </div>
        <Field label="Artist">
          <input value={form.artist ?? ""} onChange={(e) => update({ artist: e.target.value })} className={input} />
        </Field>
        <Field label="Image path (e.g., /images/cards-collection/foo.jpg)">
          <input value={form.image ?? ""} onChange={(e) => update({ image: e.target.value })} className={input} />
        </Field>
        <Field label="Description">
          <textarea value={form.description ?? ""} onChange={(e) => update({ description: e.target.value })} className={input} rows={3} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price *">
            <input type="number" step="0.01" value={form.price ?? ""} onChange={(e) => update({ price: Number(e.target.value) })} className={input} required />
          </Field>
          <Field label="Original Price">
            <input type="number" step="0.01" value={form.originalPrice ?? ""} onChange={(e) => update({ originalPrice: Number(e.target.value) })} className={input} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Condition">
            <select value={form.condition ?? "NM"} onChange={(e) => update({ condition: e.target.value as CardCondition })} className={input}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Stock">
            <input type="number" min={0} value={form.stock ?? ""} onChange={(e) => update({ stock: Number(e.target.value) })} className={input} />
          </Field>
          <Field label="Status">
            <select value={form.status ?? "available"} onChange={(e) => update({ status: e.target.value as CardStatus })} className={input}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="pt-3 flex gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-gold px-5 py-2 text-sm font-bold text-white">
            {saving ? "Saving…" : "Save card"}
          </button>
          <button type="button" onClick={() => router.push("/admin/cards")} className="text-sm font-medium text-text-secondary underline">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const input = "w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</div>
      {children}
    </label>
  );
}
