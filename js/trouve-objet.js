import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer", find: "Trouve",
    roundsCleared: "Manches réussies", bestStreak: "Meilleure série",
    win: "🎉 Toutes les manches réussies !", lose: "😕 Temps écoulé !"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay", find: "Find",
    roundsCleared: "Rounds cleared", bestStreak: "Best streak",
    win: "🎉 All rounds cleared!", lose: "😕 Time's up!"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const EMOJI_POOL = [
  "🍕","🍔","🍟","🍩","🍎","🍇","🍉","⚽","🏀","🎸",
  "🚗","✈️","🚀","🎈","🎁","🔮","🧩","🎯","🌟","⚡",
  "🐶","🐱","🦊","🐧","🦁","🌈","☀️","🌙","🎮","🎧"
];

const DIFFICULTIES = {
  facile:     { grid: 5, rounds: 6,  baseTime: 10, decay: 0.4, minTime: 4 },
  moyen:      { grid: 7, rounds: 8,  baseTime: 8,  decay: 0.5, minTime: 3 },
  difficile:  { grid: 7, rounds: 10, baseTime: 6,  decay: 0.5, minTime: 2.5 },
  impossible: { grid: 9, rounds: 12, baseTime: 5,  decay: 0.4, minTime: 2 }
};

let cfg = DIFFICULTIES.moyen;

const gridEl = document.getElementById("grid");
const targetIconEl = document.getElementById("targetIcon");

let round = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let timeLeft = 0;
let timerInterval = null;

function pickTwoDistinctEmojis() {
  const shuffled = [...EMOJI_POOL].sort(() => Math.random() - 0.5);
  return [shuffled[0], shuffled[1]];
}

function timeForRound() {
  return Math.max(cfg.baseTime - round * cfg.decay, cfg.minTime);
}

function startRound() {
  const [target, distractor] = pickTwoDistinctEmojis();
  const total = cfg.grid * cfg.grid;
  const targetIndex = Math.floor(Math.random() * total);

  targetIconEl.textContent = target;
  gridEl.style.gridTemplateColumns = `repeat(${cfg.grid}, 1fr)`;
  gridEl.style.gridTemplateRows = `repeat(${cfg.grid}, minmax(0, 1fr))`;
  gridEl.innerHTML = "";

  for (let i = 0; i < total; i++) {
    const cell = document.createElement("div");
    cell.className = "objet-cell";
    cell.textContent = i === targetIndex ? target : distractor;
    cell.onclick = () => {
      if (i === targetIndex) handleCorrect(cell);
      else handleWrong(cell);
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
  document.getElementById("roundVal").textContent = `${round + 1}/${cfg.rounds}`;
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = `${Math.max(timeLeft, 0).toFixed(1)}s`;
}

function handleCorrect(cell) {
  if (over) return;
  cell.classList.add("correct");
  clearInterval(timerInterval);
  streak++;
  bestStreak = Math.max(bestStreak, streak);
  if (window.CubySfx) CubySfx.match();
  round++;
  if (round >= cfg.rounds) {
    endGame(true);
  } else {
    setTimeout(startRound, 150);
  }
}

function handleWrong(cell) {
  if (over) return;
  cell.classList.add("wrong");
  setTimeout(() => cell.classList.remove("wrong"), 300);
  streak = 0;
  if (window.CubySfx) CubySfx.fail();
  timeLeft = Math.max(timeLeft - 1, 0);
}

async function endGame(won) {
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) (won ? CubySfx.win() : CubySfx.lose());

  document.getElementById("resultTitle").textContent = won ? T[lang].win : T[lang].lose;
  document.getElementById("statScore").textContent = round;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "trouve-objet", round * 10);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  round = 0;
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
window.__trouveObjetDebug = { handleCorrect, handleWrong, getState: () => ({ round, over, timeLeft, streak }) };

applyLang();
