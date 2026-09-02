import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    hint: "Cette forme est-elle symétrique (axe vertical) ?",
    yes: "✅ Oui", no: "❌ Non",
    done: "🦋 Terminé !", finalScore: "Score final", bestStreak: "Meilleure série"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    hint: "Is this shape symmetric (vertical axis)?",
    yes: "✅ Yes", no: "❌ No",
    done: "🦋 Done!", finalScore: "Final score", bestStreak: "Best streak"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { rounds: 8,  timer: 0, strength: 1 },
  moyen:      { rounds: 10, timer: 6, strength: 1 },
  difficile:  { rounds: 12, timer: 4, strength: 0.4 },
  impossible: { rounds: 15, timer: 3, strength: 0.15 }
};

let cfg = DIFFICULTIES.moyen;

const canvas = document.getElementById("shapeCanvas");
const ctx = canvas.getContext("2d");

const theme = getComputedStyle(document.documentElement);
const COLOR_FILL = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_STROKE = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let currentIsSymmetric = false;
let timeLeft = 0;
let timerInterval = null;

function randPointsHalf(cx, cy, sign) {
  const n = 8;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = ((Math.random() * 160 - 80) * Math.PI) / 180;
    const r = 25 + Math.random() * 75;
    const x = cx + sign * Math.abs(Math.cos(angle)) * r;
    const y = cy + Math.sin(angle) * r;
    pts.push([x, y]);
  }
  return pts;
}

function generateShapePoints(symmetric) {
  const cx = 120, cy = 120;
  const right = randPointsHalf(cx, cy, 1);
  let left;

  if (symmetric) {
    left = right.map(([x, y]) => [cx - (x - cx), y]);
  } else if (cfg.strength >= 1) {
    left = randPointsHalf(cx, cy, -1);
  } else {
    const mirrored = right.map(([x, y]) => [cx - (x - cx), y]);
    left = mirrored.map(([x, y]) => [
      x + (Math.random() - 0.5) * 60 * cfg.strength,
      y + (Math.random() - 0.5) * 40 * cfg.strength
    ]);
  }

  const all = [...right, ...left];
  all.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
  return all;
}

function drawShape(points) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.beginPath();
  points.forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = COLOR_FILL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLOR_STROKE;
  ctx.stroke();
}

function updateHud() {
  document.getElementById("roundVal").textContent = `${round + 1}/${cfg.rounds}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
}

function updateTimerBar() {
  const fill = document.getElementById("timerFill");
  const ratio = Math.max(timeLeft / cfg.timer, 0);
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle("warn", ratio <= 0.5 && ratio > 0.2);
  fill.classList.toggle("danger", ratio <= 0.2);
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  updateHud();
  canvas.classList.remove("correct", "wrong");
  currentIsSymmetric = Math.random() < 0.5;
  drawShape(generateShapePoints(currentIsSymmetric));

  clearInterval(timerInterval);
  const timerWrap = document.getElementById("timerBarWrap");
  if (cfg.timer > 0) {
    timerWrap.hidden = false;
    timeLeft = cfg.timer;
    updateTimerBar();
    timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      updateTimerBar();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        answer(!currentIsSymmetric);
      }
    }, 100);
  } else {
    timerWrap.hidden = true;
  }
}

function answer(saysSymmetric) {
  if (over) return;
  clearInterval(timerInterval);
  const isCorrect = saysSymmetric === currentIsSymmetric;

  if (isCorrect) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    canvas.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    canvas.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 300);
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "symetrie", score * 10);
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

document.getElementById("btnYes").onclick = () => answer(true);
document.getElementById("btnNo").onclick = () => answer(false);
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
window.__symetrieDebug = { answer, getState: () => ({ round, score, over, currentIsSymmetric, streak }) };

applyLang();
