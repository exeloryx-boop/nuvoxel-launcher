import { create } from "zustand";
import { persist } from "zustand/middleware";
import { t } from "../i18n";
import type {
  AccentColor,
  Account,
  AccountsTab,
  AddAccountView,
  AppLocale,
  CatalogKind,
  DownloadMirror,
  GameServer,
  HomeBackgroundPreset,
  ModsTab,
  ProxyMode,
  Resolution,
  SettingsSection,
  StreamerMode,
  Theme,
  UiRoundness,
  GlassShimmerScope,
  ScrollbarStyle,
  ContentSpacing,
  VersionFilter,
} from "../types";
import type { CatalogItem, LaunchHistoryEntry, ModLoader, ModPack, PackMod, PackFileEntry, CatalogSource, InstallFromCatalogOptions, AddModToPackOptions } from "../types/mods";
import {
  findModDownload,
  getLatestModrinthVersion,
  getModrinthVersionDownload,
  mapModrinthLoader,
} from "../services/modrinth";
import { installModrinthModpack } from "../services/modpackInstall";
import {
  findCurseForgeDownload,
  getCurseForgeFileDownload,
  getLatestCurseForgeFile,
  getCurseForgeFile,
  mapCurseForgeLoader,
} from "../services/curseforge";
import { checkModUpdate, packCompatibleWithInstall } from "../services/modUpdates";
import {
  getCapeById,
  loadSelectedSkin,
  saveSelectedSkin,
  SKIN_STORAGE_KEY,
  type SelectedSkin,
  type SkinModel,
} from "@shared/skins";
import { launchMinecraft } from "../services/minecraftLaunch";
import {
  fetchFriends,
  fetchMe,
  handleSocialApiError,
  loginNuvoxelAccount,
  registerNuvoxelAccount,
  removeFriend as removeFriendApi,
  sessionFromAuth,
} from "../services/nuvoxelApi";
import { SocialApiError } from "../types/social";
import type { FriendProfile, NuvoxelSession } from "../types/social";
import { loginErrorToast, registerErrorToast } from "../utils/socialErrors";
import { LEGACY_ACCOUNT_TYPE, LEGACY_USER_ID_FIELD } from "../utils/legacyStorageKeys";
import { LANG_CHANGE_EVENT, STORE_KEY } from "../utils/storageMigration";
import {
  applyLauncherWindowBehavior,
  syncAchievements,
} from "./achievementSync";
import {
  DEFAULT_ACHIEVEMENT_STATS,
  type AchievementStats,
  type LauncherBehavior,
} from "../types/achievements";

const pendingModAdds = new Set<string>();
const pendingModImports = new Set<string>();
const pendingCatalogInstalls = new Set<string>();

function pickMcVersion(versions: string[], fallback = "1.21.4"): string {
  return (
    versions.find((v) => /^\d+\.\d+/.test(v)) ?? versions[0] ?? fallback
  );
}
import {
  buildModDestPath,
  buildResourcepackDestPath,
  buildShaderDestPath,
  copyModFile,
  copyPackFile,
  copyPackFolder,
  deleteModFile,
  deletePackFolder,
  downloadModFile,
  filenameFromPath,
  folderNameFromPath,
  listModFiles,
  listPackAssets,
  localModDisplayName,
  normalizeAssetKey,
  normalizeModFilename,
  normalizeModPath,
  pathIsDirectory,
} from "../services/modInstall";
import { getPackInstanceDir, getPackModsDir, getPackResourcepacksDir, getPackShaderpacksDir } from "../utils/packPaths";
import { isJavaLaunchError } from "../utils/javaErrors";
import { resolveLaunchProfile } from "../utils/launchProfile";
import { resetCurseForgeAvailabilityCache } from "../services/curseforge";
import {
  getLocaleTag,
  readStoredLanguage,
  setI18nLocale,
  translateLaunchError,
  type LaunchProgressPayload,
  type Locale,
} from "../i18n";

function dedupePackMods(pack: ModPack): ModPack {
  const seen = new Set<string>();
  const mods = (pack.mods ?? []).filter((m) => {
    const key = normalizeModFilename(m.filename);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (mods.length === (pack.mods?.length ?? 0)) return pack;
  return { ...pack, mods, modCount: mods.length };
}

function dedupeModPacks(packs: ModPack[]): ModPack[] {
  return packs.map(dedupePackMods);
}

function packsNeedDedupe(packs: ModPack[]): boolean {
  return packs.some((p) => dedupePackMods(p) !== p);
}

function modListsMatch(a: PackMod[], b: PackMod[]): boolean {
  if (a.length !== b.length) return false;
  const namesA = a.map((m) => normalizeModFilename(m.filename)).sort();
  const namesB = b.map((m) => normalizeModFilename(m.filename)).sort();
  return namesA.every((name, i) => name === namesB[i]);
}

function assetListsMatch(a: PackFileEntry[], b: PackFileEntry[]): boolean {
  if (a.length !== b.length) return false;
  const keysA = a.map((entry) => normalizeAssetKey(entry.filename)).sort();
  const keysB = b.map((entry) => normalizeAssetKey(entry.filename)).sort();
  return keysA.every((key, i) => key === keysB[i]);
}

export type PackAssetKind = "resourcepack" | "shader";

function sessionForAccount(
  accounts: Account[],
  accountId: string,
  sessions: Record<string, NuvoxelSession>,
): NuvoxelSession | null {
  const account = accounts.find((a) => a.id === accountId);
  if (account?.type === "nuvoxel" && account.nuvoxelUserId) {
    return sessions[account.nuvoxelUserId] ?? null;
  }
  return null;
}

function saveNuvoxelSession(
  sessions: Record<string, NuvoxelSession>,
  session: NuvoxelSession,
): Record<string, NuvoxelSession> {
  return { ...sessions, [session.userId]: session };
}

interface AppState {
  accounts: Account[];
  activeAccountId: string;
  minecraftVersion: string;

  modPacks: ModPack[];
  activeModPackId: string | null;
  versionPickerLoader: ModLoader;
  versionFilter: VersionFilter;
  launchHistory: LaunchHistoryEntry[];
  lastLaunchByVersion: Record<string, string>;

  theme: Theme;
  systemTheme: boolean;
  accentColor: AccentColor;
  fontSize: number;
  streamerMode: StreamerMode;

  homeBackgroundEnabled: boolean;
  homeBlurPercent: number;
  homeDimPercent: number;
  homeBackgroundPreset: HomeBackgroundPreset;
  sidebarCompact: boolean;
  sidebarGlow: boolean;
  reduceMotion: boolean;
  uiAnimations: boolean;
  pageTransitions: boolean;
  openAnimations: boolean;
  keyboardShortcuts: boolean;
  glassShimmer: boolean;
  glassShimmerSpeed: number;
  glassShimmerIntensity: number;
  glassShimmerScope: GlassShimmerScope;
  hoverEffects: boolean;
  accentPulse: boolean;
  buttonGlowEffects: boolean;
  cardShadowIntensity: number;
  sidebarTransparency: number;
  panelBorderGlow: boolean;
  scrollbarStyle: ScrollbarStyle;
  contentSpacing: ContentSpacing;
  uiRoundness: UiRoundness;
  interfaceScale: number;
  glassIntensity: number;
  showHomeStats: boolean;
  showLauncherTips: boolean;

  confirmBeforeLaunch: boolean;
  quickLaunchDoubleClick: boolean;
  retroSoundsEnabled: boolean;
  compactLists: boolean;
  copyVersionOnClick: boolean;

  language: AppLocale;
  launcherBehavior: LauncherBehavior;
  showSkins: boolean;
  logging: boolean;
  devMode: boolean;
  lowEndMode: boolean;
  curseforgeApiKey: string;
  autoPlayOnServerAdd: boolean;

  achievementStats: AchievementStats;
  unlockedAchievements: Record<string, number>;

  memoryMb: number;
  resolution: Resolution;
  gameDirectory: string;
  integrityCheck: boolean;
  executablePath: string;
  jvmParams: string;

  proxy: ProxyMode;
  simultaneousDownloads: 2 | 3 | 6 | 10 | 16;
  downloadMirror: DownloadMirror;
  sslCheck: boolean;

  settingsSection: SettingsSection;
  modsTab: ModsTab;
  catalogKind: CatalogKind;
  catalogSource: CatalogSource;
  accountsTab: AccountsTab;
  showAddAccountModal: boolean;
  addAccountView: AddAccountView;
  showAccountSwitcher: boolean;
  showCreatePackModal: boolean;
  showVersionPicker: boolean;
  showNuvoxelLogin: boolean;
  isPlaying: boolean;
  gameRunning: boolean;
  gameVersion: string;
  toastMessage: string | null;
  launchProgress: LaunchProgressPayload | null;
  selectedSkin: SelectedSkin | null;

  servers: GameServer[];
  activeServerId: string | null;

  nuvoxelSession: NuvoxelSession | null;
  nuvoxelSessions: Record<string, NuvoxelSession>;
  friends: FriendProfile[];
  localFriends: FriendProfile[];
  socialApiUrl: string;
  socialApiOnline: boolean;
  showAddFriendModal: boolean;
  showChatModal: boolean;
  showJavaPathModal: boolean;
  javaPathModalError: string | null;
  javaPathRetryPackId: string | null;

  addLocalFriend: (nameOrCode: string) => boolean;
  removeLocalFriend: (friendId: string) => void;

  setGameRunning: (running: boolean) => void;
  setSocialApiOnline: (online: boolean) => void;
  invalidateNuvoxelSession: () => void;

  setActiveAccount: (id: string) => void;
  addLocalAccount: (username: string) => void;
  removeAccount: (id: string) => void;
  updateAccountUsername: (id: string, username: string) => void;
  updateAccountCover: (id: string, coverUrl: string | null) => void;
  refreshAccountData: (id: string) => Promise<boolean>;
  logoutAccount: (id: string) => void;
  setMinecraftVersion: (version: string) => void;
  setVersionPickerLoader: (loader: ModLoader) => void;
  setVersionFilter: (f: VersionFilter) => void;
  createModPack: (data: {
    name: string;
    minecraftVersion: string;
    loader: ModLoader;
  }) => string;
  removeModPack: (id: string) => Promise<void>;
  setActiveModPack: (id: string | null) => void;
  addModToPack: (
    packId: string,
    item: CatalogItem,
    options?: AddModToPackOptions,
  ) => Promise<boolean>;
  importModFilesToPack: (packId: string, sourcePaths: string[]) => Promise<number>;
  importPackAssetsToPack: (
    packId: string,
    sourcePaths: string[],
    kind: PackAssetKind,
  ) => Promise<number>;
  syncPackModsFromDisk: (packId: string) => Promise<void>;
  syncPackAssetsFromDisk: (packId: string) => Promise<void>;
  syncPackContentFromDisk: (packId: string) => Promise<void>;
  removeModFromPack: (packId: string, modId: string) => Promise<void>;
  removePackAssetFromPack: (
    packId: string,
    assetId: string,
    kind: PackAssetKind,
  ) => Promise<void>;
  updateModInPack: (packId: string, modId: string) => Promise<boolean>;
  updateAllModsInPack: (
    packId: string,
  ) => Promise<{ updated: number; skipped: number; failed: number }>;
  installFromCatalog: (
    item: CatalogItem,
    versionId?: string,
    options?: InstallFromCatalogOptions,
  ) => Promise<boolean>;
  setTheme: (theme: Theme) => void;
  setSystemTheme: (v: boolean) => void;
  setAccentColor: (color: AccentColor) => void;
  setFontSize: (size: number) => void;
  setStreamerMode: (mode: StreamerMode) => void;
  setHomeBackgroundEnabled: (v: boolean) => void;
  setHomeBlurPercent: (v: number) => void;
  setHomeDimPercent: (v: number) => void;
  setHomeBackgroundPreset: (preset: HomeBackgroundPreset) => void;
  setSidebarCompact: (v: boolean) => void;
  setSidebarGlow: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setUiAnimations: (v: boolean) => void;
  setPageTransitions: (v: boolean) => void;
  setOpenAnimations: (v: boolean) => void;
  setKeyboardShortcuts: (v: boolean) => void;
  setGlassShimmer: (v: boolean) => void;
  setGlassShimmerSpeed: (v: number) => void;
  setGlassShimmerIntensity: (v: number) => void;
  setGlassShimmerScope: (v: GlassShimmerScope) => void;
  setHoverEffects: (v: boolean) => void;
  setAccentPulse: (v: boolean) => void;
  setButtonGlowEffects: (v: boolean) => void;
  setCardShadowIntensity: (v: number) => void;
  setSidebarTransparency: (v: number) => void;
  setPanelBorderGlow: (v: boolean) => void;
  setScrollbarStyle: (v: ScrollbarStyle) => void;
  setContentSpacing: (v: ContentSpacing) => void;
  setUiRoundness: (v: UiRoundness) => void;
  setInterfaceScale: (v: number) => void;
  setGlassIntensity: (v: number) => void;
  setShowHomeStats: (v: boolean) => void;
  setShowLauncherTips: (v: boolean) => void;
  setConfirmBeforeLaunch: (v: boolean) => void;
  setQuickLaunchDoubleClick: (v: boolean) => void;
  setRetroSoundsEnabled: (v: boolean) => void;
  setCompactLists: (v: boolean) => void;
  setCopyVersionOnClick: (v: boolean) => void;
  setLanguage: (lang: AppLocale) => void;
  setLauncherBehavior: (v: LauncherBehavior) => void;
  markUpdatedOnReleaseDay: () => void;
  setShowSkins: (v: boolean) => void;
  setLogging: (v: boolean) => void;
  setDevMode: (v: boolean) => void;
  setLowEndMode: (v: boolean) => void;
  setCurseForgeApiKey: (key: string) => void;
  setAutoPlayOnServerAdd: (v: boolean) => void;
  setMemoryMb: (mb: number) => void;
  setResolution: (r: Resolution) => void;
  setGameDirectory: (path: string) => void;
  setIntegrityCheck: (v: boolean) => void;
  setExecutablePath: (path: string) => void;
  setJvmParams: (params: string) => void;
  setProxy: (p: ProxyMode) => void;
  setSimultaneousDownloads: (n: 2 | 3 | 6 | 10 | 16) => void;
  setDownloadMirror: (m: DownloadMirror) => void;
  setSslCheck: (v: boolean) => void;
  setSettingsSection: (s: SettingsSection) => void;
  setModsTab: (t: ModsTab) => void;
  setCatalogKind: (k: CatalogKind) => void;
  setCatalogSource: (s: CatalogSource) => void;
  setAccountsTab: (t: AccountsTab) => void;
  setShowAddAccountModal: (v: boolean) => void;
  setAddAccountView: (v: AddAccountView) => void;
  setShowAccountSwitcher: (v: boolean) => void;
  setShowCreatePackModal: (v: boolean) => void;
  setShowVersionPicker: (v: boolean) => void;
  setShowNuvoxelLogin: (v: boolean) => void;
  setShowAddFriendModal: (v: boolean) => void;
  setShowChatModal: (v: boolean) => void;
  setShowJavaPathModal: (v: boolean) => void;
  openJavaPathModal: (error: string, retryPackId?: string | null) => void;
  setSocialApiUrl: (url: string) => void;
  loginNuvoxel: (login: string, password: string) => Promise<boolean>;
  registerNuvoxel: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logoutNuvoxelId: () => void;
  refreshFriends: () => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  play: (packId?: string) => Promise<void>;
  quickLaunchFromHistory: (entry: LaunchHistoryEntry) => Promise<void>;
  showToast: (msg: string) => void;
  clearLaunchHistoryForVersion: (version: string) => void;
  clearToast: () => void;
  setSelectedSkin: (skin: SelectedSkin | null) => void;
  setSkinModel: (model: SkinModel) => void;
  setSelectedCape: (capeId: string | null) => void;
  addServer: (data: {
    name: string;
    address: string;
    port: number;
    playAfterAdd?: boolean;
  }) => string;
  removeServer: (id: string) => void;
  setActiveServer: (id: string | null) => void;
  toggleServerFavorite: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeAccountId: "",
      minecraftVersion: "1.21.4",

      modPacks: [],
      activeModPackId: null,
      versionPickerLoader: "vanilla",
      versionFilter: "all",
      launchHistory: [],
      lastLaunchByVersion: {},

      theme: "dark",
      systemTheme: false,
      accentColor: "blue",
      fontSize: 14,
      streamerMode: "show",
      homeBackgroundEnabled: true,
      homeBlurPercent: 50,
      homeDimPercent: 70,
      homeBackgroundPreset: "copper",
      sidebarCompact: false,
      sidebarGlow: true,
      reduceMotion: false,
      uiAnimations: true,
      pageTransitions: true,
      openAnimations: true,
      keyboardShortcuts: true,
      glassShimmer: true,
      glassShimmerSpeed: 55,
      glassShimmerIntensity: 50,
      glassShimmerScope: "all",
      hoverEffects: true,
      accentPulse: true,
      buttonGlowEffects: true,
      cardShadowIntensity: 50,
      sidebarTransparency: 0,
      panelBorderGlow: true,
      scrollbarStyle: "default",
      contentSpacing: "normal",
      uiRoundness: "default",
      interfaceScale: 100,
      glassIntensity: 70,
      showHomeStats: true,
      showLauncherTips: true,

      confirmBeforeLaunch: false,
      quickLaunchDoubleClick: true,
      retroSoundsEnabled: true,
      compactLists: false,
      copyVersionOnClick: false,

      language: "ru",
      launcherBehavior: "hide",
      showSkins: true,
      logging: false,
      devMode: false,
      lowEndMode: false,
      curseforgeApiKey: "",
      autoPlayOnServerAdd: false,

      achievementStats: { ...DEFAULT_ACHIEVEMENT_STATS },
      unlockedAchievements: {},

      memoryMb: 4096,
      resolution: "windowed",
      gameDirectory: "C:\\Users\\User\\AppData\\Roaming\\.minecraft",
      integrityCheck: true,
      executablePath: "",
      jvmParams: "",

      proxy: "system",
      simultaneousDownloads: 6,
      downloadMirror: "auto",
      sslCheck: true,

      settingsSection: "general",
      modsTab: "my",
      catalogKind: "modpacks",
      catalogSource: "modrinth",
      accountsTab: "cabinet",
      showAddAccountModal: false,
      addAccountView: "select",
      showAccountSwitcher: false,
      showCreatePackModal: false,
      showVersionPicker: false,
      showNuvoxelLogin: false,
      showJavaPathModal: false,
      javaPathModalError: null,
      javaPathRetryPackId: null,
      isPlaying: false,
      gameRunning: false,
      gameVersion: "",
      toastMessage: null,
      launchProgress: null,
      selectedSkin: loadSelectedSkin(),

      servers: [],
      activeServerId: null,

      nuvoxelSession: null,
      nuvoxelSessions: {},
      friends: [],
      localFriends: [],
      socialApiUrl: "",
      socialApiOnline: false,
      showAddFriendModal: false,
      showChatModal: false,

      addLocalFriend: (nameOrCode) => {
        const trimmed = nameOrCode.trim();
        if (!trimmed) return false;
        const current = get().localFriends;
        const exists = current.some(
          (f) =>
            f.username.toLowerCase() === trimmed.toLowerCase() ||
            (f.friendCode && f.friendCode.toLowerCase() === trimmed.toLowerCase()),
        );
        if (exists) {
          set({ toastMessage: "alreadyFriends" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }
        const id = crypto.randomUUID();
        const isCode = trimmed.length === 6 && /^[A-Z0-9]+$/i.test(trimmed);
        const friendCode = isCode ? trimmed.toUpperCase() : "LOC" + Math.floor(100 + Math.random() * 900);
        const username = isCode ? `Friend_${trimmed.toUpperCase()}` : trimmed;
        const newFriend: FriendProfile = {
          id,
          username,
          friendCode,
          online: false,
          status: "offline",
          lastSeenAt: Date.now(),
        };
        set((s) => ({
          localFriends: [newFriend, ...s.localFriends],
          toastMessage: "friendAdded",
        }));
        setTimeout(() => set({ toastMessage: null }), 2500);
        return true;
      },
      removeLocalFriend: (friendId) => {
        set((s) => ({
          localFriends: s.localFriends.filter((f) => f.id !== friendId),
          toastMessage: "friendRemoved",
        }));
        setTimeout(() => set({ toastMessage: null }), 2500);
      },

      setActiveAccount: (id) => {
        const session = sessionForAccount(
          get().accounts,
          id,
          get().nuvoxelSessions,
        );
        set({
          activeAccountId: id,
          nuvoxelSession: session,
          friends: [],
          socialApiOnline: false,
        });
        if (session) void get().refreshFriends();
      },
      addLocalAccount: (username) => {
        const id = crypto.randomUUID();
        set((s) => ({
          accounts: [...s.accounts, { id, username, type: "local" }],
          activeAccountId: id,
          showAddAccountModal: false,
        }));
      },
      removeAccount: (id) => {
        const removed = get().accounts.find((a) => a.id === id);
        set((s) => {
          const accounts = s.accounts.filter((a) => a.id !== id);
          const activeAccountId =
            s.activeAccountId === id
              ? (accounts[0]?.id ?? "")
              : s.activeAccountId;
          let nuvoxelSessions = { ...s.nuvoxelSessions };
          if (removed?.type === "nuvoxel" && removed.nuvoxelUserId) {
            const { [removed.nuvoxelUserId]: _, ...rest } = nuvoxelSessions;
            nuvoxelSessions = rest;
          }
          const session = sessionForAccount(
            accounts,
            activeAccountId,
            nuvoxelSessions,
          );
          return {
            accounts,
            activeAccountId,
            nuvoxelSessions,
            nuvoxelSession: session,
            friends: session ? s.friends : [],
          };
        });
      },
      updateAccountUsername: (id, username) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, username } : a,
          ),
        }));
      },
      updateAccountCover: (id, coverUrl) => {
        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === id ? { ...a, coverUrl } : a,
          ),
        }));
      },
      refreshAccountData: async (id) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return false;
        if (account.type === "nuvoxel" && account.nuvoxelUserId) {
          const session =
            get().nuvoxelSessions[account.nuvoxelUserId] ?? get().nuvoxelSession;
          if (!session) return false;
          try {
            const me = await fetchMe(session.token);
            set((s) => ({
              accounts: s.accounts.map((a) =>
                a.id === id ? { ...a, username: me.username } : a,
              ),
              nuvoxelSession:
                s.activeAccountId === id
                  ? { ...session, username: me.username }
                  : s.nuvoxelSession,
              nuvoxelSessions: {
                ...s.nuvoxelSessions,
                [session.userId]: { ...session, username: me.username },
              },
            }));
            if (get().activeAccountId === id) {
              await get().refreshFriends();
            }
            return true;
          } catch (e) {
            if (handleSocialApiError(e)) return false;
            return false;
          }
        }
        return true;
      },
      logoutAccount: (id) => {
        const account = get().accounts.find((a) => a.id === id);
        if (!account) return;
        if (account.type === "nuvoxel" && account.nuvoxelUserId) {
          const { [account.nuvoxelUserId]: _, ...rest } = get().nuvoxelSessions;
          set({
            nuvoxelSessions: rest,
            nuvoxelSession:
              get().activeAccountId === id ? null : get().nuvoxelSession,
            friends: get().activeAccountId === id ? [] : get().friends,
            socialApiOnline: false,
            showNuvoxelLogin: get().activeAccountId === id,
          });
          return;
        }
        get().removeAccount(id);
        if (!get().accounts.length) {
          set({ showAddAccountModal: true });
        }
      },
      setGameRunning: (running) => {
        if (!running) {
          const stats = get().achievementStats;
          const sessionStart = stats.gameSessionStart;
          let playTimeSeconds = stats.playTimeSeconds;
          if (sessionStart) {
            playTimeSeconds += Math.floor((Date.now() - sessionStart) / 1000);
          }
          set({
            gameRunning: false,
            gameVersion: "",
            achievementStats: {
              ...stats,
              playTimeSeconds,
              gameSessionStart: null,
            },
          });
          return;
        }
        set({ gameRunning: true });
      },
      setSocialApiOnline: (online) => set({ socialApiOnline: online }),
      invalidateNuvoxelSession: () => {
        const session = get().nuvoxelSession;
        if (!session) return;
        const account = get().accounts.find(
          (a) => a.type === "nuvoxel" && a.nuvoxelUserId === session.userId,
        );
        const { [session.userId]: _, ...rest } = get().nuvoxelSessions;
        
        let newAccounts = get().accounts;
        if (account) {
          newAccounts = get().accounts.filter((a) => a.id !== account.id);
        }
        
        const activeAccountId =
          get().activeAccountId === account?.id
            ? (newAccounts[0]?.id ?? "")
            : get().activeAccountId;

        set({
          accounts: newAccounts,
          activeAccountId,
          nuvoxelSessions: rest,
          nuvoxelSession: null,
          friends: [],
          socialApiOnline: false,
          showNuvoxelLogin: true,
          toastMessage: "nuvoxelSessionExpired",
        });

        if (!newAccounts.length) {
          set({ showAddAccountModal: true });
        }
        setTimeout(() => set({ toastMessage: null }), 3000);
      },
      setMinecraftVersion: (version) => set({ minecraftVersion: version }),
      setVersionPickerLoader: (loader) => set({ versionPickerLoader: loader }),
      setVersionFilter: (f) => set({ versionFilter: f }),
      createModPack: ({ name, minecraftVersion, loader }) => {
        const id = crypto.randomUUID();
        const pack: ModPack = {
          id,
          name,
          minecraftVersion,
          loader,
          mods: [],
          modCount: 0,
          createdAt: Date.now(),
        };
        set((s) => ({
          modPacks: [...s.modPacks, pack],
          activeModPackId: id,
          minecraftVersion,
          versionPickerLoader: loader,
          showCreatePackModal: false,
        }));
        syncAchievements(get, set, (stats) => ({
          ...stats,
          customProfilesCreated: stats.customProfilesCreated + 1,
        }));
        void listModFiles(getPackModsDir(get().gameDirectory, id));
        void listPackAssets(getPackResourcepacksDir(get().gameDirectory, id));
        void listPackAssets(getPackShaderpacksDir(get().gameDirectory, id));
        return id;
      },
      removeModPack: async (id) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === id);
        if (pack) {
          try {
            await deletePackFolder(getPackInstanceDir(gameDirectory, id));
          } catch {
            set({ toastMessage: "packDeleteError" });
            setTimeout(() => set({ toastMessage: null }), 2500);
            return;
          }
        }
        set((s) => {
          const nextPacks = s.modPacks.filter((p) => p.id !== id);
          const activeModPackId =
            s.activeModPackId === id ? null : s.activeModPackId;
          return {
            modPacks: nextPacks,
            activeModPackId,
            toastMessage: "packDeleted",
          };
        });
        setTimeout(() => set({ toastMessage: null }), 2500);
      },
      setActiveModPack: (id) => {
        if (id === null) {
          set({ activeModPackId: null });
          return;
        }
        const pack = get().modPacks.find((p) => p.id === id);
        if (!pack) {
          set({ activeModPackId: null });
          return;
        }
        set({
          activeModPackId: id,
          minecraftVersion: pack.minecraftVersion,
          versionPickerLoader: pack.loader,
        });
      },
      addModToPack: async (packId, item, options) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        if (!pack) return false;

        if (pack.loader === "vanilla") {
          set({ toastMessage: "packNeedsLoader" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }

        const pendingKey = `${packId}:${item.id}`;
        if (pendingModAdds.has(pendingKey)) {
          set({ toastMessage: "packModAlreadyAdded" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }

        const existing = (pack.mods ?? []).some((m) => m.projectId === item.id);
        if (existing) {
          set({ toastMessage: "packModAlreadyAdded" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }

        pendingModAdds.add(pendingKey);
        try {
          set({ toastMessage: "packModDownloading" });

          let download: {
            url: string;
            filename: string;
            versionId: string;
            versionNumber: string;
          } | null = null;

          if (item.source === "modrinth") {
            if (options?.versionId) {
              const preset = await getModrinthVersionDownload(
                item.id,
                options.versionId,
              );
              if (preset) {
                if (
                  preset.mcVersion !== pack.minecraftVersion ||
                  (preset.loader !== pack.loader &&
                    !(
                      pack.loader === "quilt" && preset.loader === "fabric"
                    ))
                ) {
                  set({ toastMessage: "packModNoVersion" });
                  setTimeout(() => set({ toastMessage: null }), 2500);
                  return false;
                }
                download = {
                  url: preset.url,
                  filename: preset.filename,
                  versionId: preset.versionId,
                  versionNumber: preset.versionNumber,
                };
              }
            } else {
              download = await findModDownload(
                item.id,
                pack.minecraftVersion,
                pack.loader,
              );
            }
          } else if (options?.versionId) {
            download = await getCurseForgeFileDownload(
              item.id,
              options.versionId,
            );
          } else {
            download = await findCurseForgeDownload(
              item.id,
              pack.minecraftVersion,
              pack.loader,
            );
          }

          if (!download) {
            set({ toastMessage: "packModNoVersion" });
            setTimeout(() => set({ toastMessage: null }), 2500);
            return false;
          }

          const destPath = buildModDestPath(
            gameDirectory,
            packId,
            download.filename,
          );
          await downloadModFile(download.url, destPath);

          const packMod: PackMod = {
            id: crypto.randomUUID(),
            projectId: item.id,
            name: item.title,
            author: item.author,
            iconUrl: item.iconUrl,
            filename: download.filename,
            versionId: download.versionId,
            versionNumber: download.versionNumber,
            filePath: destPath,
            addedAt: Date.now(),
            catalogSource: item.source,
          };

          set((s) => ({
            modPacks: s.modPacks.map((p) => {
              if (p.id !== packId) return p;
              const mods = [...(p.mods ?? []), packMod];
              return { ...p, mods, modCount: mods.length };
            }),
            toastMessage: "packModAdded",
          }));
          syncAchievements(get, set, (stats) => ({
            ...stats,
            modsInstalledTotal: stats.modsInstalledTotal + 1,
          }));
          setTimeout(() => set({ toastMessage: null }), 2500);
          return true;
        } catch {
          set({ toastMessage: "packModError" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        } finally {
          pendingModAdds.delete(pendingKey);
        }
      },
      importModFilesToPack: async (packId, sourcePaths) => {
        const importKey = `${packId}:${sourcePaths.map(normalizeModPath).sort().join("|")}`;
        if (pendingModImports.has(importKey)) return 0;
        pendingModImports.add(importKey);

        try {
          const { modPacks, gameDirectory } = get();
          const pack = modPacks.find((p) => p.id === packId);
          if (!pack) return 0;

          if (pack.loader === "vanilla") {
            set({ toastMessage: "packNeedsLoader" });
            setTimeout(() => set({ toastMessage: null }), 2500);
            return 0;
          }

          const modsDir = getPackModsDir(gameDirectory, packId);
          const onDisk = await listModFiles(modsDir);
          const onDiskNames = new Set(
            onDisk.map((p) => normalizeModFilename(p)),
          );

          const seen = new Set<string>();
          let copied = 0;

          for (const sourcePath of sourcePaths) {
            const filename = filenameFromPath(sourcePath);
            const key = normalizeModFilename(filename);
            if (!key.endsWith(".jar")) continue;
            if (seen.has(key)) continue;
            seen.add(key);

            if (onDiskNames.has(key)) {
              continue;
            }

            const destPath = buildModDestPath(gameDirectory, packId, filename);
            try {
              await copyModFile(sourcePath, destPath);
              onDiskNames.add(key);
              copied += 1;
            } catch {
              set({ toastMessage: "packModError" });
              setTimeout(() => set({ toastMessage: null }), 2500);
            }
          }

          await get().syncPackModsFromDisk(packId);

          if (copied > 0) {
            set({ toastMessage: "packModsImported" });
            setTimeout(() => set({ toastMessage: null }), 2500);
          } else if (sourcePaths.length > 0 && seen.size > 0) {
            set({ toastMessage: "packModAlreadyAdded" });
            setTimeout(() => set({ toastMessage: null }), 2500);
          } else if (sourcePaths.length > 0) {
            set({ toastMessage: "packDropInvalid" });
            setTimeout(() => set({ toastMessage: null }), 2500);
          }
          return copied;
        } finally {
          pendingModImports.delete(importKey);
        }
      },
      importPackAssetsToPack: async (packId, sourcePaths, kind) => {
        const importKey = `${packId}:${kind}:${sourcePaths.map(normalizeModPath).sort().join("|")}`;
        if (pendingModImports.has(importKey)) return 0;
        pendingModImports.add(importKey);

        try {
          const { modPacks, gameDirectory } = get();
          const pack = modPacks.find((p) => p.id === packId);
          if (!pack) return 0;

          const assetsDir =
            kind === "resourcepack"
              ? getPackResourcepacksDir(gameDirectory, packId)
              : getPackShaderpacksDir(gameDirectory, packId);
          const onDisk = await listPackAssets(assetsDir);
          const onDiskNames = new Set(
            onDisk.map((entry) =>
              normalizeAssetKey(
                entry.is_directory
                  ? folderNameFromPath(entry.path)
                  : filenameFromPath(entry.path),
              ),
            ),
          );

          const seen = new Set<string>();
          let copied = 0;
          let hadInvalid = false;

          for (const sourcePath of sourcePaths) {
            const isDir = await pathIsDirectory(sourcePath);
            const name = isDir
              ? folderNameFromPath(sourcePath)
              : filenameFromPath(sourcePath);
            const key = normalizeAssetKey(name);

            if (seen.has(key)) continue;
            seen.add(key);

            if (onDiskNames.has(key)) continue;

            if (isDir) {
              if (kind === "shader") {
                hadInvalid = true;
                continue;
              }
              const destPath = buildResourcepackDestPath(
                gameDirectory,
                packId,
                name,
              );
              try {
                await copyPackFolder(sourcePath, destPath);
                onDiskNames.add(key);
                copied += 1;
              } catch {
                set({ toastMessage: "packAssetError" });
                setTimeout(() => set({ toastMessage: null }), 2500);
              }
              continue;
            }

            if (!name.toLowerCase().endsWith(".zip")) {
              hadInvalid = true;
              continue;
            }

            const destPath =
              kind === "resourcepack"
                ? buildResourcepackDestPath(gameDirectory, packId, name)
                : buildShaderDestPath(gameDirectory, packId, name);

            try {
              await copyPackFile(sourcePath, destPath);
              onDiskNames.add(key);
              copied += 1;
            } catch {
              set({ toastMessage: "packAssetError" });
              setTimeout(() => set({ toastMessage: null }), 2500);
            }
          }

          await get().syncPackAssetsFromDisk(packId);

          if (copied > 0) {
            set({
              toastMessage:
                kind === "resourcepack"
                  ? "packResourcepacksImported"
                  : "packShadersImported",
            });
            setTimeout(() => set({ toastMessage: null }), 2500);
          } else if (hadInvalid) {
            set({
              toastMessage:
                kind === "resourcepack"
                  ? "packDropResourcepackInvalid"
                  : "packDropShaderInvalid",
            });
            setTimeout(() => set({ toastMessage: null }), 2500);
          }

          return copied;
        } finally {
          pendingModImports.delete(importKey);
        }
      },
      syncPackModsFromDisk: async (packId) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        if (!pack) return;

        const onDisk = await listModFiles(getPackModsDir(gameDirectory, packId));

        const byFilename = new Map<string, string>();
        for (const filePath of onDisk) {
          const key = normalizeModFilename(filePath);
          if (!byFilename.has(key)) {
            byFilename.set(key, filePath);
          }
        }

        const existingByFilename = new Map<string, PackMod>();
        for (const mod of pack.mods ?? []) {
          const key = normalizeModFilename(mod.filename);
          if (!existingByFilename.has(key)) {
            existingByFilename.set(key, mod);
          }
        }

        const mods: PackMod[] = [];
        for (const [key, filePath] of byFilename) {
          const filename = filenameFromPath(filePath);
          const prev = existingByFilename.get(key);
          if (prev) {
            mods.push({ ...prev, filePath, filename });
          } else {
            mods.push({
              id: crypto.randomUUID(),
              projectId: `local:${key}`,
              name: localModDisplayName(filename),
              author: "Local",
              iconUrl: null,
              filename,
              versionId: "local",
              versionNumber: "local",
              filePath,
              addedAt: Date.now(),
            });
          }
        }

        mods.sort((a, b) =>
          a.filename.localeCompare(b.filename, undefined, { sensitivity: "base" }),
        );

        if (modListsMatch(mods, pack.mods ?? [])) return;

        set((s) => ({
          modPacks: s.modPacks.map((p) => {
            if (p.id !== packId) return p;
            return { ...p, mods, modCount: mods.length };
          }),
        }));
      },
      syncPackAssetsFromDisk: async (packId) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        if (!pack) return;

        const syncKind = async (
          _kind: PackAssetKind,
          getDir: (gameDirectory: string, packId: string) => string,
          current: PackFileEntry[] | undefined,
        ): Promise<PackFileEntry[] | null> => {
          const onDisk = await listPackAssets(getDir(gameDirectory, packId));
          const byKey = new Map<string, PackFileEntry>();
          for (const entry of current ?? []) {
            byKey.set(normalizeAssetKey(entry.filename), entry);
          }

          const assets: PackFileEntry[] = [];
          for (const listing of onDisk) {
            const filename = listing.is_directory
              ? folderNameFromPath(listing.path)
              : filenameFromPath(listing.path);
            const key = normalizeAssetKey(filename);
            const prev = byKey.get(key);
            if (prev) {
              assets.push({
                ...prev,
                filename,
                filePath: listing.path,
                isFolder: listing.is_directory,
              });
            } else {
              assets.push({
                id: crypto.randomUUID(),
                filename,
                filePath: listing.path,
                addedAt: Date.now(),
                isFolder: listing.is_directory,
              });
            }
          }

          assets.sort((a, b) =>
            a.filename.localeCompare(b.filename, undefined, {
              sensitivity: "base",
            }),
          );

          if (assetListsMatch(assets, current ?? [])) return null;
          return assets;
        };

        const resourcepacks = await syncKind(
          "resourcepack",
          getPackResourcepacksDir,
          pack.resourcepacks,
        );
        const shaderpacks = await syncKind(
          "shader",
          getPackShaderpacksDir,
          pack.shaderpacks,
        );

        if (resourcepacks === null && shaderpacks === null) return;

        set((s) => ({
          modPacks: s.modPacks.map((p) => {
            if (p.id !== packId) return p;
            return {
              ...p,
              ...(resourcepacks !== null ? { resourcepacks } : {}),
              ...(shaderpacks !== null ? { shaderpacks } : {}),
            };
          }),
        }));
      },
      syncPackContentFromDisk: async (packId) => {
        await get().syncPackModsFromDisk(packId);
        await get().syncPackAssetsFromDisk(packId);
      },
      removeModFromPack: async (packId, modId) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        const mod = pack?.mods?.find((m) => m.id === modId);
        const filePath =
          mod?.filePath ??
          (mod?.filename
            ? buildModDestPath(gameDirectory, packId, mod.filename)
            : undefined);
        if (filePath) {
          try {
            await deleteModFile(filePath);
          } catch {
            /* file may already be gone */
          }
        }
        set((s) => ({
          modPacks: s.modPacks.map((p) => {
            if (p.id !== packId) return p;
            const mods = (p.mods ?? []).filter((m) => m.id !== modId);
            return { ...p, mods, modCount: mods.length };
          }),
        }));
      },
      removePackAssetFromPack: async (packId, assetId, kind) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        const list =
          kind === "resourcepack"
            ? (pack?.resourcepacks ?? [])
            : (pack?.shaderpacks ?? []);
        const asset = list.find((entry) => entry.id === assetId);
        const filePath =
          asset?.filePath ??
          (asset?.filename
            ? kind === "resourcepack"
              ? buildResourcepackDestPath(gameDirectory, packId, asset.filename)
              : buildShaderDestPath(gameDirectory, packId, asset.filename)
            : undefined);

        if (filePath) {
          try {
            if (asset?.isFolder) {
              await deletePackFolder(filePath);
            } else {
              await deleteModFile(filePath);
            }
          } catch {
            /* file may already be gone */
          }
        }

        set((s) => ({
          modPacks: s.modPacks.map((p) => {
            if (p.id !== packId) return p;
            if (kind === "resourcepack") {
              const resourcepacks = (p.resourcepacks ?? []).filter(
                (entry) => entry.id !== assetId,
              );
              return { ...p, resourcepacks };
            }
            const shaderpacks = (p.shaderpacks ?? []).filter(
              (entry) => entry.id !== assetId,
            );
            return { ...p, shaderpacks };
          }),
        }));
      },
      updateModInPack: async (packId, modId) => {
        const { modPacks, gameDirectory } = get();
        const pack = modPacks.find((p) => p.id === packId);
        const mod = pack?.mods?.find((m) => m.id === modId);
        if (!pack || !mod || mod.projectId.startsWith("local:")) return false;

        const updateInfo = await checkModUpdate(mod, pack);
        if (!updateInfo) return false;

        const source = mod.catalogSource ?? pack.source ?? "modrinth";
        let download: {
          url: string;
          filename: string;
          versionId: string;
          versionNumber: string;
        } | null = null;

        if (source === "modrinth") {
          const preset = await getModrinthVersionDownload(
            mod.projectId,
            updateInfo.latestVersionId,
          );
          if (preset) {
            download = {
              url: preset.url,
              filename: preset.filename,
              versionId: preset.versionId,
              versionNumber: preset.versionNumber,
            };
          } else {
            download = await findModDownload(
              mod.projectId,
              pack.minecraftVersion,
              pack.loader,
            );
          }
        } else {
          download = await findCurseForgeDownload(
            mod.projectId,
            pack.minecraftVersion,
            pack.loader,
            updateInfo.latestVersionId,
          );
        }

        if (!download || download.versionId === mod.versionId) return false;

        const destPath = buildModDestPath(
          gameDirectory,
          packId,
          download.filename,
        );
        const oldPath = mod.filePath;

        try {
          await downloadModFile(download.url, destPath);

          if (oldPath && oldPath !== destPath) {
            try {
              await deleteModFile(oldPath);
            } catch {
              /* old file may be missing */
            }
          }

          set((s) => ({
            modPacks: s.modPacks.map((p) => {
              if (p.id !== packId) return p;
              const mods = (p.mods ?? []).map((m) =>
                m.id === modId
                  ? {
                      ...m,
                      filename: download!.filename,
                      versionId: download!.versionId,
                      versionNumber: download!.versionNumber,
                      filePath: destPath,
                    }
                  : m,
              );
              return { ...p, mods };
            }),
          }));
          return true;
        } catch {
          return false;
        }
      },
      updateAllModsInPack: async (packId) => {
        const pack = get().modPacks.find((p) => p.id === packId);
        if (!pack) return { updated: 0, skipped: 0, failed: 0 };

        let updated = 0;
        let skipped = 0;
        let failed = 0;

        for (const mod of pack.mods ?? []) {
          if (mod.projectId.startsWith("local:")) {
            skipped += 1;
            continue;
          }
          const info = await checkModUpdate(mod, pack);
          if (!info) {
            skipped += 1;
            continue;
          }
          const ok = await get().updateModInPack(packId, mod.id);
          if (ok) updated += 1;
          else failed += 1;
        }

        return { updated, skipped, failed };
      },
      installFromCatalog: async (item, versionId, options) => {
        const installKey = `${item.source}:${item.id}:${versionId ?? ""}:${options?.targetPackId ?? "new"}`;
        if (pendingCatalogInstalls.has(installKey)) return false;
        pendingCatalogInstalls.add(installKey);

        try {
          if (item.kind === "modpack") {
            if (item.source !== "modrinth") {
              set({ toastMessage: "modpackCurseforgeUnsupported" });
              setTimeout(() => set({ toastMessage: null }), 3500);
              return false;
            }
            try {
              set({ toastMessage: "modpackInstalling" });
              const id = crypto.randomUUID();
              const packDir = getPackInstanceDir(get().gameDirectory, id);

              const result = await installModrinthModpack(
                item.id,
                packDir,
                versionId,
              );

              const pack: ModPack = {
                id,
                name: options?.packName?.trim() || item.title,
                minecraftVersion: result.minecraftVersion,
                loader: result.loader,
                source: "modrinth",
                modrinthProjectId: item.id,
                modrinthIconUrl: item.iconUrl ?? undefined,
                mods: [],
                modCount: 0,
                createdAt: Date.now(),
              };

              set((s) => ({
                modPacks: [...s.modPacks, pack],
                activeModPackId: id,
                minecraftVersion: result.minecraftVersion,
                versionPickerLoader: result.loader,
                modsTab: "my",
              }));

              await get().syncPackModsFromDisk(id);

              set({
                toastMessage:
                  result.modCount > 0 ? "modpackInstalled" : "installPartial",
              });
              syncAchievements(get, set, (stats) => ({
                ...stats,
                modpackIdsUsed: stats.modpackIdsUsed.includes(id)
                  ? stats.modpackIdsUsed
                  : [...stats.modpackIdsUsed, id],
              }));
              setTimeout(() => set({ toastMessage: null }), 3000);
              return true;
            } catch {
              set({ toastMessage: "modpackInstallError" });
              setTimeout(() => set({ toastMessage: null }), 3000);
              return false;
            }
          }

          let mcVersion = "1.21.4";
          let loader: ModLoader = "fabric";
          let presetDownload: Awaited<
            ReturnType<typeof getModrinthVersionDownload>
          > = null;

          if (item.source === "modrinth") {
            if (versionId) {
              presetDownload = await getModrinthVersionDownload(
                item.id,
                versionId,
              );
              if (!presetDownload) throw new Error("no version");
              mcVersion = presetDownload.mcVersion;
              loader = presetDownload.loader;
            } else {
              const version = await getLatestModrinthVersion(item.id);
              if (!version) throw new Error("no version");
              mcVersion =
                version.game_versions.find((v) => /^\d+\.\d+/.test(v)) ??
                version.game_versions[0] ??
                mcVersion;
              const modLoader = version.loaders.find(
                (l) => l !== "vanilla" && l !== "unknown",
              );
              loader = modLoader ? mapModrinthLoader(modLoader) : "fabric";
              if (loader === "vanilla") loader = "fabric";
            }
          } else {
            const file = versionId
              ? await getCurseForgeFile(item.id, versionId)
              : await getLatestCurseForgeFile(item.id);
            if (!file) throw new Error("no version");
            mcVersion = pickMcVersion(file.gameVersions, mcVersion);
            loader = mapCurseForgeLoader(file.modLoaderTypes);
            if (loader === "vanilla") loader = "fabric";
          }

          const existingPackId =
            options?.targetPackId && options.targetPackId !== "new"
              ? options.targetPackId
              : null;

          if (existingPackId) {
            const targetPack = get().modPacks.find((p) => p.id === existingPackId);
            if (
              !targetPack ||
              !packCompatibleWithInstall(targetPack, mcVersion, loader)
            ) {
              set({ toastMessage: "installError" });
              setTimeout(() => set({ toastMessage: null }), 2500);
              return false;
            }
            set({ toastMessage: "installing" });
            const added = await get().addModToPack(existingPackId, item, {
              versionId,
            });
            if (added) {
              set({
                activeModPackId: existingPackId,
                modsTab: "my",
                toastMessage: "packModAdded",
              });
              setTimeout(() => set({ toastMessage: null }), 2500);
            }
            return added;
          }

          set({ toastMessage: "installing" });

          const id = crypto.randomUUID();
          const pack: ModPack = {
            id,
            name: options?.packName?.trim() || item.title,
            minecraftVersion: mcVersion,
            loader,
            source: item.source,
            mods: [],
            modCount: 0,
            createdAt: Date.now(),
            ...(item.source === "modrinth"
              ? {
                  modrinthProjectId: item.id,
                  modrinthIconUrl: item.iconUrl ?? undefined,
                }
              : {
                  curseforgeProjectId: item.id,
                  curseforgeIconUrl: item.iconUrl ?? undefined,
                }),
          };

          set((s) => ({
            modPacks: [...s.modPacks, pack],
            activeModPackId: id,
            minecraftVersion: mcVersion,
            versionPickerLoader: loader,
            modsTab: "my",
          }));

          let added = false;
          try {
            await listModFiles(getPackModsDir(get().gameDirectory, id));

            if (presetDownload) {
              const destPath = buildModDestPath(
                get().gameDirectory,
                id,
                presetDownload.filename,
              );
              await downloadModFile(presetDownload.url, destPath);
              const packMod: PackMod = {
                id: crypto.randomUUID(),
                projectId: item.id,
                name: item.title,
                author: item.author,
                iconUrl: item.iconUrl,
                filename: presetDownload.filename,
                versionId: presetDownload.versionId,
                versionNumber: presetDownload.versionNumber,
                filePath: destPath,
                addedAt: Date.now(),
                catalogSource: item.source,
              };
              set((s) => ({
                modPacks: s.modPacks.map((p) => {
                  if (p.id !== id) return p;
                  const mods = [...(p.mods ?? []), packMod];
                  return { ...p, mods, modCount: mods.length };
                }),
              }));
              added = true;
            } else if (item.source === "curseforge" && versionId) {
              const cfDownload = await getCurseForgeFileDownload(
                item.id,
                versionId,
              );
              if (cfDownload) {
                const destPath = buildModDestPath(
                  get().gameDirectory,
                  id,
                  cfDownload.filename,
                );
                await downloadModFile(cfDownload.url, destPath);
                const packMod: PackMod = {
                  id: crypto.randomUUID(),
                  projectId: item.id,
                  name: item.title,
                  author: item.author,
                  iconUrl: item.iconUrl,
                  filename: cfDownload.filename,
                  versionId: cfDownload.versionId,
                  versionNumber: cfDownload.versionNumber,
                  filePath: destPath,
                  addedAt: Date.now(),
                  catalogSource: item.source,
                };
                set((s) => ({
                  modPacks: s.modPacks.map((p) => {
                    if (p.id !== id) return p;
                    const mods = [...(p.mods ?? []), packMod];
                    return { ...p, mods, modCount: mods.length };
                  }),
                }));
                added = true;
              }
            } else {
              added = await get().addModToPack(id, item, { versionId });
            }
          } catch {
            try {
              await deletePackFolder(getPackInstanceDir(get().gameDirectory, id));
            } catch {
              /* folder may not exist */
            }
            set((s) => ({
              modPacks: s.modPacks.filter((p) => p.id !== id),
              activeModPackId:
                s.activeModPackId === id ? null : s.activeModPackId,
            }));
            set({ toastMessage: "installError" });
            setTimeout(() => set({ toastMessage: null }), 2500);
            return false;
          }

          if (!added) {
            try {
              await deletePackFolder(getPackInstanceDir(get().gameDirectory, id));
            } catch {
              /* folder may not exist */
            }
            set((s) => ({
              modPacks: s.modPacks.filter((p) => p.id !== id),
              activeModPackId:
                s.activeModPackId === id ? null : s.activeModPackId,
            }));
            set({ toastMessage: "installPartial" });
            setTimeout(() => set({ toastMessage: null }), 2500);
            return false;
          }

          set({ toastMessage: "installed" });
          syncAchievements(get, set, (stats) => ({
            ...stats,
            modsInstalledTotal: stats.modsInstalledTotal + 1,
          }));
          setTimeout(() => set({ toastMessage: null }), 2500);
          return true;
        } catch {
          set({ toastMessage: "installError" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        } finally {
          pendingCatalogInstalls.delete(installKey);
        }
      },
      setTheme: (theme) => set({ theme }),
      setSystemTheme: (v) => set({ systemTheme: v }),
      setAccentColor: (color) => set({ accentColor: color }),
      setFontSize: (size) => set({ fontSize: size }),
      setStreamerMode: (mode) => set({ streamerMode: mode }),
      setHomeBackgroundEnabled: (v) => set({ homeBackgroundEnabled: v }),
      setHomeBlurPercent: (v) =>
        set({ homeBlurPercent: Math.min(100, Math.max(0, v)) }),
      setHomeDimPercent: (v) =>
        set({ homeDimPercent: Math.min(100, Math.max(0, v)) }),
      setHomeBackgroundPreset: (preset) => set({ homeBackgroundPreset: preset }),
      setSidebarCompact: (v) => set({ sidebarCompact: v }),
      setSidebarGlow: (v) => set({ sidebarGlow: v }),
      setReduceMotion: (v) => set({ reduceMotion: v }),
      setUiAnimations: (v) => set({ uiAnimations: v }),
      setPageTransitions: (v) => set({ pageTransitions: v }),
      setOpenAnimations: (v) => set({ openAnimations: v }),
      setKeyboardShortcuts: (v) => set({ keyboardShortcuts: v }),
      setGlassShimmer: (v) => set({ glassShimmer: v }),
      setGlassShimmerSpeed: (v) =>
        set({ glassShimmerSpeed: Math.min(100, Math.max(20, v)) }),
      setGlassShimmerIntensity: (v) =>
        set({ glassShimmerIntensity: Math.min(100, Math.max(0, v)) }),
      setGlassShimmerScope: (v) => set({ glassShimmerScope: v }),
      setHoverEffects: (v) => set({ hoverEffects: v }),
      setAccentPulse: (v) => set({ accentPulse: v }),
      setButtonGlowEffects: (v) => set({ buttonGlowEffects: v }),
      setCardShadowIntensity: (v) =>
        set({ cardShadowIntensity: Math.min(100, Math.max(0, v)) }),
      setSidebarTransparency: (v) =>
        set({ sidebarTransparency: Math.min(80, Math.max(0, v)) }),
      setPanelBorderGlow: (v) => set({ panelBorderGlow: v }),
      setScrollbarStyle: (v) => set({ scrollbarStyle: v }),
      setContentSpacing: (v) => set({ contentSpacing: v }),
      setUiRoundness: (v) => set({ uiRoundness: v }),
      setInterfaceScale: (v) =>
        set({ interfaceScale: Math.min(115, Math.max(85, v)) }),
      setGlassIntensity: (v) =>
        set({ glassIntensity: Math.min(100, Math.max(0, v)) }),
      setShowHomeStats: (v) => set({ showHomeStats: v }),
      setShowLauncherTips: (v) => set({ showLauncherTips: v }),
      setConfirmBeforeLaunch: (v) => set({ confirmBeforeLaunch: v }),
      setQuickLaunchDoubleClick: (v) => set({ quickLaunchDoubleClick: v }),
      setRetroSoundsEnabled: (v) => set({ retroSoundsEnabled: v }),
      setCompactLists: (v) => set({ compactLists: v }),
      setCopyVersionOnClick: (v) => set({ copyVersionOnClick: v }),
      setLanguage: (lang) => {
        setI18nLocale(lang as Locale);
        set({ language: lang });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
        }
      },
      setLauncherBehavior: (v) => set({ launcherBehavior: v }),
      markUpdatedOnReleaseDay: () => {
        syncAchievements(get, set, { updatedOnReleaseDay: true });
      },
      setShowSkins: (v) => set({ showSkins: v }),
      setLogging: (v) => set({ logging: v }),
      setDevMode: (v) => set({ devMode: v }),
      setLowEndMode: (enabled) => {
        if (enabled) {
          set({
            lowEndMode: true,
            memoryMb: Math.min(get().memoryMb, 2048),
            simultaneousDownloads: 2,
            glassShimmer: false,
            homeBlurPercent: 0,
            reduceMotion: true,
            uiAnimations: false,
            pageTransitions: false,
            openAnimations: false,
            buttonGlowEffects: false,
            panelBorderGlow: false,
            integrityCheck: false,
          });
          return;
        }
        set({ lowEndMode: false });
      },
      setCurseForgeApiKey: (key) => {
        resetCurseForgeAvailabilityCache();
        set({ curseforgeApiKey: key.trim() });
      },
      setAutoPlayOnServerAdd: (v) => set({ autoPlayOnServerAdd: v }),
      setMemoryMb: (mb) => {
        set({ memoryMb: mb });
        if (mb !== 4096) {
          syncAchievements(get, set, { memoryCustomized: true });
        }
      },
      setResolution: (r) => set({ resolution: r }),
      setGameDirectory: (path) => set({ gameDirectory: path }),
      setIntegrityCheck: (v) => set({ integrityCheck: v }),
      setExecutablePath: (path) => set({ executablePath: path }),
      setJvmParams: (params) => set({ jvmParams: params }),
      setProxy: (p) => set({ proxy: p }),
      setSimultaneousDownloads: (n) => set({ simultaneousDownloads: n }),
      setDownloadMirror: (m) => set({ downloadMirror: m }),
      setSslCheck: (v) => set({ sslCheck: v }),
      setSettingsSection: (s) => set({ settingsSection: s }),
      setModsTab: (t) => set({ modsTab: t }),
      setCatalogKind: (k) => set({ catalogKind: k }),
      setCatalogSource: (s) => set({ catalogSource: s }),
      setAccountsTab: (t) => set({ accountsTab: t }),
      setShowAddAccountModal: (v) =>
        set({ showAddAccountModal: v, ...(v ? {} : { addAccountView: "select" }) }),
      setAddAccountView: (v) => set({ addAccountView: v }),
      setShowAccountSwitcher: (v) => set({ showAccountSwitcher: v }),
      setShowCreatePackModal: (v) => set({ showCreatePackModal: v }),
      setShowVersionPicker: (v) => set({ showVersionPicker: v }),
      setShowNuvoxelLogin: (v) => set({ showNuvoxelLogin: v }),
      setShowAddFriendModal: (v) => set({ showAddFriendModal: v }),
      setShowChatModal: (v) => set({ showChatModal: v }),
      setShowJavaPathModal: (v) =>
        set({
          showJavaPathModal: v,
          ...(v ? {} : { javaPathModalError: null, javaPathRetryPackId: null }),
        }),
      openJavaPathModal: (error, retryPackId = null) =>
        set({
          showJavaPathModal: true,
          javaPathModalError: error,
          javaPathRetryPackId: retryPackId,
        }),
      setSocialApiUrl: (url) => set({ socialApiUrl: url.trim() }),
      loginNuvoxel: async (login, password) => {
        try {
          const auth = await loginNuvoxelAccount({ login, password });
          const session = sessionFromAuth(auth);
          const existingByUserId = get().accounts.find(
            (a) => a.type === "nuvoxel" && a.nuvoxelUserId === auth.user.id,
          );
          const existingLocalByName = get().accounts.find(
            (a) =>
              a.type === "local" &&
              a.username.toLowerCase() === auth.user.username.toLowerCase(),
          );
          const activeAccount = get().accounts.find(
            (a) => a.id === get().activeAccountId,
          );
          const target =
            existingByUserId ??
            existingLocalByName ??
            (activeAccount?.type === "local" ? activeAccount : null);

          const accountId = target?.id ?? crypto.randomUUID();
          const updatedAccount: Account = {
            id: accountId,
            username: auth.user.username,
            type: "nuvoxel",
            nuvoxelUserId: auth.user.id,
          };
          const accounts = target
            ? get().accounts.map((a) => (a.id === accountId ? updatedAccount : a))
            : [...get().accounts, updatedAccount];

          set({
            accounts,
            activeAccountId: accountId,
            nuvoxelSession: session,
            nuvoxelSessions: saveNuvoxelSession(
              get().nuvoxelSessions,
              session,
            ),
            showNuvoxelLogin: false,
            showAddAccountModal: false,
            toastMessage: "loginSuccess",
          });
          setTimeout(() => set({ toastMessage: null }), 2500);
          void get().refreshFriends();
          return true;
        } catch (e) {
          const key =
            e instanceof SocialApiError
              ? loginErrorToast(e.code)
              : "nuvoxelLoginError";
          set({ toastMessage: key });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }
      },
      registerNuvoxel: async (username, email, password) => {
        try {
          const auth = await registerNuvoxelAccount({
            username: username.trim(),
            email: email.trim() || undefined,
            password,
          });
          const session = sessionFromAuth(auth);
          const existingByUserId = get().accounts.find(
            (a) => a.type === "nuvoxel" && a.nuvoxelUserId === auth.user.id,
          );
          const existingLocalByName = get().accounts.find(
            (a) =>
              a.type === "local" &&
              a.username.toLowerCase() === auth.user.username.toLowerCase(),
          );
          const activeAccount = get().accounts.find(
            (a) => a.id === get().activeAccountId,
          );
          const target =
            existingByUserId ??
            existingLocalByName ??
            (activeAccount?.type === "local" ? activeAccount : null);

          const accountId = target?.id ?? crypto.randomUUID();
          const updatedAccount: Account = {
            id: accountId,
            username: auth.user.username,
            type: "nuvoxel",
            nuvoxelUserId: auth.user.id,
          };
          const accounts = target
            ? get().accounts.map((a) => (a.id === accountId ? updatedAccount : a))
            : [...get().accounts, updatedAccount];

          set({
            accounts,
            activeAccountId: accountId,
            nuvoxelSession: session,
            nuvoxelSessions: saveNuvoxelSession(
              get().nuvoxelSessions,
              session,
            ),
            showNuvoxelLogin: false,
            showAddAccountModal: false,
            toastMessage: "registerSuccess",
          });
          setTimeout(() => set({ toastMessage: null }), 2500);
          void get().refreshFriends();
          syncAchievements(get, set, (stats) => ({
            ...stats,
            registrationTimestamp: stats.registrationTimestamp ?? Date.now(),
          }));
          return true;
        } catch (e) {
          const key =
            e instanceof SocialApiError
              ? registerErrorToast(e.code)
              : "registerError";
          set({ toastMessage: key });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return false;
        }
      },
      logoutNuvoxelId: () => {
        const session = get().nuvoxelSession;
        if (!session) return;
        const { [session.userId]: _, ...rest } = get().nuvoxelSessions;
        set({
          nuvoxelSessions: rest,
          nuvoxelSession: null,
          friends: [],
          socialApiOnline: false,
        });
      },
      refreshFriends: async () => {
        const session = get().nuvoxelSession;
        if (!session) return;
        try {
          const friends = await fetchFriends(session.token);
          set({ friends, socialApiOnline: true });
          syncAchievements(get, set);
        } catch (e) {
          if (handleSocialApiError(e)) return;
          set({ friends: [], socialApiOnline: false });
        }
      },
      removeFriend: async (friendId) => {
        const session = get().nuvoxelSession;
        if (!session) {
          get().removeLocalFriend(friendId);
          return;
        }
        try {
          await removeFriendApi(session.token, friendId);
          await get().refreshFriends();
          set({ toastMessage: "friendRemoved" });
          setTimeout(() => set({ toastMessage: null }), 2500);
        } catch (e) {
          get().removeLocalFriend(friendId);
        }
      },
      play: async (overridePackId?: string) => {
        const {
          isPlaying,
          accounts,
          activeAccountId,
          minecraftVersion,
          versionPickerLoader,
          activeModPackId,
          modPacks,
          memoryMb,
          gameDirectory,
          executablePath,
          jvmParams,
          integrityCheck,
          simultaneousDownloads,
          selectedSkin,
          activeServerId,
          resolution,
        } = get();
        if (isPlaying || get().gameRunning) return;
        if (get().confirmBeforeLaunch) {
          const pack = modPacks.find(
            (p) => p.id === (overridePackId ?? activeModPackId),
          );
          const versionLabel = pack
            ? `${pack.name} · ${pack.minecraftVersion}`
            : minecraftVersion;
          const ok = window.confirm(
            t("confirmLaunchMessage").replace("{version}", versionLabel),
          );
          if (!ok) return;
        }
        if (!accounts.length || !activeAccountId) {
          set({ showAddAccountModal: true, toastMessage: "needAccount" });
          setTimeout(() => set({ toastMessage: null }), 2500);
          return;
        }

        const account = accounts.find((a) => a.id === activeAccountId);
        if (!account) return;

        let packId = overridePackId ?? activeModPackId;
        if (packId && !modPacks.some((p) => p.id === packId)) {
          if (packId === activeModPackId) {
            set({ activeModPackId: null });
          }
          packId = null;
        }

        let pack = packId ? modPacks.find((p) => p.id === packId) : undefined;

        if (pack) {
          const resolvedPackId = pack.id;
          await get().syncPackContentFromDisk(resolvedPackId);
          pack = get().modPacks.find((p) => p.id === resolvedPackId);
          const modCount = pack?.mods?.length ?? 0;
          if (modCount > 0 && pack?.loader === "vanilla") {
            set({ toastMessage: "packVanillaModsError" });
            setTimeout(() => set({ toastMessage: null }), 4000);
            return;
          }
        }

        const effectiveVersion = pack?.minecraftVersion ?? minecraftVersion;
        const effectiveLoader = pack?.loader ?? versionPickerLoader;
        const entry: LaunchHistoryEntry = {
          id: crypto.randomUUID(),
          version: effectiveVersion,
          loader: effectiveLoader,
          label: pack?.name ?? `Minecraft ${effectiveVersion}`,
          packId: pack?.id,
        };

        const now = new Date().toLocaleString(
          getLocaleTag(get().language as Locale),
          {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          },
        );

        set({
          isPlaying: true,
          toastMessage: "launching",
          launchProgress: null,
          launchHistory: [
            entry,
            ...get().launchHistory.filter(
              (h) =>
                h.packId !== entry.packId ||
                h.version !== effectiveVersion ||
                h.label !== entry.label,
            ),
          ].slice(0, 10),
          lastLaunchByVersion: {
            ...get().lastLaunchByVersion,
            [effectiveVersion]: now,
          },
        });

        try {
          const activeServer = get().servers.find(
            (s) => s.id === activeServerId,
          );

          const launchGameDir = pack
            ? getPackInstanceDir(gameDirectory, pack.id)
            : gameDirectory;

          const launchProfile = resolveLaunchProfile({
            memoryMb,
            jvmParams,
            simultaneousDownloads,
            lowEndMode: get().lowEndMode,
            integrityCheck,
          });

          await launchMinecraft(
            {
              version: effectiveVersion,
              username: account.username,
              gameDir: launchGameDir,
              memoryMb: launchProfile.memoryMb,
              jvmParams: launchProfile.jvmParams,
              javaPath: executablePath || undefined,
              skinUsername: selectedSkin?.username,
              skinModel: selectedSkin?.model ?? "classic",
              skinCapeUsername:
                getCapeById(selectedSkin?.capeId)?.textureUsername || undefined,
              customSkinData: selectedSkin?.customSkinData ?? undefined,
              customCapeData: selectedSkin?.customCapeData ?? undefined,
              loader: effectiveLoader,
              integrityCheck: launchProfile.integrityCheck,
              simultaneousDownloads: launchProfile.simultaneousDownloads,
              serverAddress: activeServer?.address,
              serverPort: activeServer?.port,
              language: get().language,
              accountType: account.type,
              resolution,
            },
            (progress) => {
              set({
                launchProgress: progress,
                toastMessage: "launch-progress",
              });
            },
          );

          set((s) => ({
            isPlaying: false,
            gameRunning: true,
            gameVersion: effectiveVersion,
            launchProgress: null,
            toastMessage: activeServer
              ? "launchedWithServer"
              : selectedSkin
                ? "launchedWithSkin"
                : "launched",
            achievementStats: {
              ...s.achievementStats,
              gameSessionStart: Date.now(),
            },
          }));

          syncAchievements(get, set, (stats) => {
            const loaderKey = effectiveLoader;
            const launchesByLoader = {
              ...stats.launchesByLoader,
              [loaderKey]: (stats.launchesByLoader[loaderKey] ?? 0) + 1,
            };
            let uniqueServers = stats.uniqueServers;
            const serverVisits = { ...stats.serverVisits };
            if (activeServer) {
              if (!uniqueServers.includes(activeServer.id)) {
                uniqueServers = [...uniqueServers, activeServer.id];
              }
              serverVisits[activeServer.id] =
                (serverVisits[activeServer.id] ?? 0) + 1;
            }
            const modpackIdsUsed =
              pack && !stats.modpackIdsUsed.includes(pack.id)
                ? [...stats.modpackIdsUsed, pack.id]
                : stats.modpackIdsUsed;
            const hasOptifine =
              pack?.mods?.some((m) => /optifine/i.test(m.name)) ?? false;
            return {
              ...stats,
              totalLaunches: stats.totalLaunches + 1,
              launchesByLoader,
              uniqueServers,
              serverVisits,
              modpackIdsUsed,
              forgeOptifineUsed:
                stats.forgeOptifineUsed ||
                (effectiveLoader === "forge" && hasOptifine),
            };
          });
          void applyLauncherWindowBehavior(get().launcherBehavior);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : String(err);
          if (isJavaLaunchError(message)) {
            get().openJavaPathModal(message, overridePackId ?? packId ?? null);
          }
          set({
            isPlaying: false,
            gameRunning: false,
            gameVersion: "",
            launchProgress: null,
            toastMessage: translateLaunchError(message),
          });
        }

        setTimeout(() => set({ toastMessage: null }), 8000);
      },
      quickLaunchFromHistory: async (entry) => {
        const { modPacks } = get();
        if (entry.packId && modPacks.some((p) => p.id === entry.packId)) {
          get().setActiveModPack(entry.packId);
          await get().play(entry.packId);
          return;
        }
        set({
          activeModPackId: null,
          minecraftVersion: entry.version,
          versionPickerLoader: entry.loader,
        });
        await get().play();
      },
      showToast: (msg) => set({ toastMessage: msg }),
      clearLaunchHistoryForVersion: (version) => {
        set((s) => {
          const { [version]: _, ...restLast } = s.lastLaunchByVersion;
          return {
            launchHistory: s.launchHistory.filter((h) => h.version !== version),
            lastLaunchByVersion: restLast,
          };
        });
      },
      clearToast: () => set({ toastMessage: null }),
      setSelectedSkin: (skin) => {
        if (skin) saveSelectedSkin(skin);
        else localStorage.removeItem(SKIN_STORAGE_KEY);
        set({ selectedSkin: skin });
        if (skin) {
          const isCustom =
            !skin.id.startsWith("default-") && skin.username !== "Steve";
          syncAchievements(get, set, (stats) => ({
            ...stats,
            skinChangeCount: stats.skinChangeCount + 1,
            uploadedCustomSkin: stats.uploadedCustomSkin || isCustom,
            uploaded4kSkin:
              stats.uploaded4kSkin || skin.id.includes("4k"),
            uploadedAnimatedCape: stats.uploadedAnimatedCape,
          }));
        }
      },
      setSkinModel: (model) => {
        const current = get().selectedSkin;
        if (!current) {
          const skin: SelectedSkin = {
            id: "default-steve",
            name: "Steve",
            username: "Steve",
            model,
            capeId: null,
          };
          saveSelectedSkin(skin);
          set({ selectedSkin: skin });
          return;
        }
        const updated = { ...current, model };
        saveSelectedSkin(updated);
        set({ selectedSkin: updated });
        if (model === "slim") {
          syncAchievements(get, set, { triedSlimModel: true });
        }
      },
      setSelectedCape: (capeId) => {
        const current = get().selectedSkin;
        if (!current) {
          const skin: SelectedSkin = {
            id: "default-steve",
            name: "Steve",
            username: "Steve",
            model: "classic",
            capeId,
          };
          saveSelectedSkin(skin);
          set({ selectedSkin: skin });
          return;
        }
        const updated = { ...current, capeId, customCapeData: null };
        saveSelectedSkin(updated);
        set({ selectedSkin: updated });
        if (capeId) {
          syncAchievements(get, set, (stats) => ({
            ...stats,
            uploadedCape: true,
            uploadedAnimatedCape:
              stats.uploadedAnimatedCape || capeId.includes("animated"),
          }));
        }
      },
      addServer: ({ name, address, port, playAfterAdd }) => {
        const normalizedAddress = address.trim().toLowerCase();
        const normalizedPort = Math.min(65535, Math.max(1, Math.round(port)));
        let id = "";
        set((s) => ({
          servers: (() => {
            const existing = s.servers.find(
              (server) =>
                server.address.trim().toLowerCase() === normalizedAddress &&
                server.port === normalizedPort,
            );
            if (existing) {
              id = existing.id;
              return s.servers;
            }
            id = crypto.randomUUID();
            return [
              ...s.servers,
              {
                id,
                name: name.trim() || address.trim(),
                address: address.trim(),
                port: normalizedPort,
                favorite: false,
              },
            ];
          })(),
          activeServerId: id,
        }));
        if (playAfterAdd || get().autoPlayOnServerAdd) {
          void get().play();
        }
        return id;
      },
      removeServer: (id) => {
        set((s) => ({
          servers: s.servers.filter((srv) => srv.id !== id),
          activeServerId: s.activeServerId === id ? null : s.activeServerId,
        }));
      },
      setActiveServer: (id) => set({ activeServerId: id }),
      toggleServerFavorite: (id) => {
        set((s) => ({
          servers: s.servers.map((srv) =>
            srv.id === id ? { ...srv, favorite: !srv.favorite } : srv,
          ),
        }));
      },
    }),
    {
      name: STORE_KEY,
      onRehydrateStorage: () => (state) => {
        const lang = state?.language ?? readStoredLanguage();
        setI18nLocale(lang as Locale);
        if (!state) return;

        const modPacks = dedupeModPacks(state.modPacks ?? []);
        const activeModPackId =
          state.activeModPackId &&
          modPacks.some((p) => p.id === state.activeModPackId)
            ? state.activeModPackId
            : null;

        if (
          packsNeedDedupe(state.modPacks ?? []) ||
          activeModPackId !== state.activeModPackId
        ) {
          useAppStore.setState({ modPacks, activeModPackId });
        }

        const accounts = (state.accounts ?? []).map((account) => {
          const legacy = account as Account & Record<string, unknown>;
          if (String(legacy.type) !== LEGACY_ACCOUNT_TYPE) {
            return account;
          }
          const oldUserId = legacy[LEGACY_USER_ID_FIELD];
          return {
            ...account,
            type: "nuvoxel" as const,
            nuvoxelUserId:
              account.nuvoxelUserId ??
              (typeof oldUserId === "string" ? oldUserId : undefined),
          };
        });
        if (accounts.some((a, i) => a !== state.accounts?.[i])) {
          useAppStore.setState({ accounts });
        }

        let sessions = state.nuvoxelSessions ?? {};
        if (state.nuvoxelSession && !sessions[state.nuvoxelSession.userId]) {
          sessions = {
            ...sessions,
            [state.nuvoxelSession.userId]: state.nuvoxelSession,
          };
        }
        const activeAccount = accounts.find(
          (a) => a.id === state.activeAccountId,
        );
        const session =
          activeAccount?.type === "nuvoxel" && activeAccount.nuvoxelUserId
            ? (sessions[activeAccount.nuvoxelUserId] ?? null)
            : null;
        useAppStore.setState({ nuvoxelSessions: sessions, nuvoxelSession: session });
      },
      partialize: (s) => ({
        accounts: s.accounts,
        activeAccountId: s.activeAccountId,
        minecraftVersion: s.minecraftVersion,
        modPacks: s.modPacks,
        activeModPackId: s.activeModPackId,
        versionPickerLoader: s.versionPickerLoader,
        launchHistory: s.launchHistory,
        lastLaunchByVersion: s.lastLaunchByVersion,
        theme: s.theme,
        systemTheme: s.systemTheme,
        accentColor: s.accentColor,
        fontSize: s.fontSize,
        streamerMode: s.streamerMode,
        homeBackgroundEnabled: s.homeBackgroundEnabled,
        homeBlurPercent: s.homeBlurPercent,
        homeDimPercent: s.homeDimPercent,
        homeBackgroundPreset: s.homeBackgroundPreset,
        sidebarCompact: s.sidebarCompact,
        sidebarGlow: s.sidebarGlow,
        reduceMotion: s.reduceMotion,
        uiAnimations: s.uiAnimations,
        pageTransitions: s.pageTransitions,
        openAnimations: s.openAnimations,
        keyboardShortcuts: s.keyboardShortcuts,
        glassShimmer: s.glassShimmer,
        glassShimmerSpeed: s.glassShimmerSpeed,
        glassShimmerIntensity: s.glassShimmerIntensity,
        glassShimmerScope: s.glassShimmerScope,
        hoverEffects: s.hoverEffects,
        accentPulse: s.accentPulse,
        buttonGlowEffects: s.buttonGlowEffects,
        cardShadowIntensity: s.cardShadowIntensity,
        sidebarTransparency: s.sidebarTransparency,
        panelBorderGlow: s.panelBorderGlow,
        scrollbarStyle: s.scrollbarStyle,
        contentSpacing: s.contentSpacing,
        uiRoundness: s.uiRoundness,
        interfaceScale: s.interfaceScale,
        glassIntensity: s.glassIntensity,
        showHomeStats: s.showHomeStats,
        showLauncherTips: s.showLauncherTips,
        confirmBeforeLaunch: s.confirmBeforeLaunch,
        quickLaunchDoubleClick: s.quickLaunchDoubleClick,
        retroSoundsEnabled: s.retroSoundsEnabled,
        compactLists: s.compactLists,
        copyVersionOnClick: s.copyVersionOnClick,
        settingsSection: s.settingsSection,
        language: s.language,
        launcherBehavior: s.launcherBehavior,
        showSkins: s.showSkins,
        logging: s.logging,
        devMode: s.devMode,
        lowEndMode: s.lowEndMode,
        curseforgeApiKey: s.curseforgeApiKey,
        autoPlayOnServerAdd: s.autoPlayOnServerAdd,
        memoryMb: s.memoryMb,
        resolution: s.resolution,
        gameDirectory: s.gameDirectory,
        integrityCheck: s.integrityCheck,
        executablePath: s.executablePath,
        jvmParams: s.jvmParams,
        proxy: s.proxy,
        simultaneousDownloads: s.simultaneousDownloads,
        downloadMirror: s.downloadMirror,
        sslCheck: s.sslCheck,
        selectedSkin: s.selectedSkin,
        servers: s.servers,
        activeServerId: s.activeServerId,
        nuvoxelSession: s.nuvoxelSession,
        nuvoxelSessions: s.nuvoxelSessions,
        socialApiUrl: s.socialApiUrl,
        localFriends: s.localFriends,
        achievementStats: s.achievementStats,
        unlockedAchievements: s.unlockedAchievements,
      }),
    },
  ),
);

export function useActiveAccount(): Account | null {
  const accounts = useAppStore((s) => s.accounts);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  if (!activeAccountId) return null;
  return accounts.find((a) => a.id === activeAccountId) ?? null;
}

export function useActiveModPack(): ModPack | null {
  const modPacks = useAppStore((s) => s.modPacks);
  const activeModPackId = useAppStore((s) => s.activeModPackId);
  if (!activeModPackId) return null;
  return modPacks.find((p) => p.id === activeModPackId) ?? null;
}

export function useHasAccount(): boolean {
  const accounts = useAppStore((s) => s.accounts);
  const activeAccountId = useAppStore((s) => s.activeAccountId);
  return accounts.length > 0 && !!activeAccountId;
}
