import type {
  ChatMessage,
  FriendProfile,
  NuvoxelSession,
  NuvoxelUser,
  SharedPack,
  SharedPackMod,
  SocialApiErrorCode,
} from "../types/social";
import { SocialApiError } from "../types/social";
import { useAppStore } from "../store/useAppStore";

const DEFAULT_API = "https://nuvoxel-launcher.onrender.com";

export function getSocialApiUrl(): string {
  const fromStore = useAppStore.getState().socialApiUrl?.trim();
  if (fromStore) return fromStore.replace(/\/$/, "");
  const fromEnv = import.meta.env.VITE_NUVOXEL_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_API;
}

async function request<T>(
  path: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const { token, headers, ...rest } = init ?? {};
  let res: Response;
  try {
    res = await fetch(`${getSocialApiUrl()}${path}`, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new SocialApiError("NETWORK");
  }

  const body = (await res.json().catch(() => ({}))) as {
    error?: SocialApiErrorCode;
    message?: string;
  };

  if (!res.ok) {
    throw new SocialApiError(body.error ?? "SERVER_ERROR", body.message);
  }

  return body as T;
}

export async function getOrCreateQuickSession(
  username: string,
): Promise<NuvoxelSession> {
  const res = await request<{ token: string; user: NuvoxelUser }>("/auth/quick-session", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  return {
    token: res.token,
    userId: res.user.id,
    username: res.user.username,
    friendCode: res.user.friendCode,
  };
}

function isFriendProfile(value: unknown): value is FriendProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.username === "string" &&
    typeof v.online === "boolean"
  );
}

export function handleSocialApiError(error: unknown): boolean {
  if (!(error instanceof SocialApiError)) return false;
  if (error.code === "UNAUTHORIZED") {
    useAppStore.getState().invalidateNuvoxelSession();
    return true;
  }
  return false;
}

export async function checkSocialApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${getSocialApiUrl()}/health`, {
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerNuvoxelAccount(input: {
  username: string;
  email?: string;
  password: string;
}): Promise<{ token: string; user: NuvoxelUser }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginNuvoxelAccount(input: {
  login: string;
  password: string;
}): Promise<{ token: string; user: NuvoxelUser }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMe(token: string): Promise<FriendProfile> {
  return request("/auth/me", { token });
}

export async function fetchFriends(token: string): Promise<FriendProfile[]> {
  const data = await request<unknown>("/friends", { token });
  if (!Array.isArray(data)) return [];
  return data.filter(isFriendProfile).map((f) => ({
    ...f,
    status: typeof f.status === "string" ? f.status : f.online ? "online" : "offline",
  }));
}

export async function addFriendByCode(
  token: string,
  code: string,
): Promise<FriendProfile> {
  return request("/friends", {
    method: "POST",
    token,
    body: JSON.stringify({ code }),
  });
}

export async function removeFriend(
  token: string,
  friendId: string,
): Promise<void> {
  await request(`/friends/${friendId}`, { method: "DELETE", token });
}

export async function sendPresence(
  token: string,
  status: string,
): Promise<void> {
  await request("/presence", {
    method: "POST",
    token,
    body: JSON.stringify({ status }),
  });
}

export async function sendChatMessage(
  token: string,
  text: string,
  channel: string = "global",
  recipientId?: string,
): Promise<ChatMessage> {
  return request("/chat/send", {
    method: "POST",
    token,
    body: JSON.stringify({ text, channel, recipientId }),
  });
}

export async function fetchGlobalChat(): Promise<ChatMessage[]> {
  return request<ChatMessage[]>("/chat/global");
}

export async function fetchDMChat(
  token: string,
  otherUserId: string,
): Promise<ChatMessage[]> {
  return request<ChatMessage[]>(`/chat/dm/${otherUserId}`, { token });
}

export async function fetchUserProfile(
  userId: string,
): Promise<FriendProfile> {
  return request<FriendProfile>(`/users/${userId}`);
}

export async function publishSharedPack(
  token: string,
  input: {
    name: string;
    description?: string;
    minecraftVersion: string;
    loader: string;
    mods: SharedPackMod[];
  },
): Promise<SharedPack> {
  return request<SharedPack>("/claude/packs", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export async function fetchSharedPacks(token: string): Promise<SharedPack[]> {
  return request<SharedPack[]>("/claude/packs", { token });
}

export async function importSharedPack(
  token: string,
  code: string,
): Promise<SharedPack> {
  return request<SharedPack>("/claude/packs/import", {
    method: "POST",
    token,
    body: JSON.stringify({ code }),
  });
}

export function sessionFromAuth(
  auth: { token: string; user: NuvoxelUser },
): NuvoxelSession {
  return {
    token: auth.token,
    userId: auth.user.id,
    username: auth.user.username,
    friendCode: auth.user.friendCode,
  };
}
