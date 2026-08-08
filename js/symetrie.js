import { saveScore } from "../api.js";

const TOTAL_ROUNDS = 10;
const canvas = document.getElementById("shapeCanvas");
const ctx = canvas.getContext("2d");
const hudEl = document.getElementById("hud");

const theme = getComputedStyle(document.documentElement);
const COLOR_FILL = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_STROKE = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";

let round = 0;
let score = 0;
let over = false;
let currentIsSymmetric = false;

function randPointsHalf(cx, cy, sign) {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = ((Math.random() * 160 - 80) * Math.PI) / 180;
    const r = 25 + Math.random() * 75;
    const x = cx + sign * Math.abs(Math.cos(angle)) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push([x, y]);
  }
  return pts;
}

function generateShapePoints(symmetric) {
  const cx = 120, cy = 120;
  const right = randPointsHalf(cx, cy, 1);
  const left = symmetric ? right.map(([x, y]) => [cx - (x - cx), y]) : randPointsHalf(cx, cy, -1);
  const all = [...right, ...left];
  all.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  return all;
}

function drawShape(points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = COLOR_FILL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLOR_STROKE;
  ctx.stroke();
}

function updateHud() {
  hudEl.textContent = `Manche ${round + 1}/${TOTAL_ROUNDS} · Score : ${score}`;
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  updateHud();
  currentIsSymmetric = Math.random() < 0.5;
  drawShape(generateShapePoints(currentIsSymmetric));
}

function answer(saysSymmetric) {
  if (over) return;
  if (saysSymmetric === currentIsSymmetric) score++;
  round++;
  startRound();
}

async function endGame() {
  over = true;
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "symetrie", score * 10);
}

document.getElementById("btnYes").onclick = () => answer(true);
document.getElementById("btnNo").onclick = () => answer(false);
document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__symetrieDebug = { answer, getState: () => ({ round, score, over, currentIsSymmetric }) };

startRound();
