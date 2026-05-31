export interface CardInfo {
  name: string;
  set: string;
  artist: string;
  emoji: string;
  image?: string;
  affiliateUrl?: string;
  sold?: boolean;
}

export interface AffiliateProduct {
  name: string;
  url: string;
  price: string;
  tag: string;
  emoji: string;
}

export interface Episode {
  id: number;
  slug: string;
  title: string;
  cards: CardInfo[];
  products?: AffiliateProduct[];
  status: "live" | "locked";
  junior?: StoryData;
  full?: StoryData;
}

export interface SeriesCharacter {
  name: string;
  card: string;
  role: string;
}

export interface Series {
  id: string;
  title: string;
  tagline: string;
  genre: string;
  type: string;
  color: string;
  accent: string;
  bg: string;
  desc: string;
  status: "Airing" | "Coming Soon";
  epCount: number;
  episodes: Episode[];
  characters?: SeriesCharacter[];
  setting?: string;
}

export type StoryBlockType = "p" | "q" | "a" | "end";

export interface StoryBlock {
  t: StoryBlockType;
  c: string;
  speaker?: string;
}

export interface StoryData {
  scene: string;
  paragraphs: StoryBlock[];
}

export interface ShopProduct {
  id: number;
  icon: string;
  name: string;
  desc: string;
  price: string;
  cat: string;
  url?: string;
}

export interface Submission {
  name: string;
  cardName: string;
  series: string;
  photo: File | null;
  reason: string;
}

export type PokemonType =
  | "Fire" | "Water" | "Grass" | "Electric" | "Dark"
  | "Steel" | "Psychic" | "Fighting" | "Normal"
  | "Dragon" | "Fairy";

export type CardCondition = "NM" | "LP" | "MP" | "HP" | "DMG";

export type CardStatus = "available" | "sold" | "reserved" | "hidden";

export interface CardCollectionEntry {
  id: string;
  name: string;
  set: string;
  setNumber?: string;
  year: number;
  type: PokemonType;
  rarity: string;
  artist?: string;
  image: string;
  description?: string;
  price: number;
  originalPrice?: number;
  condition: CardCondition;
  stock?: number;
  status: CardStatus;
  suggestedPrice?: number;
  priceCheckedAt?: string;
  addedAt?: string;
}

export interface CSVImportRow {
  rowNumber: number;
  entry?: CardCollectionEntry;
  errors: string[];
  warnings: string[];
  action: "create" | "update" | "skip";
}

export interface CSVImportResult {
  rows: CSVImportRow[];
  totalCreate: number;
  totalUpdate: number;
  totalErrors: number;
  totalWarnings: number;
}
