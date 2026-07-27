import { useEffect, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { BlurOverlay } from "../ui/BlurOverlay";
import { t } from "../../i18n";
import { useAppStore } from "../../store/useAppStore";

type AuthMode = "login" | "register";

export function NuvoxelLoginModal() {
  const open = useAppStore((s) => s.showNuvoxelLogin);
  const setOpen = useAppStore((s) => s.setShowNuvoxelLogin);
  const loginNuvoxel = useAppStore((s) => s.loginNuvoxel);
  const registerNuvoxel = useAppStore((s) => s.registerNuvoxel);
  const setShowAddAccountModal = useAppStore((s) => s.setShowAddAccountModal);
  const setAddAccountView = useAppStore((s) => s.setAddAccountView);

  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setMode("login");
      setUsername("");
      setEmail("");
      setPassword("");
    }
  }, [open]);

  const handleSubmit = async () => {
    setLoading(true);
    const ok =
      mode === "login"
        ? await loginNuvoxel(email.trim(), password)
        : await registerNuvoxel(username.trim(), email.trim(), password);
    setLoading(false);
    if (ok) {
      setUsername("");
      setEmail("");
      setPassword("");
    }
  };

  const goBack = () => {
    setOpen(false);
    setShowAddAccountModal(true);
    setAddAccountView("select");
  };

  if (!open) return null;

  const canSubmit =
    mode === "login"
      ? email.trim().length > 0 && password.length >= 4
      : username.trim().length >= 2 && password.length >= 4;

  return (
    <BlurOverlay
      open={open}
      onClose={() => setOpen(false)}
      className="items-center justify-center px-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("backToSelection")}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex flex-col items-center text-text-muted hover:text-text-primary"
          >
            <X className="h-5 w-5" />
            <span className="text-[10px]">{t("esc")}</span>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <img src="/logo.svg" alt="" className="h-12 w-12 rounded-xl" />
            <div>
              <h2 className="text-xl font-bold">
                {mode === "login" ? t("nuvoxelLoginTitle") : t("nuvoxelRegisterTitle")}
              </h2>
              <p className="text-sm text-text-muted">{t("nuvoxelLoginDesc")}</p>
            </div>
          </div>

          <div className="mb-4 flex rounded-xl border border-border bg-bg-elevated p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-[var(--accent)] text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t("login")}
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                mode === "register"
                  ? "bg-[var(--accent)] text-white"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              {t("register")}
            </button>
          </div>

          <div className="space-y-4" onKeyDown={(e) => {
            if (e.key === "Enter" && canSubmit && !loading) void handleSubmit();
          }}>
            {mode === "register" ? (
              <div>
                <label className="mb-1.5 block text-sm text-text-secondary">
                  {t("usernameLabel")}
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t("usernamePlaceholder")}
                  className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>
            ) : null}

            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                {mode === "login" ? t("emailOrNick") : t("emailOptional")}
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  mode === "login"
                    ? t("emailOrNickPlaceholder")
                    : t("emailOptionalPlaceholder")
                }
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-text-secondary">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={loading || !canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded bg-white/20 text-xs font-bold">
                N
              </span>
              {mode === "login" ? t("login") : t("register")}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-text-muted">
            {t("socialApiHint")}
          </p>
        </div>
      </div>
    </BlurOverlay>
  );
}
