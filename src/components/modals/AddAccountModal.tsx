import { useState } from "react";
import { Diamond, Layers, User } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";
import { MinecraftAvatar } from "../ui/MinecraftAvatar";

export function AddAccountModal() {
  const open = useAppStore((s) => s.showAddAccountModal);
  const setOpen = useAppStore((s) => s.setShowAddAccountModal);
  const setShowNuvoxelLogin = useAppStore((s) => s.setShowNuvoxelLogin);
  const addLocalAccount = useAppStore((s) => s.addLocalAccount);
  const [localName, setLocalName] = useState("");

  const handleLocalAdd = () => {
    const name = localName.trim() || `Player${Math.floor(Math.random() * 9999)}`;
    addLocalAccount(name);
    setLocalName("");
  };

  const openNuvoxelLogin = () => {
    setOpen(false);
    setShowNuvoxelLogin(true);
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title={t("addAccountTitle")}
      size="xl"
    >
      <div className="grid grid-cols-3 gap-4 p-6">
        <NuvoxelColumn onAuth={openNuvoxelLogin} />
        <MicrosoftColumn />
        <LocalColumn
          localName={localName}
          onNameChange={setLocalName}
          onAdd={handleLocalAdd}
        />
      </div>
    </Modal>
  );
}

function FeatureItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2 text-sm text-text-secondary">
      <Diamond className="mt-0.5 h-3 w-3 shrink-0 fill-[var(--accent)] text-[var(--accent)]" />
      {text}
    </li>
  );
}

function NuvoxelColumn({ onAuth }: { onAuth: () => void }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-elevated p-4">
      <h3 className="mb-4 text-lg font-semibold">{t("nuvoxelAccount")}</h3>

      <div className="mb-3 rounded-lg border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-8 w-8 rounded-md" />
            <div>
              <p className="text-sm font-medium">{t("hdSkins")}</p>
              <p className="text-xs text-text-muted">{t("hdSkinsFree")}</p>
            </div>
          </div>
          <Badge variant="accent">{t("freeBadge")}</Badge>
        </div>
        <div className="flex gap-2">
          {["Alex", "Steve", "Notch"].map((name) => (
            <MinecraftAvatar key={name} username={name} size={40} />
          ))}
        </div>
      </div>

      <div className="mb-4 flex-1 rounded-lg border border-border bg-bg-card p-3">
        <div className="mb-2 flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <div>
            <p className="text-sm font-medium">{t("modpacks")}</p>
            <p className="text-xs text-text-muted">{t("modpacksDesc")}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg bg-bg-elevated p-2">
            <div className="h-6 w-6 rounded bg-green-500/30" />
            <div>
              <p className="text-xs font-medium">{t("modrinth")}</p>
              <p className="text-[11px] text-text-muted">{t("modrinthDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-bg-elevated p-2">
            <div className="h-6 w-6 rounded bg-orange-500/30" />
            <div>
              <p className="text-xs font-medium">{t("curseforge")}</p>
              <p className="text-[11px] text-text-muted">{t("curseforgeDesc")}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onAuth}
        className="no-drag flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
      >
        <img src="/logo.svg" alt="" className="h-5 w-5 rounded" />
        {t("authNuvoxel")}
      </button>
    </div>
  );
}

function MicrosoftColumn() {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-elevated p-4">
      <h3 className="mb-4 text-lg font-semibold">{t("microsoftAccount")}</h3>

      <div className="mb-6 flex justify-center">
        <MicrosoftLogo />
      </div>

      <ul className="mb-6 flex-1 space-y-3">
        <FeatureItem text={t("msFeature1")} />
        <FeatureItem text={t("msFeature2")} />
        <FeatureItem text={t("msFeature3")} />
      </ul>

      <button
        type="button"
        className="no-drag flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-card py-3 text-sm font-medium text-text-primary transition hover:bg-white/5"
      >
        <MicrosoftLogo small />
        {t("authMicrosoft")}
      </button>
    </div>
  );
}

function LocalColumn({
  localName,
  onNameChange,
  onAdd,
}: {
  localName: string;
  onNameChange: (v: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-bg-elevated p-4">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("localAccountShort")}</h3>
        <Badge variant="default">✦ {t("popular")}</Badge>
      </div>
      <p className="mb-4 text-sm text-text-muted">{t("onlyNickname")}</p>

      <ul className="mb-4 space-y-3">
        <FeatureItem text={t("localShortFeature1")} />
        <FeatureItem text={t("localShortFeature2")} />
        <FeatureItem text={t("localShortFeature3")} />
      </ul>

      <div className="mb-4 flex flex-1 flex-col items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          <User className="h-12 w-12 text-text-muted" />
        </div>
        <input
          type="text"
          value={localName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          className="no-drag mt-4 w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-center text-sm text-text-primary outline-none focus:border-[var(--accent)]"
        />
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="no-drag flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-bg-card py-3 text-sm font-medium text-text-primary transition hover:bg-white/5"
      >
        <User className="h-4 w-4" />
        {t("addAccount")}
      </button>
    </div>
  );
}

function MicrosoftLogo({ small = false }: { small?: boolean }) {
  const size = small ? 16 : 48;
  return (
    <div
      className="grid grid-cols-2 gap-0.5"
      style={{ width: size, height: size }}
    >
      <div className="bg-[#f25022]" />
      <div className="bg-[#7fba00]" />
      <div className="bg-[#00a4ef]" />
      <div className="bg-[#ffb900]" />
    </div>
  );
}
