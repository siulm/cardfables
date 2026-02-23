import type { Series, ShopProduct } from "./types";

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
    epCount: 2,
    episodes: [
      {
        id: 1,
        slug: "the-nap-that-changed-everything",
        title: "The Nap That Changed Everything",
        cards: [
          { name: "Charizard V (SAR)", set: "VSTAR Universe", artist: "Oswaldo KATO", emoji: "\u{1F525}" },
        ],
        status: "live",
        junior: {
          scene: "A sunny meadow in Verdant Valley",
          paragraphs: [
            { t: "p", c: "Charizard was the biggest, strongest Pok\u00e9mon in Verdant Valley. He could fly super fast. He could breathe fire that was SO hot. He was amazing." },
            { t: "p", c: "But right now? He was taking a nap." },
            { t: "p", c: "Not just any nap. The BIGGEST nap. He was curled up in the grass like a giant orange cat, snoring so loud that the leaves were falling off the trees. His tail flame went flicker... flicker... flicker..." },
            { t: "p", c: "Venusaur was watching from behind a hill. Venusaur was big and green and covered in flowers, and right now he was very, VERY grumpy." },
            { t: "q", speaker: "Venusaur", c: "\"Are you KIDDING me? He burned down half the meadow last week! And now he's sleeping here like nothing happened!\"" },
            { t: "p", c: "Everyone in the valley thought Charizard was selfish. He never helped with anything. He never came to the valley meetings. He just flew around and napped and sometimes accidentally set things on fire." },
            { t: "p", c: "But here's the secret. The BIG secret." },
            { t: "p", c: "Charizard wasn't being lazy. He was EXHAUSTED." },
            { t: "p", c: "Every single night, when everyone was asleep, Charizard flew to the caves on the north side of the valley. A big storm had knocked down the trees near the caves, and all the baby Pok\u00e9mon who lived there were cold. Really, really cold." },
            { t: "p", c: "So Charizard used his fire breath \u2014 very carefully, very gently \u2014 to keep the caves warm all night long. He kept the little Charmanders warm. He kept the shivering Eevees warm. He even kept a very grumpy Snorlax warm, even though Snorlax said he was \"fine\" (he was NOT fine)." },
            { t: "p", c: "But Charizard never told anyone. He was too proud. He didn't want anyone to think he was... nice." },
            { t: "a", c: "\u2014 a leaf floats gently across the meadow \u2014" },
            { t: "p", c: "Back on the hill, Venusaur squinted his eyes. He noticed something weird. The burn marks on Charizard's claws didn't look like accident burns. They looked like WORK burns. Like he'd been doing something careful and hard, over and over again." },
            { t: "q", speaker: "Venusaur", c: "\"Hmm. Something's going on with that big lizard... and I'm going to find out WHAT.\"" },
            { t: "end", c: "To be continued..." },
          ],
        },
        full: {
          scene: "A sunlit clearing in Verdant Valley",
          paragraphs: [
            { t: "p", c: "Charizard \u2014 once the most feared, most powerful, most dramatic fire-breather in all of Verdant Valley \u2014 was\u2026 taking a nap." },
            { t: "p", c: "Not just any nap. A legendary nap. Curled up like a giant orange cat, tail flame flickering lazily, snoring loud enough to shake the leaves off the trees. Some of those trees? Already a little burnt. Nobody talks about that." },
            { t: "p", c: "In the background, Venusaur watched from behind a hill, squinting." },
            { t: "q", speaker: "Venusaur", c: "\"Unbelievable. He burns down half the meadow LAST Tuesday, doesn't apologize, and now he's sleeping like a baby in the SAME meadow. The audacity.\"" },
            { t: "p", c: "But here's the thing nobody knew \u2014 Charizard wasn't just being lazy. He was exhausted." },
            { t: "p", c: "For weeks, he'd been secretly flying across the valley every night, using his Heat Blast to keep the northern caves warm for the baby Pok\u00e9mon who'd lost their homes after the big storm. The little Charmanders, the shivering Eevees, even a very grumpy Snorlax who refused to admit he was cold." },
            { t: "p", c: "He never told anyone. Too proud. Too stubborn. Too\u2026 Charizard." },
            { t: "p", c: "So while the valley gossiped about the \"selfish dragon,\" Charizard just curled up tighter, let the sun warm his wings, and dreamed of a world where nobody needed saving anymore." },
            { t: "a", c: "\u2014 a leaf blows gently across the clearing \u2014" },
            { t: "p", c: "Venusaur narrowed his eyes. Something didn't add up. The scorch marks on Charizard's claws weren't from recklessness \u2014 they were from work. Long, careful, exhausting work." },
            { t: "q", speaker: "Venusaur", c: "\"Something's going on with that oversized lizard\u2026 and I'm going to find out what.\"" },
            { t: "end", c: "To be continued\u2026" },
          ],
        },
      },
      {
        id: 2,
        slug: "the-witch-who-knew-too-much",
        title: "The Witch Who Knew Too Much",
        cards: [
          { name: "Mismagius ex", set: "M2 (036/080 RR)", artist: "5ban Graphics", emoji: "\u{1F47B}" },
          { name: "Genesect V", set: "VSTAR Universe (102/172 RR)", artist: "PLANETA Tsuji", emoji: "\u{1F916}" },
        ],
        status: "live",
        junior: {
          scene: "The edge of the valley, nighttime. Fog everywhere.",
          paragraphs: [
            { t: "p", c: "Venusaur couldn't sleep. He kept thinking about Charizard and those weird burn marks on his claws." },
            { t: "p", c: "So tonight, he decided to follow Charizard. Like a detective! A really big, really slow, really loud detective." },
            { t: "p", c: "The sun went down. The stars came out. And sure enough \u2014 Charizard woke up, stretched his wings, and flew north." },
            { t: "p", c: "Venusaur tried to sneak through the forest after him. But sneaking is hard when you weigh as much as a car." },
            { t: "p", c: "CRUNCH. SNAP. CRUNCH." },
            { t: "q", speaker: "???", c: "\"You know, for a spy, you're really, REALLY bad at this.\"" },
            { t: "p", c: "Venusaur froze. That voice came from... everywhere? He looked left. He looked right. He looked up." },
            { t: "p", c: "And there she was." },
            { t: "a", c: "\u2014 purple mist swirls and sparkles fill the air \u2014" },
            { t: "p", c: "Mismagius floated down from the treetops, covered in sparkles and glowing purple light. She was a Ghost-type who'd lived in the valley forever. Nobody knew where she came from. She just... showed up wherever something interesting was happening." },
            { t: "p", c: "Some Pok\u00e9mon called her the Witch. She preferred \"Observer.\"" },
            { t: "q", speaker: "Mismagius", c: "\"You're following the big dragon, aren't you?\"" },
            { t: "q", speaker: "Venusaur", c: "\"I'm INVESTIGATING. That's different.\"" },
            { t: "q", speaker: "Mismagius", c: "\"Sure, sure. Very professional. Very sneaky. Not at all like a Tauros crashing through a gift shop.\"" },
            { t: "p", c: "Venusaur's face got hot. His flower started blooming. That always happened when he was embarrassed." },
            { t: "q", speaker: "Venusaur", c: "\"Do you know what Charizard is doing every night?\"" },
            { t: "p", c: "Mismagius stopped smiling. Her sparkles changed from pink to dark purple. She floated closer." },
            { t: "q", speaker: "Mismagius", c: "\"I know EVERYTHING that happens in this valley at night. I know Charizard flies to the northern caves to keep the baby Pok\u00e9mon warm. But that's not the scary part.\"" },
            { t: "q", speaker: "Venusaur", c: "\"There's a SCARY PART?\"" },
            { t: "q", speaker: "Mismagius", c: "\"Something new has come to the valley. Something made of metal. It has a cannon on its back. It doesn't eat. It doesn't sleep. It just flies around scanning everything. And it's heading straight for those caves.\"" },
            { t: "a", c: "\u2014 SCREEEEECH! A metallic sound echoes from the mountains \u2014" },
            { t: "p", c: "They both looked up. A streak of purple and silver light shot across the sky like a rocket. It wasn't a bird. It wasn't a Pok\u00e9mon they'd ever seen. It moved like a machine \u2014 fast, sharp, and scary." },
            { t: "p", c: "Genesect. A robotic Pok\u00e9mon with a giant cannon on its back, blasting through the sky straight toward the northern caves." },
            { t: "p", c: "Straight toward Charizard. Straight toward the babies." },
            { t: "q", speaker: "Venusaur", c: "\"We have to warn Charizard! NOW!\"" },
            { t: "q", speaker: "Mismagius", c: "\"WE? Oh no no no. I'm a ghost. I float and I watch. I don't DO running.\"" },
            { t: "q", speaker: "Venusaur", c: "\"Mismagius. Please.\"" },
            { t: "p", c: "She looked at him for a long moment. Then she sighed \u2014 a sigh that made all the flowers around them shiver." },
            { t: "q", speaker: "Mismagius", c: "\"Fine. But I'm floating the whole way. And if anything bad happens, I'm blaming you.\"" },
            { t: "p", c: "And so the grumpiest Pok\u00e9mon in the valley and the spookiest Pok\u00e9mon in the valley started running (and floating) north as fast as they could." },
            { t: "p", c: "Behind them, the valley slept peacefully." },
            { t: "p", c: "Ahead of them, Charizard had no idea what was coming." },
            { t: "p", c: "And above them, Genesect's cannon glowed in the dark." },
            { t: "end", c: "To be continued..." },
          ],
        },
        full: {
          scene: "The edge of Verdant Valley, twilight. Fog rolling in.",
          paragraphs: [
            { t: "p", c: "Venusaur couldn't sleep." },
            { t: "p", c: "It had been three days since he'd noticed the scorch marks on Charizard's claws. Three days of watching that overgrown fire hazard nap in the meadow like he didn't have a care in the world. Three days of knowing something was off and not being able to prove it." },
            { t: "p", c: "So tonight, Venusaur did something he'd never done in fourteen years of living in this valley. He followed someone." },
            { t: "p", c: "The moment the sun dipped below the ridge and the last Pidgey stopped chirping, Charizard stirred. Stretched his wings. Yawned a column of fire that nearly scorched a passing Butterfree \u2014 \"SORRY!\" \u2014 and launched into the sky heading north." },
            { t: "p", c: "Venusaur lumbered after him on the ground, sticking to the tree line, moving as quietly as a four-hundred-pound dinosaur plant possibly could. Which was not quietly at all." },
            { t: "q", speaker: "Mismagius", c: "\"You know, for a spy, you're absolutely terrible at this.\"" },
            { t: "p", c: "The voice came from everywhere and nowhere. It floated down like silk made of smoke, curling around his ears with a warmth that felt... wrong. Too warm. The kind of warm that makes you forget what you were doing." },
            { t: "a", c: "\u2014 the fog parts, and a swirl of purple mist takes shape \u2014" },
            { t: "p", c: "Mismagius descended from the canopy, trailing sparkles and pink crystal light like she was her own special effect. Her eyes \u2014 those impossible red eyes \u2014 locked onto Venusaur with the expression of someone who had been watching this whole situation unfold for weeks and was deeply entertained by it." },
            { t: "p", c: "Mismagius was the valley's oldest mystery. Nobody knew when she'd arrived. Nobody knew where she lived. She showed up at every major event \u2014 every argument, every breakup, every midnight scandal \u2014 and watched from the shadows with that little smile." },
            { t: "p", c: "Some Pok\u00e9mon called her the Oracle. Others called her the Witch. Snorlax once called her \"deeply unsettling,\" which was the most words Snorlax had used in a single sentence all year." },
            { t: "q", speaker: "Mismagius", c: "\"You're following the dragon.\"" },
            { t: "q", speaker: "Venusaur", c: "\"I'm investigating. There's a difference.\"" },
            { t: "q", speaker: "Mismagius", c: "\"Mmm. Of course. Very official. Very dignified. Very much stumbling through bushes at midnight like a confused Tauros.\"" },
            { t: "p", c: "Venusaur felt his face go hot. Which, for a Grass-type, meant his flower actually started to bloom a little. Embarrassing." },
            { t: "q", speaker: "Venusaur", c: "\"Do you know what he's doing? The night flights? The scorch marks?\"" },
            { t: "p", c: "Mismagius tilted her head. The sparkles around her shifted from pink to deep violet. When she spoke, her voice dropped to something almost serious." },
            { t: "q", speaker: "Mismagius", c: "\"I know everything that happens in this valley after dark, Venusaur. Everything. I know that Charizard flies north every single night. I know what he does when he gets there. And I know that you're not going to like the answer \u2014 not because it's bad, but because it's going to make you feel guilty for every rotten thing you've said about him.\"" },
            { t: "p", c: "She drifted closer. The air around her got colder. The sparkles died." },
            { t: "q", speaker: "Mismagius", c: "\"He's not just keeping them warm. He's guarding them. Something has been approaching the northern ridge for the past two weeks. Something none of us have ever seen before. Metal body. Red eyes. A cannon on its back. It doesn't eat. It doesn't sleep. It just... scans. Like it's searching for something.\"" },
            { t: "p", c: "Venusaur felt the vines on his back tighten involuntarily." },
            { t: "a", c: "\u2014 a distant metallic screech echoes from the northern mountains \u2014" },
            { t: "p", c: "Both of them turned toward the sound. Above the treeline, a streak of purple and silver light cut across the sky like a comet with a grudge. Fast. Precise. Nothing natural about it." },
            { t: "p", c: "Genesect had arrived in Verdant Valley. Not walking. Not flying in the way birds fly \u2014 no grace, no wind. It moved like a machine that had calculated the most efficient trajectory between two points and simply executed. The cannon on its back glowed a sickly violet, scanning the terrain below." },
            { t: "p", c: "It was heading straight for the northern caves. Straight for Charizard." },
            { t: "q", speaker: "Venusaur", c: "\"We have to warn him.\"" },
            { t: "q", speaker: "Mismagius", c: "\"We? Oh no no no. You have to warn him. I'm an observer. I observe. I comment. I occasionally make things sparkle. I do not do... running.\"" },
            { t: "q", speaker: "Venusaur", c: "\"Mismagius. Please.\"" },
            { t: "p", c: "She looked at him. Really looked at him \u2014 past the grumpy exterior and the judgmental squinting and the fourteen years of loudly complaining about Charizard at every community meeting." },
            { t: "q", speaker: "Mismagius", c: "\"...You actually care about him, don't you?\"" },
            { t: "p", c: "Venusaur said nothing. His flower bloomed a little more." },
            { t: "q", speaker: "Mismagius", c: "\"Fine. But I'm floating. And if I die, I'm haunting you specifically.\"" },
            { t: "q", speaker: "Venusaur", c: "\"You're already a ghost.\"" },
            { t: "q", speaker: "Mismagius", c: "\"Then I'll haunt you harder.\"" },
            { t: "p", c: "They moved north. Venusaur running \u2014 actually running \u2014 for the first time in years. Mismagius gliding beside him, trailing purple light and looking like the most reluctant hero in the history of Verdant Valley." },
            { t: "p", c: "Behind them, the valley slept peacefully. Ahead of them, a dragon who didn't know he needed saving was about to meet something that didn't know it needed stopping." },
            { t: "p", c: "And above them all, Genesect's cannon hummed." },
            { t: "end", c: "To be continued\u2026" },
          ],
        },
      },
      {
        id: 3,
        slug: "tba",
        title: "???",
        cards: [],
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
