import { saveScore } from "../api.js";

const GAME_DURATION = 30;
const TARGET_SIZE = 44;

const area = document.getElementById("area");
const statsEl = document.getElementById("stats");

let hits = 0;
let misses = 0;
let timeLeft = GAME_DURATION;
let over = true;
let timerInterval = null;
let currentTarget = null;

function updateStats() {
  statsEl.textContent = `Touchés : ${hits} · Ratés : ${misses} · Temps : ${timeLeft}s`;
}

function spawnTarget() {
  if (currentTarget) currentTarget.remove();

  const rect = area.getBoundingClientRect();
  const maxX = rect.width - TARGET_SIZE;
  const maxY = rect.height - TARGET_SIZE;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  const target = document.createElement("div");
  target.className = "target";
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.onclick = e => {
    e.stopPropagation();
    if (over) return;
    hits++;
    updateStats();
    spawnTarget();
  };

  area.appendChild(target);
  currentTarget = target;
}

area.addEventListener("click", () => {
  if (over) return;
  misses++;
  updateStats();
});

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (currentTarget) currentTarget.remove();
  currentTarget = null;

  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);

  document.getElementById("statHits").textContent = hits;
  document.getElementById("statAccuracy").textContent = accuracy;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "aim-trainer", hits);
}

function startGame() {
  hits = 0;
  misses = 0;
  timeLeft = GAME_DURATION;
  over = false;
  updateStats();

  document.getElementById("startOverlay").hidden = true;
  spawnTarget();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("replayBtn").onclick = () => location.reload();
