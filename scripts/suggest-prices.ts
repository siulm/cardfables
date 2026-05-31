/**
 * Fill suggested market prices into cards-import.csv from the Pokémon TCG API.
 * Adds/updates two columns and NEVER touches the `price` column.
 *
 * Usage:
 *   node scripts/suggest-prices.ts [path/to/cards-import.csv]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fetchSuggestedPrice } from "../src/lib/cardPricing.ts";

const CSV = process.argv[2] ?? "cards-import.csv";

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0, field = "", row: string[] = [], inQ = false;
  while (i < text.length) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQ = false; i++; continue;
      }
      field += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ",") { row.push(field); field = ""; i++; continue; }
    if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
    if (c === "\r") { i++; continue; }
    field += c; i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
const esc = (v: string) => (/[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

async function main() {
  const rows = parseCSV(readFileSync(CSV, "utf-8"));
  const header = rows[0];
  const col = Object.fromEntries(header.map((h, i) => [h, i])) as Record<string, number>;

  // Ensure the two output columns exist (append if missing).
  for (const name of ["suggestedPrice", "priceCheckedAt"]) {
    if (!(name in col)) { col[name] = header.length; header.push(name); }
  }
  const width = header.length;
  const out = [header.map(esc).join(",")];

  let priced = 0, blank = 0, jpPriced = 0, jpTotal = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 1 && row[0] === "") continue;
    while (row.length < width) row.push("");

    const id = row[col.id] ?? "";
    const isJp = id.endsWith("-jp") || id.includes("-jp-");
    if (isJp) jpTotal++;

    const sug = await fetchSuggestedPrice({
      name: row[col.name],
      setNumber: row[col.setNumber],
      rarity: row[col.rarity],
    });

    if (sug) {
      row[col.suggestedPrice] = String(sug.suggestedPrice);
      row[col.priceCheckedAt] = sug.checkedAt;
      priced++;
      if (isJp) jpPriced++;
    } else {
      row[col.suggestedPrice] = "";
      row[col.priceCheckedAt] = "";
      blank++;
    }
    out.push(row.map((v) => esc(String(v ?? ""))).join(","));
  }

  writeFileSync(CSV, out.join("\n"));
  console.log(`priced ${priced} / blank ${blank}   (jp: ${jpPriced}/${jpTotal} priced)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
