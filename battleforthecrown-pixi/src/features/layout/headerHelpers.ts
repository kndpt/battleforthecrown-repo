import type { PublicWorld } from '@battleforthecrown/shared/world';

export const integerFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

export function toResultMap<T>(
  ids: string[],
  results: readonly { data?: T }[],
): ReadonlyMap<string, T> {
  return new Map(
    ids.flatMap((id, index) => {
      const data = results[index]?.data;
      return data === undefined ? [] : [[id, data] as const];
    }),
  );
}

export function getPlayerInitials(email: string | null | undefined): string {
  const source = email?.trim();
  if (!source) return '—';
  const localPart = source.split('@')[0] ?? source;
  const parts = localPart.split(/[._-]+/).filter(Boolean);
  const letters =
    parts.length >= 2
      ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
      : localPart.slice(0, 2);

  return letters.toUpperCase();
}

export function formatWorldPhase(world: PublicWorld | undefined): string {
  if (!world) return '—';
  if (world.status === 'PLANNED') return 'Planifié';
  if (world.status === 'LOCKED') return 'Verrouillé';
  if (world.lifecycle.inscriptionPhase === 'main') return 'Inscription ouverte';
  if (world.lifecycle.inscriptionPhase === 'late') return 'Retardataires';
  return 'Inscriptions closes';
}
