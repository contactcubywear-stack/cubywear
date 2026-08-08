import { saveScore } from "../api.js";

const GRID_SIZE = 4;
const TIME_LIMIT = 60;
const SHUFFLE_EVERY = 5000;

const baseIcons = [
  "🎮","⭐","🔥","💀","⚡","🎲","🎹","🎧","🎯","🎁",
  "🚀","🧩","🎈","🪄","🔮","🍀","🦄","🍩","🍕","🍔"
];

const needed = (GRID_SIZE * GRID_SIZE) / 2;
const icons = [...baseIcons].sort(() => Math.random() - 0.5).slice(0, needed);
let cards = [...icons, ...icons].sort(() => Math.random() - 0.5);

const board = document.getElementById("gameBoard");
board.style.setProperty("--cols", GRID_SIZE);

let tries = 0;
let matched = 0;
let flipped = [];
let boardLocked = false;
let timeLeft = TIME_LIMIT;

cards.forEach(icon => {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.icon = icon;
  card.textContent = "?";
  card.addEventListener("click", () => flipCard(card));
  board.appendChild(card);
});

function flipCard(card) {
  if (boardLocked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flipped.length === 2) return;

  card.classList.add("flipped");
  card.textContent = card.dataset.icon;
  flipped.push(card);

  if (flipped.length === 2) {
    boardLocked = true;
    setTimeout(checkMatch, 500);
  }
}

function checkMatch() {
  const [c1, c2] = flipped;
  tries++;
  document.getElementById("info").textContent = `${tries} coups`;

  if (c1.dataset.icon === c2.dataset.icon) {
    c1.classList.add("matched");
    c2.classList.add("matched");
    matched++;
    if (matched === icons.length) {
      clearInterval(timerInterval);
      clearInterval(shuffleInterval);
      showWinModal();
      return;
    }
  } else {
    c1.classList.remove("flipped");
    c2.classList.remove("flipped");
    c1.textContent = "?";
    c2.textContent = "?";
  }

  flipped = [];
  boardLocked = false;
}

function shuffleTwoCards() {
  const available = [...board.children].filter(
    el => !el.classList.contains("matched") && !el.classList.contains("flipped")
  );
  if (available.length < 2) return;

  const shuffledPool = [...available].sort(() => Math.random() - 0.5);
  const [a, b] = shuffledPool;
  const aNext = a.nextSibling === b ? a : a.nextSibling;
  board.insertBefore(a, b);
  board.insertBefore(b, aNext);

  a.classList.add("moving");
  b.classList.add("moving");
  setTimeout(() => {
    a.classList.remove("moving");
    b.classList.remove("moving");
  }, 400);
}

async function showWinModal() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("statMoves").textContent = tries;
  document.getElementById("statTime").textContent = `${min}:${sec}`;
  document.getElementById("winModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "memory-duo", Math.max(50 - tries, 10));
}

async function showLoseModal() {
  document.getElementById("loseStatMoves").textContent = tries;
  document.getElementById("loseModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "memory-duo", 0);
}

const timerInterval = setInterval(() => {
  timeLeft--;
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${min}:${sec}`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    clearInterval(shuffleInterval);
    showLoseModal();
  }
}, 1000);

const shuffleInterval = setInterval(shuffleTwoCards, SHUFFLE_EVERY);

document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("loseReplayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__memoryDuoDebug = { shuffleTwoCards, getState: () => ({ tries, matched, timeLeft }) };
