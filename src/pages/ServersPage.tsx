import { useEffect, useState } from "react";
import {
  Globe,
  Loader2,
  Play,
  Plus,
  Server,
  Star,
  Trash2,
  Users,
} from "lucide-react";
import { t } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import {
  isValidServerEndpoint,
  parseServerAddress,
  pingServer,
} from "../services/serverPing";

export function ServersPage() {
  const servers = useAppStore((s) => s.servers);
  const activeServerId = useAppStore((s) => s.activeServerId);
  const addServer = useAppStore((s) => s.addServer);
  const removeServer = useAppStore((s) => s.removeServer);
  const setActiveServer = useAppStore((s) => s.setActiveServer);
  const toggleServerFavorite = useAppStore((s) => s.toggleServerFavorite);
  const play = useAppStore((s) => s.play);
  const autoPlayOnServerAdd = useAppStore((s) => s.autoPlayOnServerAdd);
  const setAutoPlayOnServerAdd = useAppStore((s) => s.setAutoPlayOnServerAdd);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [port, setPort] = useState("25565");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<
    Record<string, { loading: boolean; online?: boolean; players?: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      for (const srv of servers) {
        if (cancelled) return;
        setStatusMap((m) => ({ ...m, [srv.id]: { loading: true } }));
        const st = await pingServer(srv.address, srv.port);
        if (cancelled) return;
        setStatusMap((m) => ({
          ...m,
          [srv.id]: {
            loading: false,
            online: st.online,
            players: st.players,
          },
        }));
      }
    };
    if (servers.length) void load();
    return () => {
      cancelled = true;
    };
  }, [servers]);

  const submit = (e: React.FormEvent, playAfterAdd = false) => {
    e.preventDefault();
    const parsed = parseServerAddress(address);
    const enteredPort = port.trim() ? Number(port) : parsed.port;
    const endpoint = {
      address: parsed.address,
      port: address.includes(":") && port === "25565" ? parsed.port : enteredPort,
    };
    if (!isValidServerEndpoint(endpoint.address, endpoint.port)) {
      setFormError(t("serverAddressInvalid"));
      return;
    }
    setFormError(null);
    addServer({
      name: name.trim() || address.trim(),
      address: endpoint.address,
      port: endpoint.port,
      playAfterAdd,
    });
    setName("");
    setAddress("");
    setPort("25565");
    setShowForm(false);
  };

  const active = servers.find((s) => s.id === activeServerId);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("serversTitle")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            {t("serversSubtitle")}
          </p>
          <p className="mt-2 text-xs text-[var(--accent)]">
            {t("offlineMultiplayerHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="no-drag flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          {t("addServer")}
        </button>
      </div>

      {active && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-3">
          <span className="text-sm">
            {t("activeServer")}: <strong>{active.name}</strong> ({active.address}:
            {active.port})
          </span>
          <button
            type="button"
            onClick={() => setActiveServer(null)}
            className="no-drag text-sm text-text-secondary hover:text-text-primary"
          >
            {t("clearActiveServer")}
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={(e) => submit(e, false)}
          className="mb-6 grid gap-3 rounded-2xl border border-border bg-bg-card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("serverName")}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          {formError && (
            <p className="text-sm text-red-400 sm:col-span-2 lg:col-span-4">
              {formError}
            </p>
          )}
          <input
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("serverAddress")}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <input
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder={t("serverPortDefault")}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="no-drag rounded-lg bg-[var(--accent)] py-2 text-sm font-semibold text-white"
          >
            {t("addServer")}
          </button>
          <button
            type="button"
            onClick={(e) => submit(e, true)}
            className="no-drag flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)]/20 sm:col-span-2 lg:col-span-4"
          >
            <Play className="h-4 w-4 fill-current" />
            {t("addServerAndPlay")}
          </button>
          <label className="flex items-center gap-2 text-xs text-text-muted sm:col-span-2 lg:col-span-4">
            <input
              type="checkbox"
              checked={autoPlayOnServerAdd}
              onChange={(e) => setAutoPlayOnServerAdd(e.target.checked)}
              className="rounded border-border"
            />
            {t("autoPlayOnServerAdd")}
          </label>
        </form>
      )}

      {servers.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Server className="mb-4 h-16 w-16 text-text-muted" />
          <h2 className="text-xl font-semibold">{t("noServers")}</h2>
          <p className="mt-2 max-w-md text-sm text-text-secondary">
            {t("noServersDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {servers.map((srv) => {
            const st = statusMap[srv.id];
            const isActive = srv.id === activeServerId;
            return (
              <div
                key={srv.id}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-border bg-bg-card"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                  <Globe className="h-6 w-6 text-[var(--accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{srv.name}</h3>
                    {srv.favorite && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-text-muted">
                    {srv.address}:{srv.port}
                  </p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {t("offlineServerOk")}
                  </p>
                </div>
                <div className="text-right text-sm">
                  {st?.loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
                  ) : st?.online ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      {t("serverOnline")}
                      {st.players !== undefined && (
                        <span className="ml-2 flex items-center gap-1 text-text-secondary">
                          <Users className="h-3.5 w-3.5" />
                          {t("playersOnline", { count: st.players })}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-text-muted">{t("serverOffline")}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleServerFavorite(srv.id)}
                    className="no-drag rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5"
                  >
                    {t("favoriteServer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveServer(srv.id);
                      void play();
                    }}
                    className="no-drag flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    {t("playOnServer")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeServer(srv.id)}
                    className="no-drag rounded-lg border border-border px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
