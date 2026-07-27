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
  | "NETWORK"
  | "SERVER_ERROR";

export class SocialApiError extends Error {
  code: SocialApiErrorCode;

  constructor(code: SocialApiErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}
