import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    done: "🖼️ Terminé !", finalScore: "Score final", bestStreak: "Meilleure série"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    done: "🖼️ Done!", finalScore: "Final score", bestStreak: "Best streak"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const ITEMS = [
  { emoji: "🍕", fr: "Pizza", en: "Pizza" }, { emoji: "🚀", fr: "Fusée", en: "Rocket" }, { emoji: "🐶", fr: "Chien", en: "Dog" },
  { emoji: "🎸", fr: "Guitare", en: "Guitar" }, { emoji: "🌈", fr: "Arc-en-ciel", en: "Rainbow" }, { emoji: "🦄", fr: "Licorne", en: "Unicorn" },
  { emoji: "🎁", fr: "Cadeau", en: "Gift" }, { emoji: "🍩", fr: "Donut", en: "Donut" }, { emoji: "🚁", fr: "Hélicoptère", en: "Helicopter" },
  { emoji: "🐸", fr: "Grenouille", en: "Frog" }, { emoji: "🎯", fr: "Cible", en: "Target" }, { emoji: "🧩", fr: "Puzzle", en: "Puzzle" },
  { emoji: "🦁", fr: "Lion", en: "Lion" }, { emoji: "⚓", fr: "Ancre", en: "Anchor" }, { emoji: "🎃", fr: "Citrouille", en: "Pumpkin" },
  { emoji: "🐢", fr: "Tortue", en: "Turtle" }, { emoji: "🍉", fr: "Pastèque", en: "Watermelon" }, { emoji: "🎈", fr: "Ballon", en: "Balloon" }
];

const DIFFICULTIES = {
  facile:     { rounds: 6,  interval: 2800, choices: 4, steps: [8, 12, 18, 28, 45, 70] },
  moyen:      { rounds: 8,  interval: 2200, choices: 4, steps: [4, 6, 9, 14, 22, 40] },
  difficile:  { rounds: 10, interval: 1800, choices: 5, steps: [3, 5, 7, 11, 17, 28] },
  impossible: { rounds: 12, interval: 1400, choices: 6, steps: [2, 3, 5, 8, 13, 20] }
};

let cfg = DIFFICULTIES.moyen;

const canvas = document.getElementById("pixelCanvas");
const ctx = canvas.getContext("2d");
const offCanvas = document.createElement("canvas");
const offCtx = offCanvas.getContext("2d");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let current = null;
let stepIndex = 0;
let stepTimer = null;

function updateHud() {
  document.getElementById("roundVal").textContent = `${round + 1}/${cfg.rounds}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
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
  const others = ITEMS.filter(i => i.fr !== correct.fr).sort(() => Math.random() - 0.5).slice(0, cfg.choices - 1);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function nextStep() {
  if (over) return;
  if (stepIndex < cfg.steps.length - 1) {
    stepIndex++;
    renderPixelated(current.emoji, cfg.steps[stepIndex]);
    stepTimer = setTimeout(nextStep, cfg.interval);
  }
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  updateHud();

  current = ITEMS[Math.floor(Math.random() * ITEMS.length)];
  stepIndex = 0;
  renderPixelated(current.emoji, cfg.steps[0]);
  clearTimeout(stepTimer);
  stepTimer = setTimeout(nextStep, cfg.interval);

  choicesEl.innerHTML = "";
  pickChoices(current).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handleGuess(choice.fr === current.fr, btn);
    choicesEl.appendChild(btn);
  });
}

function handleGuess(correct, btn) {
  if (over) return;
  clearTimeout(stepTimer);
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));

  if (correct) {
    btn.classList.add("correct");
    const points = Math.max(60 - stepIndex * 10, 10);
    score += points;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    if (window.CubySfx) CubySfx.match();
  } else {
    btn.classList.add("wrong");
    streak = 0;
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 500);
}

async function endGame() {
  over = true;
  clearTimeout(stepTimer);
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "bon-pixel", score);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  round = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

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

// Hook de test/debug (aucun impact en jeu normal).
window.__bonPixelDebug = { handleGuess, getState: () => ({ round, score, over, stepIndex, current, streak }) };

applyLang();
