import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn, Palette, Sparkles } from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";

export function LoginPage() {
  const { t } = useWebI18n();
  const login = useWebsiteStore((s) => s.login);
  const auth = useWebsiteStore((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? "/skins";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (auth?.loggedIn) navigate(from, { replace: true });
  }, [auth, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
    navigate(from, { replace: true });
  };

  const features = [
    { icon: Palette, text: t("loginFeat1") },
    { icon: Sparkles, text: t("loginFeat2") },
    { icon: LogIn, text: t("loginFeat3") },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 lg:flex-row lg:px-6">
      <div className="flex-1">
        <p className="section-label mb-2">{t("loginLabel")}</p>
        <h1 className="text-4xl font-bold">{t("loginTitle")}</h1>
        <p className="mt-4 text-zinc-400">{t("loginDesc")}</p>

        <ul className="mt-8 space-y-4">
          {features.map((f) => (
            <li key={f.text} className="flex items-start gap-3 text-sm text-zinc-300">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--nl-green)]" />
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={submit}
        className="glass-card w-full max-w-md space-y-4 p-8 lg:shrink-0"
      >
        <h2 className="text-xl font-semibold">{t("loginFormTitle")}</h2>
        <p className="text-sm text-zinc-500">{t("loginFormHint")}</p>
        <label className="block">
          <span className="text-sm text-zinc-400">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
            placeholder="player@mail.com"
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-400">{t("loginPassword")}</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              {t("login")}
            </>
          )}
        </button>
        <p className="text-center text-sm text-zinc-500">
          {t("loginNoAccount")}{" "}
          <Link to="/download" className="text-[var(--nl-green)] hover:underline">
            {t("loginGetLauncher")}
          </Link>
        </p>
      </form>
    </div>
  );
}
