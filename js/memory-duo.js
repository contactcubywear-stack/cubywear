import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    hint: "Attention, les cartes non trouvées bougent de temps en temps !",
    winTitle: "🎉 Bravo, tu as gagné !", loseTitle: "😕 Temps écoulé !",
    moves: "Coups joués", timeLeft: "Temps restant", best: "Meilleur score",
    movesText: n => `${n} coups`
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    hint: "Watch out, unmatched cards shuffle around from time to time!",
    winTitle: "🎉 You won!", loseTitle: "😕 Time's up!",
    moves: "Moves", timeLeft: "Time left", best: "Best score",
    movesText: n => `${n} moves`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { grid: 4, time: 90, shuffleEvery: 7000 },
  moyen:      { grid: 4, time: 60, shuffleEvery: 5000 },
  difficile:  { grid: 6, time: 100, shuffleEvery: 4000 },
  impossible: { grid: 6, time: 70, shuffleEvery: 3000 }
};

const baseIcons = [
  "🎮","⭐","🔥","💀","⚡","🎲","🎹","🎧","🎯","🎁",
  "🚀","🧩","🎈","🪄","🔮","🍀","🦄","🍩","🍕","🍔"
];

const board = document.getElementById("gameBoard");

let cfg = DIFFICULTIES.moyen;
let icons, cards;
let tries = 0;
let matched = 0;
let flipped = [];
let boardLocked = false;
let timeLeft = 0;
let best = 0;
let over = false;
let timerInterval = null;
let shuffleInterval = null;

function flipCard(card) {
  if (boardLocked || over) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flipped.length === 2) return;

  card.classList.add("flipped");
  card.textContent = card.dataset.icon;
  flipped.push(card);
  if (window.CubySfx) CubySfx.flip();

  if (flipped.length === 2) {
    boardLocked = true;
    setTimeout(checkMatch, 500);
  }
}

function checkMatch() {
  const [c1, c2] = flipped;
  tries++;
  document.getElementById("info").textContent = T[lang].movesText(tries);

  if (c1.dataset.icon === c2.dataset.icon) {
    c1.classList.add("matched");
    c2.classList.add("matched");
    matched++;
    if (window.CubySfx) CubySfx.match();
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
    if (window.CubySfx) CubySfx.fail();
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

  const finalScore = Math.max(50 - tries, 10);
  best = Math.max(best, finalScore);
  localStorage.setItem("bestMemoryDuo", best);

  document.getElementById("statMoves").textContent = tries;
  document.getElementById("statTime").textContent = `${min}:${sec}`;
  document.getElementById("statBest").textContent = best;
  document.getElementById("winModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "memory-duo", finalScore);
}

async function showLoseModal() {
  document.getElementById("loseStatMoves").textContent = tries;
  document.getElementById("loseModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "memory-duo", 0);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  const GRID_SIZE = cfg.grid;
  const needed = (GRID_SIZE * GRID_SIZE) / 2;
  icons = [...baseIcons].sort(() => Math.random() - 0.5).slice(0, needed);
  cards = [...icons, ...icons].sort(() => Math.random() - 0.5);

  board.innerHTML = "";
  board.style.setProperty("--cols", GRID_SIZE);

  tries = 0;
  matched = 0;
  flipped = [];
  boardLocked = false;
  timeLeft = cfg.time;
  over = false;
  best = Number(localStorage.getItem("bestMemoryDuo") || 0);

  cards.forEach(icon => {
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.icon = icon;
    card.textContent = "?";
    card.addEventListener("click", () => flipCard(card));
    board.appendChild(card);
  });

  document.getElementById("info").textContent = T[lang].movesText(0);
  const min0 = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec0 = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${min0}:${sec0}`;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  clearInterval(timerInterval);
  clearInterval(shuffleInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    document.getElementById("timer").textContent = `${min}:${sec}`;
    if (timeLeft <= 0) {
      over = true;
      clearInterval(timerInterval);
      clearInterval(shuffleInterval);
      showLoseModal();
    }
  }, 1000);

  shuffleInterval = setInterval(shuffleTwoCards, cfg.shuffleEvery);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("loseReplayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__memoryDuoDebug = { shuffleTwoCards, getState: () => ({ tries, matched, timeLeft, over }) };

applyLang();
