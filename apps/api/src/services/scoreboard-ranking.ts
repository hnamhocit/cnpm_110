export interface ScoreboardRankable {
  categoryId: string;
  finalScore: number | null;
}

export function assignCompetitionRanks<
  T extends ScoreboardRankable,
>(
  entries: readonly T[],
): (T & { rank: number | null })[] {
  const ranked = entries.map((entry) => ({
    ...entry,
    rank: null as number | null,
  }));

  const indicesByCategory = new Map<string, number[]>();

  // Group entries by category.
  ranked.forEach((entry, index) => {
    const indices =
      indicesByCategory.get(entry.categoryId) ?? [];

    indices.push(index);
    indicesByCategory.set(entry.categoryId, indices);
  });

  // Calculate competition ranking independently per category.
  for (const indices of indicesByCategory.values()) {
    const completedIndices = indices
      .filter((index) => ranked[index].finalScore !== null)
      .sort(
        (a, b) =>
          ranked[b].finalScore! - ranked[a].finalScore!,
      );

    let previousScore: number | null = null;
    let currentRank = 0;

    completedIndices.forEach((index, position) => {
      const score = ranked[index].finalScore!;

      if (position === 0 || score !== previousScore) {
        currentRank = position + 1;
      }

      ranked[index].rank = currentRank;
      previousScore = score;
    });
  }

  return ranked;
}
