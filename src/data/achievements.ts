import type { AchievementDefinition } from "../types/achievements";

export const ACHIEVEMENT_CATEGORIES = [
  "all",
  "friends",
  "hours",
  "loaders",
  "mods",
  "skins",
  "servers",
  "launcher",
] as const;

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Friends
  { id: "friend_first", category: "friends", icon: "🤝", titleKey: "achFriendFirst", descKey: "achFriendFirstDesc" },
  { id: "friend_5", category: "friends", icon: "👥", titleKey: "achFriend5", descKey: "achFriend5Desc" },
  { id: "friend_25", category: "friends", icon: "🎉", titleKey: "achFriend25", descKey: "achFriend25Desc" },
  { id: "friend_party", category: "friends", icon: "🥳", titleKey: "achFriendParty", descKey: "achFriendPartyDesc" },

  // Launcher
  { id: "curious", category: "launcher", icon: "🔍", titleKey: "achCurious", descKey: "achCuriousDesc" },
  { id: "fine_tune", category: "launcher", icon: "⚙️", titleKey: "achFineTune", descKey: "achFineTuneDesc" },
  { id: "aesthetic", category: "launcher", icon: "🎯", titleKey: "achAesthetic", descKey: "achAestheticDesc" },
  { id: "early_bird", category: "launcher", icon: "🐦", titleKey: "achEarlyBird", descKey: "achEarlyBirdDesc" },
  { id: "registered", category: "launcher", icon: "📝", titleKey: "achRegistered", descKey: "achRegisteredDesc" },
  { id: "loyal_7", category: "launcher", icon: "📅", titleKey: "achLoyal7", descKey: "achLoyal7Desc" },
  { id: "member_30", category: "launcher", icon: "🌙", titleKey: "achMember30", descKey: "achMember30Desc" },
  { id: "veteran_365", category: "launcher", icon: "🏅", titleKey: "achVeteran365", descKey: "achVeteran365Desc" },

  // Loaders
  { id: "hello_world", category: "loaders", icon: "👋", titleKey: "achHelloWorld", descKey: "achHelloWorldDesc" },
  { id: "vanilla_10", category: "loaders", icon: "🟩", titleKey: "achVanilla10", descKey: "achVanilla10Desc" },
  { id: "fabric_first", category: "loaders", icon: "🧵", titleKey: "achFabricFirst", descKey: "achFabricFirstDesc" },
  { id: "forge_first", category: "loaders", icon: "🔨", titleKey: "achForgeFirst", descKey: "achForgeFirstDesc" },
  { id: "neoforge_first", category: "loaders", icon: "🛠️", titleKey: "achNeoForgeFirst", descKey: "achNeoForgeFirstDesc" },
  { id: "polyglot", category: "loaders", icon: "🎭", titleKey: "achPolyglot", descKey: "achPolyglotDesc" },
  { id: "optimist", category: "loaders", icon: "✨", titleKey: "achOptimist", descKey: "achOptimistDesc" },

  // Mods
  { id: "mod_first", category: "mods", icon: "📦", titleKey: "achModFirst", descKey: "achModFirstDesc" },
  { id: "mod_10", category: "mods", icon: "🤖", titleKey: "achMod10", descKey: "achMod10Desc" },
  { id: "mod_50", category: "mods", icon: "💾", titleKey: "achMod50", descKey: "achMod50Desc" },
  { id: "mod_100", category: "mods", icon: "🏋️", titleKey: "achMod100", descKey: "achMod100Desc" },
  { id: "modpack_first", category: "mods", icon: "🎁", titleKey: "achModpackFirst", descKey: "achModpackFirstDesc" },
  { id: "modpack_5", category: "mods", icon: "🍱", titleKey: "achModpack5", descKey: "achModpack5Desc" },

  // Hours
  { id: "play_1h", category: "hours", icon: "⏱️", titleKey: "achPlay1h", descKey: "achPlay1hDesc" },
  { id: "play_10h", category: "hours", icon: "⏰", titleKey: "achPlay10h", descKey: "achPlay10hDesc" },
  { id: "play_100h", category: "hours", icon: "🕐", titleKey: "achPlay100h", descKey: "achPlay100hDesc" },
  { id: "play_500h", category: "hours", icon: "⏳", titleKey: "achPlay500h", descKey: "achPlay500hDesc" },
  { id: "play_1000h", category: "hours", icon: "💎", titleKey: "achPlay1000h", descKey: "achPlay1000hDesc" },
  { id: "play_5000h", category: "hours", icon: "🏆", titleKey: "achPlay5000h", descKey: "achPlay5000hDesc" },

  // Servers
  { id: "server_first", category: "servers", icon: "🚪", titleKey: "achServerFirst", descKey: "achServerFirstDesc" },
  { id: "server_10_same", category: "servers", icon: "🏠", titleKey: "achServer10Same", descKey: "achServer10SameDesc" },
  { id: "server_5_unique", category: "servers", icon: "🧭", titleKey: "achServer5Unique", descKey: "achServer5UniqueDesc" },
  { id: "server_25_unique", category: "servers", icon: "🌍", titleKey: "achServer25Unique", descKey: "achServer25UniqueDesc" },

  // Skins
  { id: "skin_first", category: "skins", icon: "🎨", titleKey: "achSkinFirst", descKey: "achSkinFirstDesc" },
  { id: "skin_slim", category: "skins", icon: "👤", titleKey: "achSkinSlim", descKey: "achSkinSlimDesc" },
  { id: "skin_5", category: "skins", icon: "👕", titleKey: "achSkin5", descKey: "achSkin5Desc" },
  { id: "cape_first", category: "skins", icon: "🦸", titleKey: "achCapeFirst", descKey: "achCapeFirstDesc" },
  { id: "skin_4k", category: "skins", icon: "🖼️", titleKey: "achSkin4k", descKey: "achSkin4kDesc" },
  { id: "cape_animated", category: "skins", icon: "🎬", titleKey: "achCapeAnimated", descKey: "achCapeAnimatedDesc" },
];

export const ALL_NAV_TABS = ["/", "/mods", "/servers", "/accounts", "/settings"];
