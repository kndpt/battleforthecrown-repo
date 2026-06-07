import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useWorldMapStore } from '@/stores/worldMap';

export const WORLD_MAP_PATH = '/game/world';
export const WORLD_MAP_FOCUS_X_PARAM = 'focusX';
export const WORLD_MAP_FOCUS_Y_PARAM = 'focusY';

export interface WorldMapFocusTarget {
  x: number;
  y: number;
}

function normalizeFocusValue(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toString();
}

function searchParamsFrom(search?: string | URLSearchParams): URLSearchParams {
  if (search instanceof URLSearchParams) return new URLSearchParams(search);
  return new URLSearchParams(search ?? '');
}

function finiteParam(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildWorldMapFocusSearch(
  target: WorldMapFocusTarget,
  currentSearch?: string | URLSearchParams,
): URLSearchParams {
  const params = searchParamsFrom(currentSearch);
  params.set(WORLD_MAP_FOCUS_X_PARAM, normalizeFocusValue(target.x));
  params.set(WORLD_MAP_FOCUS_Y_PARAM, normalizeFocusValue(target.y));
  return params;
}

export function buildWorldMapFocusPath(
  target: WorldMapFocusTarget,
  currentSearch?: string | URLSearchParams,
): string {
  const params = buildWorldMapFocusSearch(target, currentSearch);
  return `${WORLD_MAP_PATH}?${params.toString()}`;
}

export function parseWorldMapFocusSearch(
  search: string | URLSearchParams,
): WorldMapFocusTarget | null {
  const params = searchParamsFrom(search);
  const x = finiteParam(params, WORLD_MAP_FOCUS_X_PARAM);
  const y = finiteParam(params, WORLD_MAP_FOCUS_Y_PARAM);
  if (x === null || y === null) return null;
  return { x, y };
}

export function clearWorldMapFocusSearch(search: string | URLSearchParams): URLSearchParams {
  const params = searchParamsFrom(search);
  params.delete(WORLD_MAP_FOCUS_X_PARAM);
  params.delete(WORLD_MAP_FOCUS_Y_PARAM);
  return params;
}

export function useWorldMapNavigation(): {
  navigateToWorldMapFocus: (target: WorldMapFocusTarget) => void;
} {
  const navigate = useNavigate();
  const location = useLocation();
  const setPendingFocus = useWorldMapStore((state) => state.setPendingFocus);

  const navigateToWorldMapFocus = useCallback(
    (target: WorldMapFocusTarget) => {
      setPendingFocus(target);
      const currentSearch = location.pathname === WORLD_MAP_PATH ? location.search : undefined;
      navigate(buildWorldMapFocusPath(target, currentSearch));
    },
    [location.pathname, location.search, navigate, setPendingFocus],
  );

  return { navigateToWorldMapFocus };
}
