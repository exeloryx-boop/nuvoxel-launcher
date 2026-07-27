import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn, UserPlus, ShieldCheck, Palette, Sparkles } from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";

export function LoginPage() {
  const { t } = useWebI18n();
  const login = useWebsiteStore((s) => s.login);
  const register = useWebsiteStore((s) => s.register);
  const auth = useWebsiteStore((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? (auth?.role === "admin" ? "/admin" : "/skins");

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (auth?.loggedIn) {
      navigate(auth.role === "admin" ? "/admin" : from, { replace: true });
    }
  }, [auth, from, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (mode === "login") {
      const res = await login(email || username, password);
      setLoading(false);
      if (!res.ok) {
        if (res.error === "INVALID_CREDENTIALS") {
          setErrorMsg("Невірний логін або пароль");
        } else {
          setErrorMsg(res.error || "Помилка входу");
        }
      }
    } else {
      if (password !== confirmPassword) {
        setLoading(false);
        setErrorMsg("Паролі не збігаються");
        return;
      }
      if (password.length < 4) {
        setLoading(false);
        setErrorMsg("Пароль повинен бути не менше 4 символів");
        return;
      }
      const res = await register(username, email, password);
      setLoading(false);
      if (!res.ok) {
        if (res.error === "USER_EXISTS") {
          setErrorMsg("Користувач із таким ніком або email вже існує");
        } else {
          setErrorMsg(res.error || "Помилка реєстрації");
        }
      }
    }
  };

  const features = [
    { icon: Palette, text: t("loginFeat1") },
    { icon: Sparkles, text: t("loginFeat2") },
    { icon: ShieldCheck, text: "Єдиний акаунт для сайту, лаунчера та гри з друзями" },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 lg:flex-row lg:px-6">
      <div className="flex-1">
        <p className="section-label mb-2">{t("loginLabel")}</p>
        <h1 className="text-4xl font-bold">
          {mode === "login" ? t("loginTitle") : "Створення акаунту Wynsense"}
        </h1>
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

      <div className="glass-card w-full max-w-md p-8 lg:shrink-0">
        <div className="mb-6 flex rounded-lg border border-white/10 bg-black/40 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMsg(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-[var(--nl-green)] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Вхід
          </button>
          <button
            type="button"
            onClick={() => { setMode("register"); setErrorMsg(""); }}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              mode === "register"
                ? "bg-[var(--nl-green)] text-white shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Реєстрація
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-sm text-zinc-400">Нікнейм гравця</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
                placeholder="Steve"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm text-zinc-400">
              {mode === "login" ? "Email або Нікнейм" : "Email адреса"}
            </span>
            <input
              type={mode === "register" ? "email" : "text"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
              placeholder={mode === "login" ? "steve / player@mail.com" : "player@mail.com"}
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

          {mode === "register" && (
            <label className="block">
              <span className="text-sm text-zinc-400">Підтвердження пароля</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-[var(--nl-green)]"
                placeholder="••••••••"
              />
            </label>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "login" ? (
              <>
                <LogIn className="h-5 w-5" />
                {t("login")}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Зареєструватися
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          {t("loginNoAccount")}{" "}
          <Link to="/download" className="text-[var(--nl-green)] hover:underline font-semibold">
            {t("loginGetLauncher")}
          </Link>
        </p>
      </div>
    </div>
  );
}
