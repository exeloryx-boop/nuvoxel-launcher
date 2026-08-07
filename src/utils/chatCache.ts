import type { ChatMessage } from "../types/social";

const CHAT_CACHE_PREFIX = "nuvolexlauncher-chat-cache:";
const MAX_CACHED_MESSAGES = 200;

function cacheKey(scope: string): string {
  return `${CHAT_CACHE_PREFIX}${scope}`;
}

export function loadCachedChat(scope: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(cacheKey(scope));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ChatMessage[]).slice(-MAX_CACHED_MESSAGES) : [];
  } catch {
    return [];
  }
}

export function saveCachedChat(scope: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(cacheKey(scope), JSON.stringify(messages.slice(-MAX_CACHED_MESSAGES)));
  } catch {
    // The server remains the source of truth if browser storage is unavailable.
  }
}

export function mergeChatMessages(
  current: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of [...current, ...incoming]) byId.set(message.id, message);
  return [...byId.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_CACHED_MESSAGES);
}
