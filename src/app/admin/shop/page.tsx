"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useAdmin } from "../context";

interface ShopProduct {
  id: number;
  icon: string;
  name: string;
  desc: string;
  price: string;
  cat: string;
  url?: string;
}

const SHOP_ICONS = ["🔥", "📦", "🛡️", "📒", "🎴", "🔍", "⚡", "💎", "🎯", "🃏", "🏆", "⭐", "🎁", "🧩"];

export default function ShopPage() {
  const { setError, setSuccess } = useAdmin();

  const [shopProducts, setShopProducts] = useState<ShopProduct[]>([]);
  const [shopCategories, setShopCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  async function loadShop() {
    setLoading(true);
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
      setLoading(false);
    }
  }

  async function saveShop() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/shop", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: shopProducts,
          categories: shopCategories,
          browseTypes: ["All", "Fire", "Water", "Grass", "Electric", "Dark", "Steel"],
        }),
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
      setSaving(false);
    }
  }

  function updateProduct(index: number, field: keyof ShopProduct, value: string | number) {
    const updated = [...shopProducts];
    updated[index] = { ...updated[index], [field]: value };
    setShopProducts(updated);
  }

  function addProduct() {
    const newId = shopProducts.length > 0 ? Math.max(...shopProducts.map((p) => p.id)) + 1 : 1;
    setShopProducts([
      ...shopProducts,
      {
        id: newId,
        icon: "🎴",
        name: "New Product",
        desc: "Product description",
        price: "~$0",
        cat: shopCategories[1] || "Featured",
        url: "#",
      },
    ]);
  }

  function removeProduct(index: number) {
    setShopProducts(shopProducts.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-text-primary">Shop Products</h1>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={addProduct}>
            + Add Product
          </Button>
          <Button
            onClick={saveShop}
            className={saving ? "opacity-50 pointer-events-none" : ""}
          >
            {saving ? "Saving..." : "Save to GitHub"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-text-dim border-t-[#D4893A]" />
          <p className="text-sm text-text-secondary">Loading shop products...</p>
        </div>
      )}

      {!loading && shopProducts.length === 0 && (
        <p className="py-16 text-center text-sm text-text-dim">No products yet.</p>
      )}

      {!loading && shopProducts.length > 0 && (
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
                  <span className="rounded bg-surface-light px-2 py-0.5 text-xs text-text-dim">
                    {product.cat}
                  </span>
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
                    {shopCategories
                      .filter((c) => c !== "All")
                      .map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
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
  );
}
