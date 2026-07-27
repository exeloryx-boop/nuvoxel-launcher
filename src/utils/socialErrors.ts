const FRIEND_ERROR_TOAST: Record<string, string> = {
  NOT_FOUND: "friendNotFound",
  ALREADY_FRIENDS: "friendAlreadyAdded",
  SELF_ADD: "friendSelfAdd",
  INVALID_CODE: "friendInvalidCode",
  NETWORK: "socialApiOffline",
};

export function friendErrorToast(code: string): string {
  return FRIEND_ERROR_TOAST[code] ?? "friendAddError";
}

const LOGIN_ERROR_TOAST: Record<string, string> = {
  INVALID_CREDENTIALS: "nuvoxelLoginError",
  NETWORK: "socialApiOffline",
};

export function loginErrorToast(code: string): string {
  return LOGIN_ERROR_TOAST[code] ?? "nuvoxelLoginError";
}

const REGISTER_ERROR_TOAST: Record<string, string> = {
  USER_EXISTS: "nuvoxelUserExists",
  INVALID_USERNAME: "nuvoxelInvalidUsername",
  INVALID_PASSWORD: "nuvoxelInvalidPassword",
  NETWORK: "socialApiOffline",
};

export function registerErrorToast(code: string): string {
  return REGISTER_ERROR_TOAST[code] ?? "registerError";
}
