/**
 * Expands skin catalog to TARGET total entries.
 * Run: node scripts/expand-skin-catalog.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const TARGET = 1500;

const CATEGORIES = [
  "popular",
  "boys",
  "girls",
  "anime",
  "games",
  "movies",
  "superheroes",
  "pvp",
  "medieval",
  "fashion",
  "animals",
  "horror",
  "memes",
];

const POOLS = {
  popular: [
    "Nova", "Pixel", "Craft", "Block", "Cube", "Miner", "Diamond", "Emerald",
    "Nether", "End", "Sky", "Cloud", "Storm", "Blaze", "Frost", "Shadow",
    "Light", "Star", "Moon", "Sun", "Fire", "Ice", "Wind", "Thunder",
  ],
  boys: [
    "Knight", "Warrior", "Hunter", "Ranger", "Scout", "Pilot", "Ace", "Max",
    "Leo", "Kai", "Ray", "Zed", "Fox", "Wolf", "Bear", "Hawk", "Rex", "Jet",
  ],
  girls: [
    "Luna", "Rose", "Mia", "Zoe", "Lily", "Aria", "Nova", "Ivy", "Ruby",
    "Pearl", "Sky", "Star", "Fae", "Ella", "Nora", "Maya", "Sage", "Wren",
  ],
  anime: [
    "Naruto", "Sasuke", "Goku", "Luffy", "Ichigo", "Eren", "Levi", "Zenitsu",
    "Tanjiro", "Deku", "Bakugo", "Saitama", "Light", "Itachi", "Kakashi",
    "Sukuna", "Gojo", "Megumi", "Yuji", "Nezuko", "Rem", "Asuna", "Kirito",
  ],
  games: [
    "Steve", "Alex", "Master", "Chief", "Link", "Zelda", "Mario", "Luigi",
    "Kratos", "Geralt", "Cloud", "Sephiroth", "Sonic", "Kirby", "Samus",
    "Doom", "Vault", "Creeper", "Ender", "Portal", "Craft", "Pixel", "Block",
  ],
  movies: [
    "Neo", "Trinity", "Morpheus", "Luke", "Vader", "Yoda", "Han", "Leia",
    "Frodo", "Gandalf", "Aragorn", "Legolas", "Gimli", "Bilbo", "Thorin",
    "Iron", "Cap", "Thor", "Hulk", "Widow", "Hawkeye", "Strange", "Panther",
  ],
  superheroes: [
    "Batman", "Superman", "Flash", "Wonder", "Aquaman", "Robin", "Night",
    "Green", "Arrow", "Ant", "Spider", "Deadpool", "Wolverine", "Cyclops",
  ],
  pvp: [
    "PvP", "Combo", "Crit", "Strafe", "Block", "Hit", "Tap", "Wtap", "Sprint",
    "Rod", "Pearl", "Crystal", "Anchor", "Totem", "Sword", "Axe", "Bow",
  ],
  medieval: [
    "King", "Queen", "Prince", "Princess", "Duke", "Baron", "Squire", "Page",
    "Paladin", "Crusader", "Templar", "Samurai", "Ninja", "Ronin", "Shogun",
    "Viking", "Berserker", "Gladiator", "Centurion", "Legion", "Archer",
  ],
  fashion: [
    "Vogue", "Chic", "Luxe", "Silk", "Velvet", "Satin", "Denim", "Urban",
    "Street", "Retro", "Neon", "Pastel", "Gold", "Silver", "Crystal", "Pearl",
  ],
  animals: [
    "Cat", "Dog", "Fox", "Wolf", "Bear", "Panda", "Tiger", "Lion", "Eagle",
    "Owl", "Raven", "Shark", "Whale", "Dolphin", "Penguin", "Koala", "Bunny",
  ],
  horror: [
    "Ghost", "Spirit", "Phantom", "Wraith", "Specter", "Zombie", "Skeleton",
    "Vampire", "Werewolf", "Demon", "Devil", "Reaper", "Horror", "Nightmare",
  ],
  memes: [
    "Meme", "Troll", "Pepe", "Doge", "Sus", "Amogus", "Skibidi", "Sigma",
    "Gigachad", "Based", "Cringe", "Bruh", "Yeet", "Pog", "Mood", "Vibe",
  ],
};

const SUFFIXES = [
  "MC", "Craft", "Play", "Pro", "HD", "X", "YT", "TV", "Fan", "King",
  "Lord", "Master", "God", "Star", "One", "Two", "Real", "True", "Ultra",
  "Mega", "Super", "Mini", "Neo", "Alt", "V2", "V3", "Live", "Game",
];

function parseExisting() {
  const src = readFileSync(join(root, "shared/skin-catalog.ts"), "utf8");
  const re = /skin\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)",\s*"([^"]+)"\)/g;
  const items = [];
  let m;
  while ((m = re.exec(src)) !== null) {
    items.push({ id: m[1], name: m[2], username: m[3], category: m[4] });
  }
  return items;
}

function validUsername(name) {
  const u = name.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16);
  return u.length >= 3 ? u : null;
}

function generateExtra(existing) {
  const usedIds = new Set(existing.map((s) => s.id));
  const usedNames = new Set(existing.map((s) => s.username.toLowerCase()));
  const extra = [];
  let n = 0;

  while (existing.length + extra.length < TARGET) {
    for (const category of CATEGORIES) {
      if (existing.length + extra.length >= TARGET) break;

      const pool = POOLS[category];
      const base = pool[n % pool.length];
      const suffix = SUFFIXES[Math.floor(n / pool.length) % SUFFIXES.length];
      const num = String(1000 + n).slice(-3);
      const display = `${base} ${suffix} ${num}`.trim();
      let username = validUsername(`${base}${suffix}${num}`);
      if (!username) username = validUsername(`${base}${num}`);
      if (!username || usedNames.has(username.toLowerCase())) {
        n++;
        continue;
      }

      const id = `gen_${category.slice(0, 2)}_${String(extra.length + 1).padStart(4, "0")}`;
      if (usedIds.has(id)) {
        n++;
        continue;
      }

      usedIds.add(id);
      usedNames.add(username.toLowerCase());
      extra.push({ id, name: display, username, category });
      n++;
    }
  }

  return extra;
}

function emit(extra) {
  const lines = [
    `import type { SkinCategory, SkinItem } from "./skins";`,
    ``,
    `const skin = (`,
    `  id: string,`,
    `  name: string,`,
    `  username: string,`,
    `  category: SkinCategory,`,
    `): SkinItem => ({ id, name, username, category });`,
    ``,
    `/** Auto-generated — ${extra.length} extra skins (total catalog target: ${TARGET}) */`,
    `export const SKIN_CATALOG_GENERATED: SkinItem[] = [`,
  ];

  let lastCat = "";
  for (const s of extra) {
    if (s.category !== lastCat) {
      lines.push(`  // ── ${s.category} ──`);
      lastCat = s.category;
    }
    const esc = (v) => v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    lines.push(
      `  skin("${esc(s.id)}", "${esc(s.name)}", "${esc(s.username)}", "${s.category}"),`,
    );
  }
  lines.push(`];`, ``);
  return lines.join("\n");
}

const existing = parseExisting();
console.log(`Existing skins: ${existing.length}`);
const extra = generateExtra(existing);
console.log(`Generated extra: ${extra.length}`);
console.log(`Total: ${existing.length + extra.length}`);

const out = join(root, "shared/skin-catalog-generated.ts");
writeFileSync(out, emit(extra), "utf8");
console.log(`Wrote ${out}`);
