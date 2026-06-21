export interface SnapshotRankInput {
  userId: string;
  score: number;
}

export interface SnapshotRankEntry {
  userId: string;
  score: number;
  rank: number;
}

/**
 * Trie les entrées par score DESC, userId ASC (tiebreaker lexicographique).
 * Assigne rank = index + 1 (séquentiel, rangs distincts).
 * Ne mute pas l'entrée d'origine. Tableau vide → tableau vide.
 */
export function rankSnapshotEntries(
  entries: ReadonlyArray<SnapshotRankInput>,
): SnapshotRankEntry[] {
  if (entries.length === 0) return [];

  return [...entries]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0;
    })
    .map((entry, index) => ({
      userId: entry.userId,
      score: entry.score,
      rank: index + 1,
    }));
}
