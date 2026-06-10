export function formatScore(score: number) {
  return score.toLocaleString("fr-FR");
}

export function periodLabel(period: string) {
  if (period === "LIVE") return "Live";
  if (period === "WEEKLY") return "Hebdomadaire";
  return "Monde entier";
}
