import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", start: "Commencer", replay: "Rejouer",
    results: "🎯 Résultats", targetsHit: "Cibles touchées", accuracy: "Précision", bestCombo: "Meilleur combo"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", start: "Start", replay: "Replay",
    results: "🎯 Results", targetsHit: "Targets hit", accuracy: "Accuracy", bestCombo: "Best combo"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { size: 60, duration: 35, moving: false, speed: 0 },
  moyen:      { size: 44, duration: 30, moving: false, speed: 0 },
  difficile:  { size: 36, duration: 25, moving: true, speed: 90 },
  impossible: { size: 28, duration: 20, moving: true, speed: 150 }
};

const area = document.getElementById("area");

let hits = 0;
let misses = 0;
let combo = 0;
let bestCombo = 0;
let timeLeft = 30;
let over = true;
let timerInterval = null;
let currentTarget = null;
let targetEl = null;
let targetSize = 44;
let moving = false;
let vx = 0, vy = 0;
let moveFrame = null;
let lastFrameTime = 0;

function updateStats() {
  document.getElementById("hits").textContent = hits;
  document.getElementById("misses").textContent = misses;
  document.getElementById("combo").textContent = combo;
  document.getElementById("timeLeft").textContent = timeLeft;
}

function spawnHitBurst(x, y) {
  const burst = document.createElement("div");
  burst.className = "hit-burst";
  burst.style.width = `${targetSize}px`;
  burst.style.height = `${targetSize}px`;
  burst.style.left = `${x}px`;
  burst.style.top = `${y}px`;
  area.appendChild(burst);
  setTimeout(() => burst.remove(), 400);
}

function spawnTarget() {
  if (targetEl) targetEl.remove();

  const rect = area.getBoundingClientRect();
  const maxX = rect.width - targetSize;
  const maxY = rect.height - targetSize;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  const target = document.createElement("div");
  target.className = "target";
  target.style.width = `${targetSize}px`;
  target.style.height = `${targetSize}px`;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
  target.onclick = e => {
    e.stopPropagation();
    if (over) return;
    hits++;
    combo++;
    bestCombo = Math.max(bestCombo, combo);
    updateStats();
    if (window.CubySfx) CubySfx.match();
    const r = target.getBoundingClientRect();
    const areaRect = area.getBoundingClientRect();
    spawnHitBurst(r.left - areaRect.left, r.top - areaRect.top);
    spawnTarget();
  };

  area.appendChild(target);
  targetEl = target;
  currentTarget = { x, y };

  if (moving) {
    const angle = Math.random() * Math.PI * 2;
    vx = Math.cos(angle);
    vy = Math.sin(angle);
  }
}

function moveLoop(time) {
  if (over) return;
  if (!lastFrameTime) lastFrameTime = time;
  const dt = Math.min((time - lastFrameTime) / 1000, 0.05);
  lastFrameTime = time;

  if (moving && targetEl) {
    const rect = area.getBoundingClientRect();
    const maxX = rect.width - targetSize;
    const maxY = rect.height - targetSize;
    const cfg = DIFFICULTIES[currentDifficulty];

    currentTarget.x += vx * cfg.speed * dt;
    currentTarget.y += vy * cfg.speed * dt;

    if (currentTarget.x <= 0 || currentTarget.x >= maxX) vx *= -1;
    if (currentTarget.y <= 0 || currentTarget.y >= maxY) vy *= -1;
    currentTarget.x = Math.max(0, Math.min(maxX, currentTarget.x));
    currentTarget.y = Math.max(0, Math.min(maxY, currentTarget.y));

    targetEl.style.left = `${currentTarget.x}px`;
    targetEl.style.top = `${currentTarget.y}px`;
  }

  moveFrame = requestAnimationFrame(moveLoop);
}

area.addEventListener("click", () => {
  if (over) return;
  misses++;
  combo = 0;
  if (window.CubySfx) CubySfx.fail();
  updateStats();
});

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (moveFrame) cancelAnimationFrame(moveFrame);
  if (targetEl) targetEl.remove();
  targetEl = null;

  const total = hits + misses;
  const accuracy = total === 0 ? 0 : Math.round((hits / total) * 100);

  if (window.CubySfx) CubySfx.win();

  document.getElementById("statHits").textContent = hits;
  document.getElementById("statAccuracy").textContent = accuracy;
  document.getElementById("statCombo").textContent = bestCombo;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "aim-trainer", hits);
}

let currentDifficulty = "moyen";

function startGame() {
  const cfg = DIFFICULTIES[currentDifficulty];
  targetSize = cfg.size;
  moving = cfg.moving;
  timeLeft = cfg.duration;

  hits = 0;
  misses = 0;
  combo = 0;
  bestCombo = 0;
  over = false;
  lastFrameTime = 0;
  updateStats();

  document.getElementById("startOverlay").hidden = true;
  spawnTarget();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateStats();
    if (timeLeft <= 0) endGame();
  }, 1000);

  if (moveFrame) cancelAnimationFrame(moveFrame);
  moveFrame = requestAnimationFrame(moveLoop);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => {
    currentDifficulty = btn.dataset.difficulty;
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
