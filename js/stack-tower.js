import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Touche l'écran au bon moment pour empiler le bloc",
    gameOver: "💥 Tour effondrée !", score: "Score", best: "Meilleur score"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Tap at the right time to stack the block",
    gameOver: "💥 Tower collapsed!", score: "Score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile: { speed: 2.1, speedRamp: 0.05, tolerance: 10 },
  moyen: { speed: 2.7, speedRamp: 0.07, tolerance: 7 },
  difficile: { speed: 3.4, speedRamp: 0.09, tolerance: 5 },
  impossible: { speed: 4.2, speedRamp: 0.12, tolerance: 3 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const COLORS = ["#E8AA42", "#5AC8FA", "#2ecc71", "#e74c3c", "#9B59B6", "#F5D30F", "#FF6FA5"];
const BLOCK_H = 34;
const MOVING_SCREEN_Y = H * 0.32;

let cfg = DIFFICULTIES.moyen;
let stack = [];
let moving = null;
let debris = [];
let score = 0;
let best = 0;
let over = true;
let speed = 2.5;

function colorFor(i) {
  return COLORS[i % COLORS.length];
}

function spawnMoving() {
  const top = stack[stack.length - 1];
  const fromLeft = stack.length % 2 === 0;
  moving = {
    x: fromLeft ? -top.w : W,
    w: top.w,
    dir: fromLeft ? 1 : -1,
    color: colorFor(stack.length)
  };
}

function resetGame() {
  stack = [{ x: W / 2 - 80, w: 160, color: colorFor(0) }];
  debris = [];
  score = 0;
  speed = cfg.speed;
  spawnMoving();
}

function drop() {
  if (over) return;
  const top = stack[stack.length - 1];
  const overlapStart = Math.max(moving.x, top.x);
  const overlapEnd = Math.min(moving.x + moving.w, top.x + top.w);
  const overlapW = overlapEnd - overlapStart;

  if (overlapW <= 2) {
    debris.push({ x: moving.x, y: MOVING_SCREEN_Y, w: moving.w, color: moving.color, vy: 2, vx: moving.dir * 2, rot: 0 });
    endGame();
    return;
  }

  const diff = Math.abs(overlapW - top.w);
  let finalW = overlapW;
  let finalX = overlapStart;
  let perfect = false;
  if (diff < cfg.tolerance) {
    finalW = top.w;
    finalX = top.x;
    perfect = true;
  }

  if (moving.x < finalX) {
    debris.push({ x: moving.x, y: MOVING_SCREEN_Y, w: finalX - moving.x, color: moving.color, vy: 1.5, vx: -2, rot: 0 });
  }
  if (moving.x + moving.w > finalX + finalW) {
    debris.push({ x: finalX + finalW, y: MOVING_SCREEN_Y, w: (moving.x + moving.w) - (finalX + finalW), color: moving.color, vy: 1.5, vx: 2, rot: 0 });
  }

  stack.push({ x: finalX, w: finalW, color: moving.color });
  score++;
  if (perfect) {
    score += 2;
    if (window.CubySfx) CubySfx.coin();
  } else {
    if (window.CubySfx) CubySfx.place();
  }
  updateHud();

  speed += cfg.speedRamp;
  spawnMoving();
}

function updateHud() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("bestVal").textContent = best;
}

function update() {
  if (over) return;
  if (moving) {
    moving.x += moving.dir * speed;
    const minX = -moving.w * 0.5;
    const maxX = W - moving.w * 0.5;
    if (moving.x <= minX) { moving.x = minX; moving.dir = 1; }
    if (moving.x >= maxX) { moving.x = maxX; moving.dir = -1; }
  }
  debris.forEach(d => {
    d.y += d.vy;
    d.vy += 0.4;
    d.x += d.vx;
    d.rot += 0.1;
  });
  debris = debris.filter(d => d.y < H + 60);
}

function draw() {
  const theme = getComputedStyle(document.documentElement);
  ctx.fillStyle = theme.getPropertyValue("--bg-main").trim() || "#130D33";
  ctx.fillRect(0, 0, W, H);

  const visibleCount = stack.length;
  for (let i = 0; i < visibleCount; i++) {
    const b = stack[i];
    const screenY = MOVING_SCREEN_Y + (visibleCount - i) * BLOCK_H;
    if (screenY > H + BLOCK_H) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, screenY, b.w, BLOCK_H - 2);
  }

  debris.forEach(d => {
    ctx.save();
    ctx.globalAlpha = Math.max(1 - d.y / H, 0.2);
    ctx.fillStyle = d.color;
    ctx.fillRect(d.x, d.y, d.w, BLOCK_H - 2);
    ctx.restore();
  });

  if (moving) {
    ctx.fillStyle = moving.color;
    ctx.fillRect(moving.x, MOVING_SCREEN_Y, moving.w, BLOCK_H - 2);
  }

  ctx.fillStyle = theme.getPropertyValue("--text-white").trim() || "#ffffff";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.fillText(score, W / 2, 50);
}

let running = false;
function loop() {
  update();
  draw();
  if (!over) requestAnimationFrame(loop);
  else running = false;
}

async function endGame() {
  if (over) return;
  over = true;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 350);
  if (window.CubySfx) CubySfx.hit();

  best = Math.max(score, best);
  localStorage.setItem("bestStackTower", best);
  updateHud();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "stack-tower", score);
}

function startGame(level) {
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  best = Number(localStorage.getItem("bestStackTower") || 0);
  over = false;
  resetGame();
  updateHud();

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

canvas.addEventListener("click", drop);
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  drop();
}, { passive: false });
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    drop();
  }
});

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
window.__stackTowerDebug = {
  drop, startGame, update, draw,
  getState: () => ({ score, over, stackLen: stack.length, moving })
};

applyLang();
draw();
