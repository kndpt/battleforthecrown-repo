import { useGameStore } from './game';
import { useResourcesStore } from './resources';
import { useCrownsStore } from './crowns';
import { useExpeditionsStore } from './expeditions';
import { useUiStore } from './ui';
import { useWorldMapStore } from './worldMap';

/**
 * Resets every game-session-scoped Zustand store in one place.
 *
 * Auth identity (`useAuthStore.clearSession`) is reset separately by the
 * caller so this helper can be reused on both explicit logout and forced
 * teardown (401 refresh failure).
 *
 * Without this, session state persists in memory across logins — leaking the
 * previous user's data: expedition snapshots can be rendered as ghost troops
 * on the world map until the next REST reconcile, a queued victory modal can
 * pop after re-login, and the resources/crowns maps grow unbounded across
 * sessions. Keeping the teardown centralized stops the two call sites
 * (`useLogout`, the ApiClient `clearTokens` callback) from drifting apart.
 */
export function resetGameSessionStores(): void {
  useGameStore.getState().clear();
  useResourcesStore.getState().clear();
  useCrownsStore.getState().clear();
  useExpeditionsStore.getState().clear();
  useUiStore.getState().clear();
  useWorldMapStore.getState().clear();
}
