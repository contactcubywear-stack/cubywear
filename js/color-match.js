import { saveScore } from "../api.js";

const TOTAL_ROUNDS = 10;

const hudEl = document.getElementById("hud");
const targetEl = document.getElementById("targetSwatch");
const gridEl = document.getElementById("grid");

let round = 0;
let score = 0;
let over = false;

function randomColor() {
  return {
    h: Math.floor(Math.random() * 360),
    s: 55 + Math.floor(Math.random() * 20),
    l: 42 + Math.floor(Math.random() * 16)
  };
}

function toCss(c) {
  return `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
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

  const target = randomColor();
  const hueDelta = Math.max(28 - round * 2, 7);
  const correctIndex = Math.floor(Math.random() * 9);

  targetEl.style.background = toCss(target);
  gridEl.innerHTML = "";

  for (let i = 0; i < 9; i++) {
    let color;
    if (i === correctIndex) {
      color = target;
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      color = {
        h: (target.h + sign * (hueDelta * 0.5 + Math.random() * hueDelta) + 360) % 360,
        s: target.s,
        l: target.l
      };
    }
    const swatch = document.createElement("div");
    swatch.className = "swatch";
    swatch.style.background = toCss(color);
    swatch.onclick = () => handlePick(i === correctIndex);
    gridEl.appendChild(swatch);
  }
}

function handlePick(correct) {
  if (over) return;
  if (correct) score++;
  round++;
  startRound();
}

async function endGame() {
  over = true;
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "color-match", score * 10);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__colorMatchDebug = { handlePick, getState: () => ({ round, score, over }) };

startRound();
