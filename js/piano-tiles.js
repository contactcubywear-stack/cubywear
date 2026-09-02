import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Touche les tuiles noires dès qu'elles apparaissent, ne rate aucune colonne",
    gameOver: "💥 Perdu !", score: "Score", best: "Meilleur score"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Tap the black tiles as soon as they appear, don't miss any column",
    gameOver: "💥 Lost!", score: "Score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile: { speed: 3.2, ramp: 0.0035, tileH: 120, gap: 0 },
  moyen: { speed: 4.2, ramp: 0.005, tileH: 110, gap: 0 },
  difficile: { speed: 5.4, ramp: 0.007, tileH: 95, gap: 6 },
  impossible: { speed: 6.8, ramp: 0.01, tileH: 80, gap: 10 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const COLS = 4;
const COL_W = W / COLS;

let cfg = DIFFICULTIES.moyen;
let tiles = [];
let speed = 4;
let score = 0;
let best = 0;
let over = true;
let nextSpawnY = -100;
let lastCol = -1;

function spawnTileIfNeeded() {
  const highestY = tiles.length ? Math.min(...tiles.map(t => t.y)) : 0;
  if (highestY > -cfg.tileH - cfg.gap) {
    let col;
    do { col = Math.floor(Math.random() * COLS); } while (col === lastCol && COLS > 1);
    lastCol = col;
    tiles.push({ col, y: highestY - cfg.tileH - cfg.gap, h: cfg.tileH, hit: false });
  }
}

function update() {
  if (over) return;
  tiles.forEach(t => (t.y += speed));
  const missed = tiles.some(t => !t.hit && t.y > H);
  if (missed) {
    endGame();
    return;
  }
  tiles = tiles.filter(t => t.y < H + cfg.tileH);
  spawnTileIfNeeded();
  speed += cfg.ramp;
}

function draw() {
  const theme = getComputedStyle(document.documentElement);
  const bg = theme.getPropertyValue("--bg-main").trim() || "#130D33";
  const line = theme.getPropertyValue("--bg-card").trim() || "#231955";
  const tileColor = theme.getPropertyValue("--text-white").trim() || "#ffffff";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  for (let i = 1; i < COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * COL_W, 0);
    ctx.lineTo(i * COL_W, H);
    ctx.stroke();
  }

  tiles.forEach(t => {
    ctx.fillStyle = t.hit ? line : tileColor;
    ctx.globalAlpha = t.hit ? 0.25 : 1;
    ctx.fillRect(t.col * COL_W + 3, t.y, COL_W - 6, t.h - 4);
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.fillText(score, W / 2, 40);
}

let running = false;
function loop() {
  update();
  draw();
  if (!over) requestAnimationFrame(loop);
  else running = false;
}

function handleTap(col) {
  if (over) return;
  const candidates = tiles.filter(t => t.col === col && !t.hit && t.y + t.h > 0);
  if (candidates.length === 0) {
    endGame();
    return;
  }
  candidates.sort((a, b) => b.y - a.y);
  const tile = candidates[0];
  tile.hit = true;
  score++;
  updateHud();
  if (window.CubySfx) CubySfx.tap();
}

function updateHud() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("bestVal").textContent = best;
}

async function endGame() {
  if (over) return;
  over = true;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 350);
  if (window.CubySfx) CubySfx.hit();

  best = Math.max(score, best);
  localStorage.setItem("bestPianoTiles", best);
  updateHud();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "piano-tiles", score);
}

function startGame(level) {
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  best = Number(localStorage.getItem("bestPianoTiles") || 0);
  tiles = [];
  score = 0;
  speed = cfg.speed;
  lastCol = -1;
  over = false;
  updateHud();

  tiles.push({ col: Math.floor(Math.random() * COLS), y: -cfg.tileH, h: cfg.tileH, hit: false });
  lastCol = tiles[0].col;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  if (!running) {
    running = true;
    requestAnimationFrame(loop);
  }
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

function colFromX(x) {
  return Math.max(0, Math.min(COLS - 1, Math.floor(x / COL_W)));
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  handleTap(colFromX((e.clientX - rect.left) * scale));
});
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const scale = W / rect.width;
  [...e.changedTouches].forEach(t => handleTap(colFromX((t.clientX - rect.left) * scale)));
}, { passive: false });

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
window.__pianoTilesDebug = {
  handleTap, startGame, update, draw,
  getState: () => ({ score, over, tiles: tiles.length, speed, tilesData: tiles.map(t => ({ col: t.col, y: t.y, hit: t.hit })) })
};

applyLang();
draw();
