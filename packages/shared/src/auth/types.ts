export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  displayName: string;
  villageId?: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
