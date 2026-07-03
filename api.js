export async function saveScore(productCode, game, score) {
  const key = "cubywearScores";
  const scores = JSON.parse(localStorage.getItem(key) || "{}");
  if (!scores[productCode]) scores[productCode] = {};
  scores[productCode][game] = score;
  localStorage.setItem(key, JSON.stringify(scores));
}
