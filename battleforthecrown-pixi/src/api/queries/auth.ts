import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authSessionResponseSchema } from "@battleforthecrown/shared/auth";
import { apiClient } from "../index";
import { gameSocket } from "../ws";
import { toAuthSession, type AuthSession } from "../types";
import { useAuthStore } from "@/stores/auth";
import { resetGameSessionStores } from "@/stores/session";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  displayName: string;
}

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<AuthSession, Error, LoginInput>({
    mutationFn: async (input) => {
      const payload = authSessionResponseSchema.parse(
        await apiClient.post("/auth/login", input, { skipAuth: true }),
      );
      return toAuthSession(payload);
    },
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useRegisterMutation() {
  const setSession = useAuthStore((state) => state.setSession);
  return useMutation<AuthSession, Error, RegisterInput>({
    mutationFn: async (input) => {
      const payload = authSessionResponseSchema.parse(
        await apiClient.post("/auth/register", input, { skipAuth: true }),
      );
      return toAuthSession(payload);
    },
    onSuccess: (session) => {
      setSession(session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  return () => {
    clearSession();
    resetGameSessionStores();
    gameSocket.disconnect();
    queryClient.clear();
  };
}
