import { saveScore } from "../api.js";

const ITEMS = [
  { emoji: "🍕", name: "Pizza" }, { emoji: "🚀", name: "Fusée" }, { emoji: "🐶", name: "Chien" },
  { emoji: "🎸", name: "Guitare" }, { emoji: "🌈", name: "Arc-en-ciel" }, { emoji: "🦄", name: "Licorne" },
  { emoji: "🎁", name: "Cadeau" }, { emoji: "🍩", name: "Donut" }, { emoji: "🚁", name: "Hélicoptère" },
  { emoji: "🐸", name: "Grenouille" }, { emoji: "🎯", name: "Cible" }, { emoji: "🧩", name: "Puzzle" },
  { emoji: "🦁", name: "Lion" }, { emoji: "⚓", name: "Ancre" }, { emoji: "🎃", name: "Citrouille" },
  { emoji: "🐢", name: "Tortue" }, { emoji: "🍉", name: "Pastèque" }, { emoji: "🎈", name: "Ballon" }
];

const TOTAL_ROUNDS = 8;
const PIXEL_STEPS = [4, 6, 9, 14, 22, 40];
const STEP_INTERVAL = 2200;

const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");
const hudEl = document.getElementById("hud");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let over = false;
let current = null;
let stepIndex = 0;
let stepTimer = null;

function updateHud() {
  hudEl.textContent = `Manche ${round + 1}/${TOTAL_ROUNDS} · Score : ${score}`;
}

function renderPixelated(emoji, pixelSize) {
  offCanvas.width = pixelSize;
  offCanvas.height = pixelSize;
  offCtx.clearRect(0, 0, pixelSize, pixelSize);
  offCtx.font = `${pixelSize * 0.85}px Arial`;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  offCtx.fillText(emoji, pixelSize / 2, pixelSize / 2);

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offCanvas, 0, 0, pixelSize, pixelSize, 0, 0, canvas.width, canvas.height);
}

function pickChoices(correct) {
  const others = ITEMS.filter(i => i.name !== correct.name).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function nextStep() {
  if (over) return;
  if (stepIndex < PIXEL_STEPS.length - 1) {
    stepIndex++;
    renderPixelated(current.emoji, PIXEL_STEPS[stepIndex]);
    stepTimer = setTimeout(nextStep, STEP_INTERVAL);
  }
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  updateHud();

  current = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  stepIndex = 0;
  renderPixelated(current.emoji, PIXEL_STEPS[0]);
  clearTimeout(stepTimer);
  stepTimer = setTimeout(nextStep, STEP_INTERVAL);

  choicesEl.innerHTML = "";
  pickChoices(current).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice.name;
    btn.onclick = () => handleGuess(choice.name === current.name);
    choicesEl.appendChild(btn);
  });
}

function handleGuess(correct) {
  if (over) return;
  if (correct) {
    clearTimeout(stepTimer);
    const points = Math.max(60 - stepIndex * 10, 10);
    score += points;
    round++;
    startRound();
  }
}

async function endGame() {
  over = true;
  clearTimeout(stepTimer);
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "bon-pixel", score);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__bonPixelDebug = { handleGuess, getState: () => ({ round, score, over, stepIndex, current }) };

startRound();
