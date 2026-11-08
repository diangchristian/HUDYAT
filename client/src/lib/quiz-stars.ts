/*
 * Stars for a quiz score, shared by the quiz summary screen and the quiz cards so they always agree:
 *   3 stars — 80% or higher
 *   2 stars — 50% up to 80%
 *   1 star  — any correct answer below 50%
 *   0 stars — nothing answered correctly
 */
export function starsEarned(score: number, totalItems: number) {
  if (totalItems <= 0) return 0;
  const percentage = (score / totalItems) * 100;
  if (percentage >= 80) return 3;
  if (percentage >= 50) return 2;
  if (percentage > 0) return 1;
  return 0;
}
