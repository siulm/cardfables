import type { Series, StoryData, ShopProduct } from "./types";

export const SERIES: Series[] = [
  {
    id: "flames-of-our-lives",
    title: "Flames of Our Lives",
    tagline: "Love burns. So does Charizard.",
    genre: "Soap Opera • Drama • Comedy",
    type: "Fire",
    color: "#E8651A",
    accent: "#FFB347",
    bg: "linear-gradient(135deg, #E8651A 0%, #C41E3A 50%, #8B1A1A 100%)",
    desc: "The most dramatic saga in Verdant Valley. Fire-types with too many feelings, secrets that burn hotter than any Flamethrower, and a Venusaur who just wants answers.",
    status: "Airing",
    epCount: 1,
    episodes: [
      {
        id: 1,
        slug: "the-nap-that-changed-everything",
        title: "The Nap That Changed Everything",
        card: "Charizard V (SAR)",
        set: "VSTAR Universe",
        artist: "Oswaldo KATO",
        status: "live",
      },
      {
        id: 2,
        slug: "tba",
        title: "???",
        card: "???",
        set: "???",
        artist: "???",
        status: "locked",
      },
      {
        id: 3,
        slug: "tba",
        title: "???",
        card: "???",
        set: "???",
        artist: "???",
        status: "locked",
      },
    ],
  },
  {
    id: "oceans-deep",
    title: "Ocean's Deep",
    tagline: "What sinks, must surface.",
    genre: "Mystery • Thriller",
    type: "Water",
    color: "#3B82F6",
    accent: "#93C5FD",
    bg: "linear-gradient(135deg, #1E3A8A 0%, #1E40AF 50%, #0C1445 100%)",
    desc: "A missing Lapras. A suspicious Gyarados. A detective Slowking who's way smarter than everyone thinks. Dive into the underwater mystery that has the whole reef talking.",
    status: "Coming Soon",
    epCount: 0,
    episodes: [],
  },
  {
    id: "grass-is-greener",
    title: "Grass Is Greener",
    tagline: "The comedy that grows on you.",
    genre: "Comedy • Slice of Life",
    type: "Grass",
    color: "#22C55E",
    accent: "#86EFAC",
    bg: "linear-gradient(135deg, #166534 0%, #15803D 50%, #052E16 100%)",
    desc: "Bulbasaur just wanted a quiet garden. Then Oddish moved in next door. Then Sunflora started a podcast. Welcome to the funniest meadow in the Pokemon world.",
    status: "Coming Soon",
    epCount: 0,
    episodes: [],
  },
  {
    id: "thunderstruck",
    title: "Thunderstruck",
    tagline: "When the storm hits, who will you become?",
    genre: "Action • Coming of Age",
    type: "Electric",
    color: "#EAB308",
    accent: "#FDE68A",
    bg: "linear-gradient(135deg, #854D0E 0%, #A16207 50%, #422006 100%)",
    desc: "A young Pichu trying to evolve, a legendary Raikou who refuses to teach, and a storm that's about to change everything.",
    status: "Coming Soon",
    epCount: 0,
    episodes: [],
  },
  {
    id: "shadow-protocol",
    title: "Shadow Protocol",
    tagline: "Trust no one. Especially the ghost types.",
    genre: "Espionage • Psychological Thriller",
    type: "Dark",
    color: "#A855F7",
    accent: "#D8B4FE",
    bg: "linear-gradient(135deg, #581C87 0%, #6B21A8 50%, #2E1065 100%)",
    desc: "Gengar is running a spy ring. Absol knows too much. And someone in the shadows is pulling all the strings. A psychological thriller where nobody is innocent.",
    status: "Coming Soon",
    epCount: 0,
    episodes: [],
  },
  {
    id: "iron-will",
    title: "Iron Will",
    tagline: "Forged in fire. Tested by fate.",
    genre: "Epic • War Drama",
    type: "Steel",
    color: "#94A3B8",
    accent: "#CBD5E1",
    bg: "linear-gradient(135deg, #334155 0%, #475569 50%, #1E293B 100%)",
    desc: "An ancient conflict. A reluctant Lucario. A kingdom on the edge of collapse. The steel-type epic that will test everything you believe about honor and sacrifice.",
    status: "Coming Soon",
    epCount: 0,
    episodes: [],
  },
];

export const STORY_DATA: StoryData = {
  scene: "A sunlit clearing in Verdant Valley",
  paragraphs: [
    {
      t: "p",
      c: "Charizard -- once the most feared, most powerful, most dramatic fire-breather in all of Verdant Valley -- was... taking a nap.",
    },
    {
      t: "p",
      c: "Not just any nap. A legendary nap. Curled up like a giant orange cat, tail flame flickering lazily, snoring loud enough to shake the leaves off the trees. Some of those trees? Already a little burnt. Nobody talks about that.",
    },
    {
      t: "p",
      c: "In the background, Venusaur watched from behind a hill, squinting.",
    },
    {
      t: "q",
      speaker: "Venusaur",
      c: '"Unbelievable. He burns down half the meadow LAST Tuesday, doesn\'t apologize, and now he\'s sleeping like a baby in the SAME meadow. The audacity."',
    },
    {
      t: "p",
      c: "But here's the thing nobody knew -- Charizard wasn't just being lazy. He was exhausted.",
    },
    {
      t: "p",
      c: "For weeks, he'd been secretly flying across the valley every night, using his Heat Blast to keep the northern caves warm for the baby Pokemon who'd lost their homes after the big storm. The little Charmanders, the shivering Eevees, even a very grumpy Snorlax who refused to admit he was cold.",
    },
    {
      t: "p",
      c: "He never told anyone. Too proud. Too stubborn. Too... Charizard.",
    },
    {
      t: "p",
      c: 'So while the valley gossiped about the "selfish dragon," Charizard just curled up tighter, let the sun warm his wings, and dreamed of a world where nobody needed saving anymore.',
    },
    {
      t: "a",
      c: "-- a leaf blows gently across the clearing --",
    },
    {
      t: "p",
      c: "Venusaur narrowed his eyes. Something didn't add up. The scorch marks on Charizard's claws weren't from recklessness -- they were from work. Long, careful, exhausting work.",
    },
    {
      t: "q",
      speaker: "Venusaur",
      c: '"Something\'s going on with that oversized lizard... and I\'m going to find out what."',
    },
    {
      t: "end",
      c: "To be continued...",
    },
  ],
};

export const SHOP: ShopProduct[] = [
  {
    id: 1,
    icon: "\u{1F525}",
    name: "Charizard V (SAR)",
    desc: "The card that started Episode 1",
    price: "~$45",
    cat: "Featured",
  },
  {
    id: 2,
    icon: "\u{1F4E6}",
    name: "VSTAR Universe Booster Box",
    desc: "Pull your own SAR cards. 10 packs.",
    price: "~$85",
    cat: "Booster",
  },
  {
    id: 3,
    icon: "\u{1F6E1}\uFE0F",
    name: "Ultra Pro Sleeves (100ct)",
    desc: "Matte sleeves to protect your pulls.",
    price: "~$9",
    cat: "Gear",
  },
  {
    id: 4,
    icon: "\u{1F4D2}",
    name: "9-Pocket Pro Binder",
    desc: "Side-loading premium card display.",
    price: "~$25",
    cat: "Gear",
  },
  {
    id: 5,
    icon: "\u{1F3B4}",
    name: "Pokemon 151 Bundle",
    desc: "6 booster packs from the 151 set.",
    price: "~$35",
    cat: "Booster",
  },
  {
    id: 6,
    icon: "\u{1F50D}",
    name: "LED Magnifying Loupe",
    desc: "Inspect card condition. 60x zoom.",
    price: "~$12",
    cat: "Gear",
  },
];

export const SHOP_CATEGORIES = ["All", "Featured", "Booster", "Gear"] as const;
export const BROWSE_TYPES = [
  "All",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Dark",
  "Steel",
] as const;

export function getSeriesBySlug(slug: string): Series | undefined {
  return SERIES.find((s) => s.id === slug);
}

export function getEpisodeBySlugs(
  seriesSlug: string,
  episodeSlug: string
): { series: Series; episode: (typeof SERIES)[0]["episodes"][0] } | undefined {
  const series = getSeriesBySlug(seriesSlug);
  if (!series) return undefined;
  const episode = series.episodes.find((e) => e.slug === episodeSlug);
  if (!episode) return undefined;
  return { series, episode };
}

export function getAllEpisodePaths(): {
  seriesSlug: string;
  episodeSlug: string;
}[] {
  const paths: { seriesSlug: string; episodeSlug: string }[] = [];
  for (const series of SERIES) {
    for (const ep of series.episodes) {
      if (ep.status === "live") {
        paths.push({ seriesSlug: series.id, episodeSlug: ep.slug });
      }
    }
  }
  return paths;
}
