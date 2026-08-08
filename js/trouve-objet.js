import { saveScore } from "../api.js";

const EMOJI_POOL = [
  "🍕","🍔","🍟","🍩","🍎","🍇","🍉","⚽","🏀","🎸",
  "🚗","✈️","🚀","🎈","🎁","🔮","🧩","🎯","🌟","⚡",
  "🐶","🐱","🦊","🐧","🦁","🌈","☀️","🌙","🎮","🎧"
];

const TOTAL_ROUNDS = 8;
const GRID_SIZE = 7;

const gridEl = document.getElementById("grid");
const targetIconEl = document.getElementById("targetIcon");
const hudEl = document.getElementById("hud");

let round = 0;
let over = false;
let timeLeft = 0;
let timerInterval = null;

function pickTwoDistinctEmojis() {
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function timeForRound() {
  return Math.max(8 - round * 0.5, 3);
}

function startRound() {
  const [target, distractor] = pickTwoDistinctEmojis();
  const total = GRID_SIZE * GRID_SIZE;
  const targetIndex = Math.floor(Math.random() * total);

  targetIconEl.textContent = target;
  gridEl.innerHTML = "";

  for (let i = 0; i < total; i++) {
    const cell = document.createElement("div");
    cell.className = "objet-cell";
    cell.textContent = i === targetIndex ? target : distractor;
    cell.onclick = () => {
      if (i === targetIndex) handleCorrect();
      else handleWrong();
    };
    gridEl.appendChild(cell);
  }

  timeLeft = timeForRound();
  updateHud();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    updateHud();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endGame(false);
    }
  }, 100);
}

function updateHud() {
  hudEl.textContent = `Manche ${round + 1}/${TOTAL_ROUNDS} · Temps : ${Math.max(timeLeft, 0).toFixed(1)}s`;
}

function handleCorrect() {
  if (over) return;
  clearInterval(timerInterval);
  round++;
  if (round >= TOTAL_ROUNDS) {
    endGame(true);
  } else {
    startRound();
  }
}

function handleWrong() {
  if (over) return;
  timeLeft = Math.max(timeLeft - 1, 0);
}

async function endGame(won) {
  over = true;
  clearInterval(timerInterval);
  document.getElementById("resultTitle").textContent = won ? "🎉 Toutes les manches réussies !" : "😕 Temps écoulé !";
  document.getElementById("statScore").textContent = round;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "trouve-objet", round * 10);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__trouveObjetDebug = { handleCorrect, handleWrong, getState: () => ({ round, over, timeLeft }) };

startRound();
