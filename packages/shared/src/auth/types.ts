export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
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
  villageId?: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}
