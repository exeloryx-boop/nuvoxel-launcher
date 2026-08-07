import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LogIn, UserPlus, ShieldCheck, Palette, Sparkles, Gamepad2, Info } from "lucide-react";
import { useWebsiteStore } from "../store/useWebsiteStore";
import { useWebI18n } from "../hooks/useWebI18n";

export function LoginPage() {
  const { t } = useWebI18n();
  const login = useWebsiteStore((s) => s.login);
  const register = useWebsiteStore((s) => s.register);
  const completeLauncherSignIn = useWebsiteStore((s) => s.completeLauncherSignIn);
  const auth = useWebsiteStore((s) => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const launcherCode = searchParams.get("launcherCode");
  const from = (location.state as { from?: string })?.from ?? (auth?.role === "admin" ? "/admin" : "/profile");

  const [mode, setMode] = useState<"login" | "register" | "launcher">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [launcherStatus, setLauncherStatus] = useState("");
  const completedLauncherCode = useRef<string | null>(null);

  useEffect(() => {
    if (auth?.loggedIn) {
      if (launcherCode) {
        if (completedLauncherCode.current === launcherCode) return;
        completedLauncherCode.current = launcherCode;
        void completeLauncherSignIn(launcherCode).then((result) => {
          setLauncherStatus(
            result.ok
              ? "Готово! Поверніться до Nuvoxel Launcher — вхід буде завершено автоматично."
              : "Не вдалося підтвердити вхід. Поверніться до лаунчера й спробуйте ще раз.",
          );
        });
        return;
      }
      navigate(auth.role === "admin" ? "/admin" : from, { replace: true });
    }
  }, [auth, completeLauncherSignIn, from, launcherCode, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (mode === "login" || mode === "launcher") {
      const res = await login(email || username, password);
      setLoading(false);
      if (!res.ok) {
        if (res.error === "INVALID_CREDENTIALS") {
          setErrorMsg("Невірний логін або пароль лаунчера");
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
    { icon: Gamepad2, text: "Єдиний акаунт для сайту, Nuvoxel Launcher та гри" },
    { icon: Palette, text: t("loginFeat1") },
    { icon: Sparkles, text: t("loginFeat2") },
    { icon: ShieldCheck, text: "Миттєва синхронізація друзів та скінів" },
  ];

  return (
    <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 lg:flex-row lg:px-6 overflow-hidden">
      {/* Background Orbs */}
      <div className="orb orb-1 opacity-30"></div>
      <div className="orb orb-2 opacity-30"></div>

      <div className="flex-1 relative z-10 animate-fade-up">
        <p className="section-label mb-2">{t("loginLabel")}</p>
        <h1 className="text-4xl font-bold text-white tracking-tight">
          {mode === "register" ? "Створення акаунту Nuvoxel" : "Вхід у системи Nuvoxel"}
        </h1>
        <p className="mt-4 text-zinc-400 leading-relaxed">
          Усі акаунти Nuvoxel Launcher та веб-сайту є повністю єдиними. Якщо у вас вже є акаунт у лаунчері — просто увійдіть під своїми даними!
        </p>

        <div className="mt-6 rounded-2xl border border-[var(--nl-green)]/30 bg-[var(--nl-green)]/10 p-4 backdrop-blur-md flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-[var(--nl-green)] mt-0.5" />
          <p className="text-xs text-zinc-300">
            <strong>Порада:</strong> Зареєструвавшись в Nuvoxel Launcher, ви автоматично маєте доступ до сайту та зміни скінів!
          </p>
        </div>

        <ul className="mt-8 space-y-4">
          {features.map((f) => (
            <li key={f.text} className="flex items-start gap-3 text-sm text-zinc-300">
              <f.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--nl-green)]" />
              {f.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass-card glow-border w-full max-w-md p-8 lg:shrink-0 relative z-10 animate-fade-up delay-100">
        {/* Mode Selector Tabs */}
        <div className="mb-6 flex rounded-xl border border-white/10 bg-black/50 p-1">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMsg(""); }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${
              mode === "login"
                ? "bg-[var(--nl-green)] text-white shadow-md shadow-[var(--nl-green)]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Вхід
          </button>

          <button
            type="button"
            onClick={() => { setMode("launcher"); setErrorMsg(""); }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition flex items-center justify-center gap-1 ${
              mode === "launcher"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            Акаунт Лаунчера
          </button>

          <button
            type="button"
            onClick={() => { setMode("register"); setErrorMsg(""); }}
            className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition ${
              mode === "register"
                ? "bg-[var(--nl-green)] text-white shadow-md shadow-[var(--nl-green)]/20"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Реєстрація
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 animate-bounce-in">
            {errorMsg}
          </div>
        )}

        {launcherCode && launcherStatus && (
          <div className="mb-4 rounded-xl border border-[var(--nl-green)]/30 bg-[var(--nl-green)]/10 p-3 text-xs text-zinc-200">
            {launcherStatus}
          </div>
        )}

        {mode === "launcher" && (
          <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-300">
            Введіть нікнейм або email та пароль, які ви використовуєте в <strong>Nuvoxel Launcher</strong>.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <label className="block">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Нікнейм гравця</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--nl-green)] transition"
                placeholder="Steve"
              />
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {mode === "register" ? "Email адреса" : "Нікнейм або Email"}
            </span>
            <input
              type={mode === "register" ? "email" : "text"}
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--nl-green)] transition"
              placeholder={mode === "register" ? "player@mail.com" : "Steve або player@mail.com"}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Пароль</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--nl-green)] transition"
              placeholder="••••••••"
            />
          </label>

          {mode === "register" && (
            <label className="block">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Підтвердження пароля</span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-[var(--nl-green)] transition"
                placeholder="••••••••"
              />
            </label>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-sm font-bold shadow-lg">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "login" || mode === "launcher" ? (
              <>
                <LogIn className="h-5 w-5" />
                {mode === "launcher" ? "Увійти через Лаунчер" : t("login")}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5" />
                Створити акаунт
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          У вас ще немає акаунту?{" "}
          <Link to="/download" className="text-[var(--nl-green)] hover:underline font-semibold">
            Завантажити Nuvoxel Launcher
          </Link>
        </p>
      </div>
    </div>
  );
}
