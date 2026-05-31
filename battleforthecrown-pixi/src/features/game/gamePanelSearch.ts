export const GAME_PANEL_SEARCH_PARAM = 'panel';
export const BUILDINGS_PANEL_SEARCH_VALUE = 'buildings';

export function isBuildingsPanelSearchOpen(searchParams: URLSearchParams): boolean {
  return searchParams.get(GAME_PANEL_SEARCH_PARAM) === BUILDINGS_PANEL_SEARCH_VALUE;
}

export function withBuildingsPanelSearch(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.set(GAME_PANEL_SEARCH_PARAM, BUILDINGS_PANEL_SEARCH_VALUE);
  return next;
}

export function withoutBuildingsPanelSearch(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  if (next.get(GAME_PANEL_SEARCH_PARAM) === BUILDINGS_PANEL_SEARCH_VALUE) {
    next.delete(GAME_PANEL_SEARCH_PARAM);
  }
  return next;
}
