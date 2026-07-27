import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Image,
  LogOut,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  User,
} from "lucide-react";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { MinecraftAvatar } from "../ui/MinecraftAvatar";
import { getCapeById } from "@shared/skins";
import { SkinModelPicker } from "../skins/SkinModelPicker";
import { CapePicker } from "../skins/CapePicker";

const DEFAULT_COVER = "/bg-copper-age.png";
const COVER_PRESETS = [
  "/bg-copper-age.png",
  "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "linear-gradient(135deg, #2d1b4e 0%, #1a1025 100%)",
  "linear-gradient(135deg, #1b4332 0%, #081c15 100%)",
  "linear-gradient(135deg, #4a1942 0%, #1a0a18 100%)",
];

interface Props {
  accountId: string;
  username: string;
  accountType: "local" | "nuvoxel" | "microsoft";
  coverUrl?: string | null;
  skinUsername?: string;
  skinModel: "classic" | "slim";
  capeId?: string | null;
  customSkinData?: string | null;
  customCapeData?: string | null;
}

export function AccountCabinetPanel({
  accountId,
  username,
  accountType,
  coverUrl,
  skinUsername,
  skinModel,
  capeId,
  customSkinData,
  customCapeData,
}: Props) {
  const setSkinModel = useAppStore((s) => s.setSkinModel);
  const setSelectedCape = useAppStore((s) => s.setSelectedCape);
  const updateAccountUsername = useAppStore((s) => s.updateAccountUsername);
  const updateAccountCover = useAppStore((s) => s.updateAccountCover);
  const refreshAccountData = useAppStore((s) => s.refreshAccountData);
  const logoutAccount = useAppStore((s) => s.logoutAccount);
  const showToast = useAppStore((s) => s.showToast);

  const [menuOpen, setMenuOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(username);
  const [refreshing, setRefreshing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeCape = getCapeById(capeId);
  const cover = coverUrl || DEFAULT_COVER;
  const isGradient = cover.startsWith("linear-gradient");

  useEffect(() => {
    setNameDraft(username);
  }, [username]);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const saveNickname = () => {
    const next = nameDraft.trim();
    if (!next || next.length < 2) {
      showToast("nicknameInvalid");
      setTimeout(() => useAppStore.getState().clearToast(), 2500);
      return;
    }
    updateAccountUsername(accountId, next);
    setEditingName(false);
    showToast("nicknameUpdated");
    setTimeout(() => useAppStore.getState().clearToast(), 2500);
  };

  const handleCoverFile = (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateAccountCover(accountId, reader.result);
        setCoverOpen(false);
        showToast("coverUpdated");
        setTimeout(() => useAppStore.getState().clearToast(), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRefresh = async () => {
    setMenuOpen(false);
    setRefreshing(true);
    const ok = await refreshAccountData(accountId);
    setRefreshing(false);
    showToast(ok ? "accountDataRefreshed" : "accountDataRefreshError");
    setTimeout(() => useAppStore.getState().clearToast(), 2500);
  };

  const features = [
    t("localFeature1"),
    t("localFeature2"),
    t("localFeature3"),
  ];

  return (
    <div className="mt-6 space-y-4">
      <div
        className="relative overflow-hidden rounded-2xl border border-border"
        style={
          isGradient
            ? { background: cover }
            : {
                backgroundImage: `linear-gradient(to right, rgba(10,10,15,0.82), rgba(10,10,15,0.45)), url(${cover})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
        }
      >
        <div className="flex items-end justify-between p-6">
          <div className="flex items-end gap-4">
            <MinecraftAvatar
              username={username}
              skinUsername={skinUsername}
              capeTextureUsername={activeCape?.textureUsername}
              customSkinData={customSkinData}
              customCapeData={customCapeData}
              model={skinModel}
              variant="body"
              size={80}
            />
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold">{username}</h2>
                <User className="h-5 w-5 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">
                {accountType === "nuvoxel"
                  ? "Nuvoxel ID"
                  : accountType === "microsoft"
                    ? "Microsoft"
                    : t("noBinding")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCoverOpen((v) => !v)}
            className="no-drag flex items-center gap-2 rounded-lg bg-black/40 px-3 py-2 text-sm backdrop-blur transition hover:bg-black/55"
          >
            <Image className="h-4 w-4" />
            {t("cover")}
          </button>
        </div>
      </div>

      {coverOpen && (
        <div className="rounded-2xl border border-border bg-bg-card p-4">
          <p className="mb-3 text-sm font-medium">{t("chooseCover")}</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {COVER_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  updateAccountCover(accountId, preset);
                  setCoverOpen(false);
                }}
                className={`h-14 w-24 overflow-hidden rounded-lg border-2 transition hover:scale-105 ${
                  cover === preset
                    ? "border-[var(--accent)]"
                    : "border-border"
                }`}
                style={
                  preset.startsWith("linear-gradient")
                    ? { background: preset }
                    : {
                        backgroundImage: `url(${preset})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                }
              />
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleCoverFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="no-drag rounded-lg border border-border px-4 py-2 text-sm transition hover:bg-white/5"
          >
            {t("uploadCover")}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {editingName ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              maxLength={16}
              className="no-drag flex-1 rounded-xl border border-[var(--accent)] bg-bg-card px-4 py-2.5 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") saveNickname();
                if (e.key === "Escape") {
                  setEditingName(false);
                  setNameDraft(username);
                }
              }}
            />
            <button
              type="button"
              onClick={saveNickname}
              className="no-drag rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("save")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="no-drag flex items-center gap-2 rounded-xl border border-border bg-bg-card px-4 py-2.5 text-sm transition hover:border-white/20"
          >
            <Pencil className="h-4 w-4" />
            {t("changeNickname")}
          </button>
        )}

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="no-drag rounded-xl border border-border bg-bg-card px-3 py-2.5 transition hover:border-white/20"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-xl border border-border bg-bg-card py-1 shadow-xl">
              <button
                type="button"
                disabled={refreshing}
                onClick={() => void handleRefresh()}
                className="no-drag flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-white/5 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin-slow" : ""}`}
                />
                {t("refreshAccountData")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logoutAccount(accountId);
                }}
                className="no-drag flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                {t("logoutAccount")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <SkinModelPicker value={skinModel} onChange={setSkinModel} />
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-6">
        <CapePicker value={capeId ?? null} onChange={setSelectedCape} />
      </div>

      {accountType === "local" && (
        <div className="rounded-2xl border border-border bg-bg-card p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{t("localAccount")}</h3>
              <p className="text-sm text-text-secondary">{t("localAccountDesc")}</p>
            </div>
          </div>
          <ul className="mb-4 space-y-2">
            {features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 text-sm text-text-secondary"
              >
                <Check className="h-4 w-4 text-[var(--accent)]" />
                {f}
              </li>
            ))}
          </ul>
          <div className="flex items-start gap-2 rounded-lg border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {t("offlineWarning")}
          </div>
        </div>
      )}
    </div>
  );
}
