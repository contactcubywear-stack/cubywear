import { saveScore } from "../api.js";

const GAME_DURATION = 30;
const MASCOT_SIZE = 50;
const BASE_DELAY = 1300;
const MIN_DELAY = 500;

const area = document.getElementById("area");
const statsEl = document.getElementById("stats");

let score = 0;
let timeLeft = GAME_DURATION;
let over = true;
let mascotEl = null;
let teleportTimeout = null;
let timerInterval = null;

function updateStats() {
  statsEl.textContent = `Score : ${score} · Temps : ${timeLeft}s`;
}

function currentDelay() {
  return Math.max(BASE_DELAY - score * 40, MIN_DELAY);
}

function teleport() {
  if (over) return;

  const rect = area.getBoundingClientRect();
  const maxX = rect.width - MASCOT_SIZE;
  const maxY = rect.height - MASCOT_SIZE;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  if (!mascotEl) {
    mascotEl = document.createElement("div");
    mascotEl.className = "mascot";
    mascotEl.textContent = "🧊";
    mascotEl.onclick = e => {
      e.stopPropagation();
      if (over) return;
      score++;
      updateStats();
      clearTimeout(teleportTimeout);
      teleport();
    };
    area.appendChild(mascotEl);
  }

  mascotEl.style.left = `${x}px`;
  mascotEl.style.top = `${y}px`;

  teleportTimeout = setTimeout(teleport, currentDelay());
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  clearTimeout(teleportTimeout);
  if (mascotEl) {
    mascotEl.remove();
    mascotEl = null;
  }

  document.getElementById("statCaught").textContent = score;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "catch-the-cube", score);
}

function startGame() {
  score = 0;
  timeLeft = GAME_DURATION;
  over = false;
  updateStats();

  document.getElementById("startOverlay").hidden = true;
  teleport();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("replayBtn").onclick = () => location.reload();
