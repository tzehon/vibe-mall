import { createHash } from "node:crypto";

import { DEMO_SAMPLE_VIBES } from "./demoMetadata";
import type { Product, ProductCategory } from "./models";
import { hashPassword } from "./passwords";

export const DEMO_USER_EMAIL = "demo@vibemall.local";
export const DEMO_USER_PASSWORD = "vibe-mall-demo";
export const DEMO_USER_NAME = "Demo Merchant";
export const SECOND_DEMO_USER_EMAIL = "second@vibemall.local";
export const SECOND_DEMO_USER_PASSWORD = "vibe-mall-second";
export const SECOND_DEMO_USER_NAME = "Second Merchant";

export const DEMO_USERS = [
  {
    label: "Primary merchant",
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    name: DEMO_USER_NAME
  },
  {
    label: "Second merchant",
    email: SECOND_DEMO_USER_EMAIL,
    password: SECOND_DEMO_USER_PASSWORD,
    name: SECOND_DEMO_USER_NAME
  }
] as const;

const CREATED_AT = new Date("2026-05-16T00:00:00.000Z");

type Palette = {
  name: string;
  colors: string[];
  labels: string[];
};

type CategoryConfig = {
  category: ProductCategory;
  skuPrefix: string;
  brands: string[];
  nouns: string[];
  materials: string[];
  intents: string[];
};

type DemoChipSeed = {
  vibe: (typeof DEMO_SAMPLE_VIBES)[number];
  namePrefix: string;
  tags: string[];
  searchPhrases: string[];
};

const palettes: Palette[] = [
  {
    name: "bubblegum mint pop",
    colors: ["#ff8fb3", "#8be0d4", "#fff4b8"],
    labels: ["bubblegum pink", "mint", "vanilla yellow"]
  },
  {
    name: "chrome berry night",
    colors: ["#1b1d2a", "#c0c7d1", "#d84c8b"],
    labels: ["midnight", "chrome", "berry"]
  },
  {
    name: "matcha clay calm",
    colors: ["#7aa874", "#d99b70", "#f8ecd1"],
    labels: ["matcha", "terracotta", "warm cream"]
  },
  {
    name: "cobalt citrus sprint",
    colors: ["#2356c4", "#f7c948", "#f15a3b"],
    labels: ["cobalt", "citrus", "signal coral"]
  },
  {
    name: "soft graphite cloud",
    colors: ["#2f3542", "#aab2bf", "#f2f4f7"],
    labels: ["graphite", "cloud gray", "soft white"]
  },
  {
    name: "orchid arcade glow",
    colors: ["#7b2ff7", "#00d4ff", "#f8ff6b"],
    labels: ["orchid", "electric blue", "neon lime"]
  },
  {
    name: "espresso rose ritual",
    colors: ["#4b2e2a", "#d08c8c", "#f6dbc8"],
    labels: ["espresso", "dusty rose", "almond"]
  },
  {
    name: "forest pixel picnic",
    colors: ["#155e49", "#72bf78", "#f4d35e"],
    labels: ["forest", "leaf green", "picnic yellow"]
  }
];

const moods = [
  "playful",
  "cozy",
  "sleek",
  "nostalgic",
  "bold",
  "dreamy",
  "focused",
  "glam",
  "minimal",
  "festival-ready",
  "whimsical",
  "quiet luxury"
];

const styles = [
  "Y2K cyber-glam",
  "soft maximalist",
  "cottage studio",
  "retro arcade",
  "quiet luxury",
  "goblin-core",
  "pastel kawaii",
  "airport sprint",
  "gallery minimal",
  "birthday party",
  "campus cool",
  "neon night market"
];

const occasions = [
  "birthday gifting",
  "desk refresh",
  "airport travel",
  "weekend hosting",
  "concert night",
  "self-care reset",
  "back-to-school",
  "housewarming",
  "snack run",
  "holiday surprise"
];

const socialVibes = [
  "TikTok haul",
  "group chat approved",
  "creator desk tour",
  "unboxing moment",
  "photo booth ready",
  "commuter flex",
  "host gift table",
  "soft launch party",
  "cozy livestream",
  "mall crawl"
];

const demoChipSeeds: DemoChipSeed[] = [
  {
    vibe: DEMO_SAMPLE_VIBES[0],
    namePrefix: "kawaii character birthday",
    tags: [
      "pokemon-inspired",
      "cute birthday",
      "birthday gifting",
      "pastel kawaii",
      "collectible character",
      "party favor"
    ],
    searchPhrases: [
      "Pokemon style cute birthday",
      "pokemon-inspired character party",
      "cute birthday shelf",
      "pastel kawaii gift bundle",
      "playful collectible surprise"
    ]
  },
  {
    vibe: DEMO_SAMPLE_VIBES[1],
    namePrefix: "wire-free clean desk",
    tags: [
      "no wires",
      "wire-free",
      "clean desk",
      "desk refresh",
      "minimal workspace",
      "cable management"
    ],
    searchPhrases: [
      "No wires clean desk refresh",
      "wire-free workspace setup",
      "clean desk organization",
      "minimal desk refresh",
      "cable-free productivity shelf"
    ]
  },
  {
    vibe: DEMO_SAMPLE_VIBES[2],
    namePrefix: "quiet luxury winter",
    tags: [
      "quiet luxury",
      "winterwear",
      "warm neutral",
      "cashmere feel",
      "airport lounge",
      "elevated basics"
    ],
    searchPhrases: [
      "Quiet luxury winterwear",
      "warm neutral winter essentials",
      "cashmere-feel travel layers",
      "quiet luxury airport lounge",
      "elevated cold-weather basics"
    ]
  },
  {
    vibe: DEMO_SAMPLE_VIBES[3],
    namePrefix: "rainy night gamer dorm",
    tags: [
      "neon",
      "rainy night",
      "gamer dorm",
      "rgb glow",
      "cozy livestream",
      "late-night gaming"
    ],
    searchPhrases: [
      "neon rainy-night gamer dorm",
      "rainy night gaming setup",
      "neon dorm room shelf",
      "RGB glow study break",
      "cozy livestream essentials"
    ]
  },
  {
    vibe: DEMO_SAMPLE_VIBES[4],
    namePrefix: "founder coffee run",
    tags: [
      "soft launch",
      "soft-launch",
      "founder",
      "coffee run",
      "startup morning",
      "cafe work session"
    ],
    searchPhrases: [
      "soft-launch founder coffee run",
      "founder coffee meeting",
      "startup morning essentials",
      "soft launch cafe kit",
      "polished coffee run shelf"
    ]
  }
];

const categoryConfigs: CategoryConfig[] = [
  {
    category: "apparel",
    skuPrefix: "APP",
    brands: ["Loop & Loom", "Signal Stitch", "Mellow Fit", "Pixel Prairie"],
    nouns: ["boxy tee", "ribbed cardigan", "cargo skirt", "travel hoodie", "party overshirt", "wide-leg jogger"],
    materials: ["brushed cotton", "recycled nylon", "rib knit", "washed fleece"],
    intents: ["easy outfit building", "theme party dressing", "layering for travel", "camera-ready comfort"]
  },
  {
    category: "accessories",
    skuPrefix: "ACC",
    brands: ["Charm Circuit", "Orbit Goods", "Tote Theory", "Buckle Studio"],
    nouns: ["mini tote", "beaded charm set", "cloud scarf", "belt bag", "phone wristlet", "hair claw"],
    materials: ["vegan leather", "enamel", "woven nylon", "brushed metal"],
    intents: ["finishing an outfit", "hands-free commuting", "giftable add-on", "cute organization"]
  },
  {
    category: "home",
    skuPrefix: "HOM",
    brands: ["Nest Arcade", "Sunday Shelf", "Glow Habitat", "Room Ritual"],
    nouns: ["throw pillow", "desk lamp", "ceramic tray", "shelf basket", "mug set", "ambient diffuser"],
    materials: ["ceramic", "linen blend", "powder coated steel", "bamboo"],
    intents: ["refreshing a small space", "hosting friends", "making a desk feel personal", "cozy evening rituals"]
  },
  {
    category: "beauty",
    skuPrefix: "BEA",
    brands: ["Gloss Signal", "Petal Lab", "Aura Shelf", "Mirror Mode"],
    nouns: ["lip tint", "cream blush", "travel mist", "sheet mask stack", "glow balm", "mini brush kit"],
    materials: ["satin finish", "botanical oils", "recyclable tube", "soft-touch compact"],
    intents: ["quick glow up", "party prep", "self-care night", "carry-on beauty kit"]
  },
  {
    category: "gadgets",
    skuPrefix: "GAD",
    brands: ["Byte Bazaar", "Charge Club", "Pocket Signal", "Deskware Co"],
    nouns: ["portable charger", "LED key light", "cable taco set", "mini speaker", "desk timer", "travel adapter"],
    materials: ["anodized aluminum", "soft silicone", "braided cable", "matte polycarbonate"],
    intents: ["travel readiness", "desk productivity", "creator filming", "everyday carry upgrades"]
  },
  {
    category: "snacks",
    skuPrefix: "SNK",
    brands: ["Crunch Parade", "Moon Bento", "Snack Circuit", "Sweet Packet"],
    nouns: ["mochi snack box", "sparkle gummies", "savory crisp mix", "matcha cookie tin", "sour candy flight", "mini popcorn trio"],
    materials: ["resealable pouch", "gift tin", "compostable wrapper", "share pack"],
    intents: ["movie night", "desk snack restock", "party favor", "road trip treat"]
  },
  {
    category: "gifting",
    skuPrefix: "GFT",
    brands: ["Bow & Bloom", "Little Ceremony", "Parcel Pop", "Wish Desk"],
    nouns: ["birthday bundle", "thank-you kit", "mini surprise box", "host gift set", "care package", "desk mascot kit"],
    materials: ["paper wrap", "keepsake box", "ribbon tag", "reusable pouch"],
    intents: ["last-minute gifting", "personalized surprise", "host appreciation", "group gift moment"]
  }
];

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function pick<T>(items: T[], index: number, offset = 0) {
  return items[(index + offset) % items.length];
}

function demoChipForIndex(index: number) {
  return demoChipSeeds[index % demoChipSeeds.length];
}

function escapeXmlText(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function itemArtwork(product: {
  category: ProductCategory;
  noun: string;
  palette: Palette;
  safeNoun: string;
  safeSku: string;
}) {
  const [base, accent, highlight] = product.palette.colors;
  const noun = product.noun.toLowerCase();
  const ink = "#151515";
  const label = `<text x="320" y="560" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="#151515">${product.safeNoun}</text>
  <text x="320" y="596" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#4a4a4a">${product.safeSku}</text>`;
  const wrap = (id: string, body: string) => `<g id="${id}">
  ${body}
  ${label}
</g>`;

  if (product.category === "apparel") {
    if (noun.includes("tee")) {
      return wrap(
        "item-apparel-boxy-tee",
        `<path d="M248 166h144l34 42 86 34-42 96-58-20v160H228V318l-58 20-42-96 86-34 34-42Z" fill="${highlight}"/>
  <path d="M278 174c20 28 64 28 84 0" fill="none" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>
  <path d="M252 256h136M252 314h136M270 374h100" stroke="${accent}" stroke-width="17" stroke-linecap="round"/>
  <path d="M228 478h184M214 208l-52 44M426 208l52 44" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("cardigan")) {
      return wrap(
        "item-apparel-cardigan",
        `<path d="M220 170h200l42 70-50 42v200H228V282l-50-42 42-70Z" fill="${highlight}"/>
  <path d="M320 176v306M274 228h92M274 286h92M274 344h92" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
  <circle cx="322" cy="250" r="10" fill="${accent}"/><circle cx="322" cy="310" r="10" fill="${accent}"/><circle cx="322" cy="370" r="10" fill="${accent}"/>
  <path d="M228 482h184" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("hoodie")) {
      return wrap(
        "item-apparel-hoodie",
        `<path d="M250 192c26-58 114-58 140 0l48 56 54 22-44 96-40-16v132H232V350l-40 16-44-96 54-22 48-56Z" fill="${highlight}"/>
  <path d="M256 204c44 34 84 34 128 0M270 270h100" fill="none" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>
  <path d="M286 314c22 22 46 22 68 0v70h-68v-70Z" fill="${accent}" opacity="0.78"/>
  <path d="M270 228v64M370 228v64M232 482h176" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("skirt")) {
      return wrap(
        "item-apparel-skirt",
        `<path d="M236 178h168l-22 82H258l-22-82Z" fill="${ink}"/>
  <path d="M258 260h124l70 214H188l70-214Z" fill="${highlight}"/>
  <path d="M288 280l-22 178M320 280v178M352 280l22 178" stroke="${accent}" stroke-width="16" stroke-linecap="round" opacity="0.75"/>
  <path d="M220 458h200" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("jogger")) {
      return wrap(
        "item-apparel-jogger",
        `<path d="M248 172h144l22 306h-92l-2-188-2 188h-92l22-306Z" fill="${highlight}"/>
  <path d="M248 172h144M278 220h84M320 238v222M244 478h70M326 478h70" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>
  <path d="M278 296h42M330 296h42" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    return wrap(
      "item-apparel-overshirt",
      `<path d="M230 170h180l58 74-56 56v182H228V300l-56-56 58-74Z" fill="${highlight}"/>
  <path d="M320 174v308M246 248h50M344 248h50M264 324h112" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
  <path d="M250 190 320 248l70-58" fill="none" stroke="${accent}" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="320" cy="292" r="9" fill="${accent}"/><circle cx="320" cy="354" r="9" fill="${accent}"/>`
    );
  }

  if (product.category === "accessories") {
    if (noun.includes("charm")) {
      return wrap(
        "item-accessories-charm-set",
        `<path d="M196 214c78 58 170 58 248 0" fill="none" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>
  <circle cx="214" cy="326" r="48" fill="${highlight}" stroke="${ink}" stroke-width="15"/>
  <path d="m214 296 10 22 24 4-18 17 4 24-20-12-22 12 6-24-18-17 24-4 10-22Z" fill="${accent}"/>
  <rect x="286" y="284" width="68" height="88" rx="18" fill="${highlight}" stroke="${ink}" stroke-width="15"/>
  <circle cx="426" cy="326" r="48" fill="${highlight}" stroke="${ink}" stroke-width="15"/>
  <path d="M396 326h60M426 296v60" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("wristlet")) {
      return wrap(
        "item-accessories-phone-wristlet",
        `<rect x="214" y="156" width="190" height="326" rx="30" fill="${ink}"/>
  <rect x="238" y="194" width="142" height="234" rx="22" fill="${highlight}"/>
  <circle cx="310" cy="452" r="12" fill="${accent}"/>
  <path d="M404 222c90 18 90 132 4 152" fill="none" stroke="${accent}" stroke-width="24" stroke-linecap="round"/>
  <path d="M264 250h92M264 306h76" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("claw")) {
      return wrap(
        "item-accessories-hair-claw",
        `<path d="M204 210c76-42 156-42 232 0v190c-76 42-156 42-232 0V210Z" fill="${highlight}" stroke="${ink}" stroke-width="16"/>
  <path d="M236 234v150M278 214v192M320 206v208M362 214v192M404 234v150" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>
  <path d="M212 306h216" stroke="${accent}" stroke-width="22" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("belt")) {
      return wrap(
        "item-accessories-belt-bag",
        `<path d="M160 222c104-58 216-58 320 0" fill="none" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>
  <rect x="178" y="238" width="284" height="204" rx="44" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M230 304h180M246 362h148" stroke="${accent}" stroke-width="17" stroke-linecap="round"/>
  <rect x="290" y="220" width="60" height="34" rx="10" fill="${accent}" stroke="${ink}" stroke-width="12"/>`
      );
    }

    if (noun.includes("scarf")) {
      return wrap(
        "item-accessories-scarf",
        `<path d="M242 142c78 50 128 51 156 2 44 56 35 111-27 165l66 158-72 28-58-143-58 143-72-28 66-158c-62-54-71-109-1-167Z" fill="${highlight}"/>
  <path d="M228 204c54 44 122 48 183 0M254 302h108M300 348v130" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>
  <path d="M226 426l-36 16M414 426l36 16" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <path d="M258 372h80" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>`
      );
    }

    return wrap(
      "item-accessories-mini-tote",
      `<path d="M224 248c4-84 188-84 192 0" fill="none" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>
  <rect x="164" y="226" width="312" height="250" rx="34" fill="${highlight}"/>
  <path d="M194 286h252M212 350h216M242 414h156" stroke="${accent}" stroke-width="18" stroke-linecap="round" opacity="0.78"/>
  <circle cx="238" cy="258" r="16" fill="${ink}"/>
  <circle cx="402" cy="258" r="16" fill="${ink}"/>`
    );
  }

  if (product.category === "home") {
    if (noun.includes("lamp")) {
      return wrap(
        "item-home-lamp",
        `<path d="M236 160h168l56 148H180l56-148Z" fill="${highlight}"/>
  <path d="M216 308h208M320 308v132M256 472h128" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>
  <path d="M250 208h140M230 260h180" stroke="${accent}" stroke-width="16" stroke-linecap="round" opacity="0.8"/>
  <ellipse cx="320" cy="490" rx="112" ry="28" fill="${base}" opacity="0.72"/>`
      );
    }

    if (noun.includes("tray")) {
      return wrap(
        "item-home-ceramic-tray",
        `<ellipse cx="320" cy="350" rx="176" ry="92" fill="${highlight}" stroke="${ink}" stroke-width="18"/>
  <ellipse cx="320" cy="334" rx="118" ry="48" fill="${base}" opacity="0.45"/>
  <path d="M218 342c64 34 140 34 204 0" fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
  <circle cx="250" cy="322" r="18" fill="${accent}"/><circle cx="390" cy="372" r="18" fill="${accent}"/>`
      );
    }

    if (noun.includes("basket")) {
      return wrap(
        "item-home-shelf-basket",
        `<path d="M196 236h248l-28 226H224l-28-226Z" fill="${highlight}" stroke="${ink}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M230 236c10-70 170-70 180 0" fill="none" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>
  <path d="M226 294h188M218 354h204M246 246l-14 208M320 246v208M394 246l14 208" stroke="${accent}" stroke-width="14" stroke-linecap="round" opacity="0.78"/>`
      );
    }

    if (noun.includes("mug")) {
      return wrap(
        "item-home-mug-set",
        `<rect x="190" y="222" width="164" height="196" rx="34" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M354 272h32c50 0 50 96 0 96h-32" fill="none" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>
  <rect x="318" y="190" width="118" height="164" rx="30" fill="${base}" stroke="${ink}" stroke-width="15" opacity="0.92"/>
  <path d="M224 286h86M224 342h66M344 242h58" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("diffuser")) {
      return wrap(
        "item-home-ambient-diffuser",
        `<path d="M232 278h176l34 178H198l34-178Z" fill="${highlight}" stroke="${ink}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M258 236h124l26 42H232l26-42Z" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M278 206c-28-36 24-54 0-90M320 206c-28-36 24-54 0-90M362 206c-28-36 24-54 0-90" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
  <path d="M238 344h164M248 404h144" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>`
      );
    }

    return wrap(
      "item-home-throw-pillow",
      `<rect x="168" y="174" width="304" height="264" rx="48" fill="${highlight}"/>
  <path d="M216 226c62 30 146 30 208 0M214 386c67-33 145-33 212 0" stroke="${accent}" stroke-width="18" stroke-linecap="round" opacity="0.78"/>
  <path d="M168 304h304M320 174v264" stroke="${ink}" stroke-width="16" stroke-linecap="round" opacity="0.86"/>`
    );
  }

  if (product.category === "beauty") {
    if (noun.includes("lip")) {
      return wrap(
        "item-beauty-lip-tint",
        `<rect x="230" y="250" width="88" height="220" rx="28" fill="${highlight}" stroke="${ink}" stroke-width="16"/>
  <rect x="246" y="176" width="56" height="88" rx="16" fill="${ink}"/>
  <path d="M368 172c54 28 54 86 0 114-54-28-54-86 0-114Z" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M248 326h52M248 394h52" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("blush")) {
      return wrap(
        "item-beauty-cream-blush",
        `<circle cx="320" cy="322" r="132" fill="${highlight}" stroke="${ink}" stroke-width="18"/>
  <circle cx="320" cy="322" r="78" fill="${accent}" opacity="0.78"/>
  <path d="M232 238c58-42 118-42 176 0M250 408c46 34 94 34 140 0" stroke="#fffdf7" stroke-width="14" stroke-linecap="round" opacity="0.72"/>
  <rect x="226" y="456" width="188" height="28" rx="14" fill="${ink}"/>`
      );
    }

    if (noun.includes("mist")) {
      return wrap(
        "item-beauty-travel-mist",
        `<rect x="240" y="218" width="160" height="256" rx="34" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <rect x="274" y="166" width="92" height="60" rx="18" fill="${ink}"/>
  <path d="M366 184h78M444 184c34 20 34 54 0 74M444 184c52-10 70 48 18 66" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>
  <path d="M272 290h96M272 348h96" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("mask")) {
      return wrap(
        "item-beauty-sheet-mask-stack",
        `<rect x="198" y="178" width="244" height="300" rx="28" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <rect x="226" y="206" width="244" height="300" rx="28" fill="${base}" stroke="${ink}" stroke-width="15" opacity="0.95"/>
  <circle cx="302" cy="332" r="16" fill="${ink}"/><circle cx="394" cy="332" r="16" fill="${ink}"/>
  <path d="M320 396c26 18 56 18 82 0M304 260h88" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("brush")) {
      return wrap(
        "item-beauty-mini-brush-kit",
        `<path d="M204 198c44-42 96-42 140 0l-54 124h-32L204 198Z" fill="${highlight}" stroke="${ink}" stroke-width="16"/>
  <path d="M274 322v146" stroke="${ink}" stroke-width="24" stroke-linecap="round"/>
  <path d="M374 172h48v296h-48z" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M220 204c34 22 68 22 102 0M374 232h48" stroke="#fffdf7" stroke-width="12" stroke-linecap="round" opacity="0.7"/>`
      );
    }

    return wrap(
      "item-beauty-glow-balm",
      `<rect x="202" y="266" width="236" height="154" rx="42" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <rect x="230" y="210" width="180" height="72" rx="24" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M250 336h140M274 382h92" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>
  <path d="m444 190 14 38 38 14-38 14-14 38-14-38-38-14 38-14 14-38Z" fill="${highlight}" stroke="${ink}" stroke-width="10"/>`
    );
  }

  if (product.category === "gadgets") {
    if (noun.includes("charger")) {
      return wrap(
        "item-gadgets-portable-charger",
        `<rect x="190" y="190" width="260" height="292" rx="40" fill="${ink}"/>
  <rect x="222" y="230" width="196" height="200" rx="24" fill="${highlight}"/>
  <path d="M270 284h100M270 344h76" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <rect x="282" y="160" width="76" height="36" rx="12" fill="${accent}" stroke="${ink}" stroke-width="12"/>
  <circle cx="320" cy="456" r="13" fill="${accent}"/>`
      );
    }

    if (noun.includes("key light")) {
      return wrap(
        "item-gadgets-led-key-light",
        `<rect x="206" y="184" width="228" height="228" rx="46" fill="${ink}"/>
  <rect x="250" y="228" width="140" height="112" rx="24" fill="${highlight}"/>
  <path d="M280 268h80M280 310h58" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
  <circle cx="320" cy="376" r="16" fill="${accent}"/>
  <path d="M284 412h72l-10 36h-52l-10-36Z" fill="${ink}"/>
  <path d="m438 174 14 38 38 14-38 14-14 38-14-38-38-14 38-14 14-38Z" fill="${highlight}" opacity="0.9"/>`
      );
    }

    if (noun.includes("cable")) {
      return wrap(
        "item-gadgets-cable-taco",
        `<path d="M186 302c0-78 64-142 142-142s142 64 142 142c0 50-28 94-70 118H256c-42-24-70-68-70-118Z" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M238 306c42 34 138 34 180 0" fill="none" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <path d="M226 420c62 52 126 52 188 0M254 242h132" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>
  <circle cx="286" cy="360" r="15" fill="${ink}"/><circle cx="370" cy="360" r="15" fill="${ink}"/>`
      );
    }

    if (noun.includes("speaker")) {
      return wrap(
        "item-gadgets-mini-speaker",
        `<rect x="160" y="190" width="320" height="250" rx="42" fill="${highlight}" stroke="${ink}" stroke-width="15"/>
  <circle cx="266" cy="315" r="72" fill="${ink}"/>
  <circle cx="266" cy="315" r="38" fill="${accent}"/>
  <path d="M374 250h54M374 310h54M374 370h54" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("timer")) {
      return wrap(
        "item-gadgets-desk-timer",
        `<circle cx="320" cy="322" r="136" fill="${highlight}" stroke="${ink}" stroke-width="18"/>
  <rect x="282" y="148" width="76" height="40" rx="14" fill="${accent}" stroke="${ink}" stroke-width="12"/>
  <path d="M320 322V230M320 322l74 48" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>
  <path d="M232 322h34M374 322h34M320 234v34M320 376v34" stroke="${accent}" stroke-width="14" stroke-linecap="round"/>`
      );
    }

    return wrap(
      "item-gadgets-travel-adapter",
      `<rect x="196" y="190" width="248" height="250" rx="46" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M264 190v-46M376 190v-46" stroke="${ink}" stroke-width="22" stroke-linecap="round"/>
  <circle cx="286" cy="314" r="18" fill="${ink}"/><circle cx="354" cy="314" r="18" fill="${ink}"/>
  <path d="M276 380h88M238 244h164" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
  <rect x="236" y="430" width="168" height="38" rx="16" fill="${ink}"/>`
    );
  }

  if (product.category === "snacks") {
    if (noun.includes("mochi")) {
      return wrap(
        "item-snacks-mochi-box",
        `<rect x="170" y="224" width="300" height="226" rx="38" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <circle cx="248" cy="330" r="46" fill="${base}" stroke="${ink}" stroke-width="13"/>
  <circle cx="320" cy="330" r="46" fill="${accent}" stroke="${ink}" stroke-width="13"/>
  <circle cx="392" cy="330" r="46" fill="${base}" stroke="${ink}" stroke-width="13"/>
  <path d="M212 270h216M212 406h216" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("gummies")) {
      return wrap(
        "item-snacks-gummies",
        `<path d="M204 170h232l-24 314H228L204 170Z" fill="${highlight}" stroke="${ink}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M228 224h184" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>
  <circle cx="270" cy="328" r="28" fill="${accent}"/><circle cx="328" cy="372" r="28" fill="${base}"/><circle cx="384" cy="326" r="28" fill="${accent}"/>
  <path d="M238 170c24 26 56 26 80 0 24 26 56 26 80 0" fill="none" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>`
      );
    }

    if (noun.includes("crisp")) {
      return wrap(
        "item-snacks-crisp-mix",
        `<path d="M196 164h248l-24 326H220L196 164Z" fill="${highlight}" stroke="${ink}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M236 274h168M236 410h168" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>
  <path d="m270 326 34-22 34 22-34 22-34-22Zm80 52 28-18 28 18-28 18-28-18Z" fill="${accent}" stroke="${ink}" stroke-width="10" stroke-linejoin="round"/>`
      );
    }

    if (noun.includes("cookie")) {
      return wrap(
        "item-snacks-cookie-tin",
        `<ellipse cx="320" cy="230" rx="156" ry="58" fill="${accent}" stroke="${ink}" stroke-width="17"/>
  <path d="M164 230v170c0 32 70 58 156 58s156-26 156-58V230" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <ellipse cx="320" cy="400" rx="156" ry="58" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <circle cx="270" cy="344" r="22" fill="${base}"/><circle cx="332" cy="362" r="22" fill="${base}"/><circle cx="392" cy="334" r="22" fill="${base}"/>`
      );
    }

    if (noun.includes("candy")) {
      return wrap(
        "item-snacks-candy-flight",
        `<rect x="180" y="246" width="280" height="154" rx="34" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M180 300 126 260v126l54-40M460 300l54-40v126l-54-40" fill="${accent}" stroke="${ink}" stroke-width="15" stroke-linejoin="round"/>
  <path d="M224 296h192M242 350h156" stroke="${ink}" stroke-width="15" stroke-linecap="round"/>
  <circle cx="272" cy="430" r="22" fill="${base}"/><circle cx="320" cy="430" r="22" fill="${accent}"/><circle cx="368" cy="430" r="22" fill="${base}"/>`
      );
    }

    return wrap(
      "item-snacks-popcorn-trio",
      `<path d="M190 222h260l-26 260H216l-26-260Z" fill="${highlight}" stroke="${ink}" stroke-width="17" stroke-linejoin="round"/>
  <path d="M212 222c18-50 62-44 78 0 20-52 62-52 82 0 18-48 62-50 78 0" fill="${base}" stroke="${ink}" stroke-width="14"/>
  <path d="M246 288v150M320 288v150M394 288v150" stroke="${accent}" stroke-width="18" stroke-linecap="round"/>`
    );
  }

  if (noun.includes("thank")) {
    return wrap(
      "item-gifting-thank-you-kit",
      `<rect x="170" y="214" width="300" height="228" rx="32" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M202 286h236M202 358h236" stroke="${accent}" stroke-width="16" stroke-linecap="round"/>
  <path d="m320 184 24 50 54 8-39 38 9 54-48-26-48 26 9-54-39-38 54-8 24-50Z" fill="${base}" stroke="${ink}" stroke-width="12"/>`
    );
  }

  if (noun.includes("surprise")) {
    return wrap(
      "item-gifting-surprise-box",
      `<rect x="176" y="250" width="288" height="218" rx="28" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <rect x="144" y="202" width="352" height="74" rx="22" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M320 202v266M176 340h288" stroke="${ink}" stroke-width="17" stroke-linecap="round"/>
  <path d="m438 150 12 34 34 12-34 12-12 34-12-34-34-12 34-12 12-34Z" fill="${highlight}" stroke="${ink}" stroke-width="10"/>`
    );
  }

  if (noun.includes("care")) {
    return wrap(
      "item-gifting-care-package",
      `<rect x="166" y="238" width="308" height="214" rx="30" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M166 300h308M320 238v214" stroke="${ink}" stroke-width="16" stroke-linecap="round"/>
  <path d="M268 190c-42-44-100-8-80 38 16 38 76 24 132-26 56 50 116 64 132 26 20-46-38-82-80-38" fill="${base}" stroke="${ink}" stroke-width="13" stroke-linejoin="round"/>
  <path d="M224 380h70M346 380h70" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>`
    );
  }

  if (noun.includes("mascot")) {
    return wrap(
      "item-gifting-desk-mascot",
      `<circle cx="320" cy="314" r="118" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <path d="M242 226 208 166l78 24M398 226l34-60-78 24" fill="${highlight}" stroke="${ink}" stroke-width="15" stroke-linejoin="round"/>
  <circle cx="280" cy="310" r="14" fill="${ink}"/><circle cx="360" cy="310" r="14" fill="${ink}"/>
  <path d="M288 370c22 20 42 20 64 0" fill="none" stroke="${accent}" stroke-width="15" stroke-linecap="round"/>
  <rect x="242" y="430" width="156" height="38" rx="19" fill="${ink}"/>`
    );
  }

  return wrap(
    "item-gifting-birthday-bundle",
    `<rect x="154" y="250" width="332" height="232" rx="28" fill="${highlight}" stroke="${ink}" stroke-width="17"/>
  <rect x="132" y="202" width="376" height="82" rx="24" fill="${accent}" stroke="${ink}" stroke-width="15"/>
  <path d="M320 202v280M154 330h332" stroke="${ink}" stroke-width="18" stroke-linecap="round"/>
  <path d="M282 202c-48-72-130-48-108 14 16 45 84 27 146-14Zm76 0c48-72 130-48 108 14-16 45-84 27-146-14Z" fill="${base}" opacity="0.9" stroke="${ink}" stroke-width="10"/>`
  );
}

function svgDataUri(product: {
  sku: string;
  name: string;
  noun: string;
  brand: string;
  category: ProductCategory;
  palette: Palette;
}) {
  const [base, accent, highlight] = product.palette.colors;
  const safeName = escapeXmlText(product.name);
  const safeNoun = escapeXmlText(product.noun);
  const safeDescription = escapeXmlText(
    `${product.brand} ${product.category} product artwork for Vibe Mall.`
  );
  const safeSku = escapeXmlText(product.sku);
  const artwork = itemArtwork({
    category: product.category,
    noun: product.noun,
    palette: product.palette,
    safeNoun,
    safeSku
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640" role="img" aria-labelledby="title desc">
  <title id="title">${safeName}</title>
  <desc id="desc">${safeDescription}</desc>
  <defs>
    <filter id="popShadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="18" stdDeviation="16" flood-color="#151515" flood-opacity="0.32"/>
    </filter>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="0" stdDeviation="18" flood-color="${accent}" flood-opacity="0.48"/>
    </filter>
    <linearGradient id="stageSheen" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.98"/>
      <stop offset="0.48" stop-color="#fff8df" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${highlight}" stop-opacity="0.42"/>
    </linearGradient>
    <radialGradient id="burst" cx="50%" cy="42%" r="62%">
      <stop offset="0" stop-color="${highlight}" stop-opacity="0.72"/>
      <stop offset="0.58" stop-color="${base}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${base}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="640" height="640" rx="48" fill="#151515"/>
  <rect x="18" y="18" width="604" height="604" rx="44" fill="${base}"/>
  <circle cx="506" cy="124" r="124" fill="${accent}" opacity="0.94" filter="url(#softGlow)"/>
  <circle cx="124" cy="506" r="154" fill="${highlight}" opacity="0.82"/>
  <path d="M92 122h456M62 476h516M166 76 76 178M548 462l-86 100" stroke="#fffdf7" stroke-width="18" stroke-linecap="round" opacity="0.42"/>
  <rect x="70" y="70" width="500" height="500" rx="48" fill="url(#stageSheen)" stroke="#151515" stroke-width="10"/>
  <circle cx="320" cy="308" r="222" fill="url(#burst)"/>
  <g filter="url(#popShadow)">
    ${artwork}
  </g>
  <path d="M120 118h110M120 150h66M474 508h48" stroke="#ffffff" stroke-width="16" stroke-linecap="round" opacity="0.72"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function priceFor(index: number, category: ProductCategory) {
  const categoryBase: Record<ProductCategory, number> = {
    apparel: 24,
    accessories: 12,
    home: 18,
    beauty: 9,
    gadgets: 16,
    snacks: 5,
    gifting: 14
  };

  return Number((categoryBase[category] + ((index * 7) % 55) + 0.99).toFixed(2));
}

function buildTags(input: {
  category: ProductCategory;
  mood: string;
  style: string;
  occasion: string;
  material: string;
  intent: string;
  socialVibe: string;
  palette: Palette;
}) {
  return Array.from(
    new Set([
      input.category,
      input.mood,
      input.style,
      input.occasion,
      input.material,
      input.intent,
      input.socialVibe,
      input.palette.name,
      ...input.palette.labels
    ])
  );
}

export function hashDemoPassword(password = DEMO_USER_PASSWORD, email = DEMO_USER_EMAIL) {
  return hashPassword(password, {
    salt: `vibe-mall-demo-user:${email}`
  });
}

export function buildSeedProducts(productsPerCategory = 60): Omit<Product, "_id">[] {
  return categoryConfigs.flatMap((config, categoryIndex) =>
    Array.from({ length: productsPerCategory }, (_, itemIndex) => {
      const globalIndex = categoryIndex * productsPerCategory + itemIndex;
      const palette = pick(palettes, globalIndex, categoryIndex);
      const mood = pick(moods, globalIndex);
      const style = pick(styles, globalIndex, categoryIndex);
      const occasion = pick(occasions, globalIndex, itemIndex);
      const socialVibe = pick(socialVibes, globalIndex, categoryIndex * 2);
      const material = pick(config.materials, itemIndex, categoryIndex);
      const intent = pick(config.intents, itemIndex, globalIndex);
      const noun = pick(config.nouns, itemIndex, categoryIndex);
      const brand = pick(config.brands, itemIndex, globalIndex);
      const demoChip = demoChipForIndex(globalIndex);
      const sku = `VM-${config.skuPrefix}-${String(itemIndex + 1).padStart(3, "0")}`;
      const name = `${titleCase(demoChip.namePrefix)} ${titleCase(noun)}`;
      const baseTags = buildTags({
        category: config.category,
        mood,
        style,
        occasion,
        material,
        intent,
        socialVibe,
        palette
      });
      const tags = Array.from(new Set([...baseTags, ...demoChip.tags]));
      const searchText = [
        `${config.category} product from ${brand}: ${name}`,
        `Mood: ${mood}`,
        `Style: ${style}`,
        `Occasion: ${occasion}`,
        `Materials and finish: ${material}`,
        `Colors: ${palette.labels.join(", ")} in the ${palette.name} palette`,
        `Customer intent: ${intent}`,
        `Social vibe: ${socialVibe}`,
        `Suggested chip match: ${demoChip.vibe}`,
        `Suggested chip related terms: ${demoChip.searchPhrases.join(", ")}`,
        `Useful for shoppers searching by vibe, theme, occasion, color story, room aesthetic, outfit idea, snack craving, or gift recipient`,
        `Tags: ${tags.join(", ")}`
      ].join(". ");

      return {
        sku,
        name,
        brand,
        category: config.category,
        price: priceFor(globalIndex, config.category),
        palette: palette.colors,
        imageDataUri: svgDataUri({
          sku,
          name,
          noun,
          brand,
          category: config.category,
          palette
        }),
        tags,
        searchText,
        active: true,
        createdAt: CREATED_AT
      };
    })
  );
}

export function seedDataFingerprint(products: Pick<Product, "sku" | "searchText">[]) {
  return createHash("sha256")
    .update(products.map((product) => `${product.sku}:${product.searchText}`).join("\n"))
    .digest("hex");
}
