export type AccentColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "rgb";

export type Theme = "light" | "dark";

export type Resolution = "fullscreen" | "maximized" | "windowed";

export type ProxyMode = "none" | "system" | "custom";

export type DownloadMirror = "auto" | "europe" | "cis";

export type StreamerMode = "show" | "hide";

export type HomeBackgroundPreset =
  | "copper"
  | "nether"
  | "end"
  | "ocean"
  | "forest"
  | "sunset"
  | "aurora"
  | "voxel"
  | "none";

export type UiRoundness = "sharp" | "default" | "round";

export type GlassShimmerScope = "all" | "cards";

export type ScrollbarStyle = "default" | "thin" | "hidden";

export type ContentSpacing = "tight" | "normal" | "relaxed";

export type AccountType = "nuvoxel" | "microsoft" | "local";

export interface Account {
  id: string;
  username: string;
  type: AccountType;
  nuvoxelUserId?: string;
  coverUrl?: string | null;
}

export type SettingsSection =
  | "general"
  | "appearance"
  | "launch"
  | "connections"
  | "about";

export type ModsTab = "my" | "catalog";

export type CatalogKind = "modpacks" | "mods" | "resourcepacks" | "shaders";

export type VersionFilter = "all" | "release" | "snapshot" | "legacy" | "mods" | "packs";

export type AppLocale = "ru" | "uk" | "en";

export interface GameServer {
  id: string;
  name: string;
  address: string;
  port: number;
  favorite: boolean;
}

export type AddAccountView = "select" | "nuvoxel-login";

export type AccountsTab = "cabinet" | "character" | "achievements";

export type NavPage = "home" | "mods" | "servers" | "accounts" | "settings";

export const ACCENT_COLORS: Record<
  AccentColor,
  { hex: string; hover: string }
> = {
  red: { hex: "#ef4444", hover: "#dc2626" },
  orange: { hex: "#d4893a", hover: "#b87333" },
  yellow: { hex: "#eab308", hover: "#ca8a04" },
  green: { hex: "#22c55e", hover: "#16a34a" },
  cyan: { hex: "#06b6d4", hover: "#0891b2" },
  blue: { hex: "#3b82f6", hover: "#2563eb" },
  purple: { hex: "#a855f7", hover: "#9333ea" },
  pink: { hex: "#ec4899", hover: "#db2777" },
  rgb: { hex: "#a855f7", hover: "#9333ea" }, // Fallback
};

export const FONT_SIZES = [12, 14, 16, 18] as const;

export const MEMORY_MARKS = [
  { gb: 2, mb: 2048 },
  { gb: 4, mb: 4096 },
  { gb: 8, mb: 8192 },
  { gb: 12, mb: 12288 },
  { gb: 16, mb: 16384 },
  { gb: 20, mb: 20480 },
  { gb: 24, mb: 24576 },
];

export const LOW_END_MEMORY_MARKS = [
  { gb: 1, mb: 1024 },
  { gb: 2, mb: 2048 },
  { gb: 4, mb: 4096 },
];
