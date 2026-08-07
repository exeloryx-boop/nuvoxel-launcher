export interface NuvoxelUser {
  id: string;
  username: string;
  friendCode: string;
  email?: string | null;
}

export interface NuvoxelSession {
  token: string;
  userId: string;
  username: string;
  friendCode: string;
}

export interface FriendProfile {
  id: string;
  username: string;
  friendCode?: string;
  online: boolean;
  status: string;
  lastSeenAt?: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  channel: string;
  recipientId?: string;
  timestamp: number;
}

export type SharedPackStatus = "pending" | "approved" | "blocked";

export interface SharedPackMod {
  projectId: string;
  versionId: string;
  name: string;
  author: string;
  iconUrl: string | null;
  catalogSource: "modrinth" | "curseforge";
}

export interface SharedPack {
  id: string;
  code: string;
  name: string;
  description: string;
  minecraftVersion: string;
  loader: "vanilla" | "fabric" | "forge" | "quilt" | "neoforge";
  modCount: number;
  authorId: string;
  authorUsername: string;
  status: SharedPackStatus;
  createdAt: number;
  reviewedAt: number | null;
  reviewReason: string | null;
  mods?: SharedPackMod[];
}

export type SocialApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_USERNAME"
  | "INVALID_PASSWORD"
  | "INVALID_CREDENTIALS"
  | "USER_EXISTS"
  | "INVALID_CODE"
  | "NOT_FOUND"
  | "SELF_ADD"
  | "ALREADY_FRIENDS"
  | "USER_BANNED"
  | "USER_MUTED"
  | "EMPTY_MESSAGE"
  | "INVALID_PACK"
  | "PACK_NOT_FOUND"
  | "PACK_BLOCKED"
  | "PACK_PENDING"
  | "INVALID_PACK_REVIEW"
  | "REVIEW_REASON_REQUIRED"
  | "LAUNCHER_AUTH_NOT_FOUND"
  | "NETWORK"
  | "SERVER_ERROR";

export class SocialApiError extends Error {
  code: SocialApiErrorCode;

  constructor(code: SocialApiErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}
