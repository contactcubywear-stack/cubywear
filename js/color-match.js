import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    hint: "Clique la nuance identique", done: "🎨 Terminé !",
    finalScore: "Score final", bestStreak: "Meilleure série"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    hint: "Click the matching shade", done: "🎨 Done!",
    finalScore: "Final score", bestStreak: "Best streak"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { rounds: 8,  startDelta: 40, decay: 1.5, minDelta: 12, count: 9 },
  moyen:      { rounds: 10, startDelta: 28, decay: 2,   minDelta: 7,  count: 9 },
  difficile:  { rounds: 12, startDelta: 22, decay: 1.5, minDelta: 5,  count: 12 },
  impossible: { rounds: 14, startDelta: 16, decay: 1,   minDelta: 3,  count: 12 }
};

let cfg = DIFFICULTIES.moyen;

const targetEl = document.getElementById("targetSwatch");
const gridEl = document.getElementById("grid");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
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
  document.getElementById("roundVal").textContent = `${round + 1}/${cfg.rounds}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  updateHud();

  const target = randomColor();
  const hueDelta = Math.max(cfg.startDelta - round * cfg.decay, cfg.minDelta);
  const correctIndex = Math.floor(Math.random() * cfg.count);

  targetEl.style.background = toCss(target);
  gridEl.style.gridTemplateColumns = cfg.count > 9 ? "repeat(4, 1fr)" : "repeat(3, 1fr)";
  gridEl.innerHTML = "";

  for (let i = 0; i < cfg.count; i++) {
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
    swatch.onclick = () => handlePick(i === correctIndex, swatch);
    gridEl.appendChild(swatch);
  }
}

function handlePick(correct, swatch) {
  if (over) return;
  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    swatch.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    swatch.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
  }
  round++;
  setTimeout(startRound, 120);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "color-match", score * 10);
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
window.__colorMatchDebug = { handlePick, getState: () => ({ round, score, over, streak }) };

applyLang();
