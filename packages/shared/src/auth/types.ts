export interface AuthUser {
  id: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Client session payload after Zod parse — email stripped (run-053 public identity = displayName). */
export interface AuthSessionResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  displayName: string;
  villageId?: string;
}

/** Backend login/register JSON body (wire format; may include email for account flows). */
export interface AuthSessionWireResponse extends AuthSessionResponse {
  email: string;
}

export interface AuthSession extends AuthTokens {
  user: AuthUser;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
}
