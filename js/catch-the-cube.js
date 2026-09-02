import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", start: "Commencer", replay: "Rejouer",
    hint: "Attrape 🧊, évite 💣 !",
    timeUp: "🧊 Temps écoulé !", caught: "Mascottes attrapées", bestCombo: "Meilleur combo", best: "Meilleur score"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", start: "Start", replay: "Replay",
    hint: "Catch 🧊, avoid 💣!",
    timeUp: "🧊 Time's up!", caught: "Mascots caught", bestCombo: "Best combo", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { duration: 35, baseDelay: 1500, minDelay: 700, bombChance: 0.1 },
  moyen:      { duration: 30, baseDelay: 1300, minDelay: 500, bombChance: 0.2 },
  difficile:  { duration: 25, baseDelay: 1000, minDelay: 400, bombChance: 0.3 },
  impossible: { duration: 20, baseDelay: 800,  minDelay: 300, bombChance: 0.4 }
};

const MASCOT_SIZE = 50;

const area = document.getElementById("area");

let cfg = DIFFICULTIES.moyen;
let score = 0;
let combo = 0;
let bestCombo = 0;
let best = Number(localStorage.getItem("bestCatchCube") || 0);
let timeLeft = 30;
let over = true;
let mascotEl = null;
let teleportTimeout = null;
let timerInterval = null;

function updateStats() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("comboVal").textContent = combo;
  document.getElementById("timeVal").textContent = timeLeft;
}

function currentDelay() {
  return Math.max(cfg.baseDelay - score * 30, cfg.minDelay);
}

function spawnBurst(x, y, text, bad) {
  const burst = document.createElement("div");
  burst.className = "catch-burst" + (bad ? " bad" : "");
  burst.textContent = text;
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  area.appendChild(burst);
  setTimeout(() => burst.remove(), 600);
}

function teleport() {
  if (over) return;

  const rect = area.getBoundingClientRect();
  const maxX = rect.width - MASCOT_SIZE;
  const maxY = rect.height - MASCOT_SIZE;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  const isBomb = Math.random() < cfg.bombChance;

  if (mascotEl) mascotEl.remove();

  mascotEl = document.createElement("div");
  mascotEl.className = "mascot" + (isBomb ? " bomb" : "");
  mascotEl.textContent = isBomb ? "💣" : "🧊";
  mascotEl.style.left = `${x}px`;
  mascotEl.style.top = `${y}px`;
  mascotEl.onclick = e => {
    e.stopPropagation();
    if (over) return;

    if (isBomb) {
      score = Math.max(0, score - 2);
      combo = 0;
      if (window.CubySfx) CubySfx.hit();
      spawnBurst(x, y, "-2", true);
    } else {
      score++;
      combo++;
      bestCombo = Math.max(bestCombo, combo);
      if (window.CubySfx) CubySfx.coin();
      spawnBurst(x, y, "+1", false);
    }

    updateStats();
    clearTimeout(teleportTimeout);
    teleport();
  };
  area.appendChild(mascotEl);

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

  if (score > best) {
    best = score;
    localStorage.setItem("bestCatchCube", best);
  }
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statCaught").textContent = score;
  document.getElementById("statCombo").textContent = bestCombo;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "catch-the-cube", score);
}

function startGame() {
  score = 0;
  combo = 0;
  bestCombo = 0;
  timeLeft = cfg.duration;
  over = false;
  updateStats();

  document.getElementById("startOverlay").hidden = true;
  teleport();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => {
    cfg = DIFFICULTIES[btn.dataset.difficulty];
    timeLeft = cfg.duration;
    updateStats();
    document.getElementById("difficultySelect").hidden = true;
    document.getElementById("gameArea").hidden = false;
  };
});

document.getElementById("startBtn").onclick = e => {
  e.stopPropagation();
  startGame();
};
document.getElementById("replayBtn").onclick = () => location.reload();

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

applyLang();
