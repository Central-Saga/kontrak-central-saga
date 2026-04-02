export type AuthUser = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  roles: string[];
  permissions: string[];
  avatarUrl?: string | null;
};

export type AuthLoginInput = {
  email: string;
  password: string;
};

export type AuthLoginResult = {
  token: string;
  tokenType: string;
  user: AuthUser;
};

export type AuthSessionState =
  | { status: "guest" }
  | { status: "authenticated"; token: string; user: AuthUser }
  | { status: "stale"; token: string };
