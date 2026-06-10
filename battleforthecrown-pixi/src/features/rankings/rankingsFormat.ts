export function formatScore(score: number): string {
  return score.toLocaleString("fr-FR");
}

export function periodLabel(period: string): string {
  if (period === "LIVE") return "Live";
  if (period === "WEEKLY") return "Hebdomadaire";
  return "Monde entier";
}
