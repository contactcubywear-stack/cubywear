import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", start: "Commencer", replay: "Rejouer",
    hint: "Clique/Espace pour sauter, glisse vers le bas ou ↓ pour t'accroupir",
    gameOver: "💥 Game Over !", score: "Score", best: "Meilleur score"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", start: "Start", replay: "Replay",
    hint: "Click/Space to jump, swipe down or ↓ to duck",
    gameOver: "💥 Game Over!", score: "Score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { start: 150, max: 320, spawnBase: 1.6, spawnMin: 0.7,  flyChance: 0.2 },
  moyen:      { start: 180, max: 420, spawnBase: 1.3, spawnMin: 0.55, flyChance: 0.3 },
  difficile:  { start: 220, max: 480, spawnBase: 1.0, spawnMin: 0.45, flyChance: 0.35 },
  impossible: { start: 260, max: 540, spawnBase: 0.8, spawnMin: 0.35, flyChance: 0.4 }
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");

const W = 380;
const H = 260;
canvas.width = W;
canvas.height = H;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_GROUND = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";
const COLOR_PLAYER = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_OBSTACLE = "#e74c3c";
const COLOR_FLYING = "#F2811D";

const GROUND_Y = H - 40;
const PLAYER_X = 50;
const PLAYER_SIZE = 28;
const DUCK_HEIGHT = 10;
const GRAVITY = 1400;
const JUMP_VELOCITY = -560;

let cfg = DIFFICULTIES.moyen;
let playerY = GROUND_Y - PLAYER_SIZE;
let velocityY = 0;
let jumping = false;
let ducking = false;
let particles = [];

let obstacles = [];
let score = 0;
let best = 0;
let over = true;
let spawnTimer = 0;

function speedForScore() {
  return Math.min(cfg.start + score * 1.5, cfg.max);
}

function spawnDust() {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: PLAYER_X + Math.random() * PLAYER_SIZE,
      y: GROUND_Y,
      vx: -40 - Math.random() * 40,
      vy: -20 - Math.random() * 30,
      life: 1
    });
  }
}

function jump() {
  if (over || jumping) return;
  ducking = false;
  velocityY = JUMP_VELOCITY;
  jumping = true;
  if (window.CubySfx) CubySfx.tap();
}

function duck(active) {
  if (over || jumping) return;
  ducking = active;
}

function spawnObstacle() {
  const isFlying = Math.random() < cfg.flyChance;
  if (isFlying) {
    obstacles.push({ x: W + 10, y: GROUND_Y - 26, w: 22, h: 12, type: "flying" });
  } else {
    const height = 24 + Math.random() * 20;
    obstacles.push({ x: W + 10, y: GROUND_Y - height, w: 18, h: height, type: "ground" });
  }
}

function update(delta) {
  if (over) return;

  score += delta * 10;

  velocityY += GRAVITY * delta;
  playerY += velocityY * delta;
  if (playerY >= GROUND_Y - PLAYER_SIZE) {
    if (jumping) spawnDust();
    playerY = GROUND_Y - PLAYER_SIZE;
    velocityY = 0;
    jumping = false;
  }

  particles.forEach(p => {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= delta * 2;
  });
  particles = particles.filter(p => p.life > 0);

  const speed = speedForScore();
  spawnTimer += delta;
  const spawnInterval = Math.max(cfg.spawnBase - score * 0.005, cfg.spawnMin);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  obstacles.forEach(o => (o.x -= speed * delta));
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  const playerHeight = ducking && !jumping ? DUCK_HEIGHT : PLAYER_SIZE;
  const playerTop = GROUND_Y - playerHeight;
  const effectiveTop = jumping ? playerY : playerTop;
  const playerBox = { x: PLAYER_X, y: effectiveTop, w: PLAYER_SIZE, h: playerHeight };

  const collided = obstacles.some(
    o => playerBox.x < o.x + o.w && playerBox.x + playerBox.w > o.x && playerBox.y < o.y + o.h && playerBox.y + playerBox.h > o.y
  );
  if (collided) endGame();
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = COLOR_GROUND;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = COLOR_GROUND;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  obstacles.forEach(o => {
    ctx.fillStyle = o.type === "flying" ? COLOR_FLYING : COLOR_OBSTACLE;
    ctx.fillRect(o.x, o.y, o.w, o.h);
  });

  const playerHeight = ducking && !jumping ? DUCK_HEIGHT : PLAYER_SIZE;
  const drawY = jumping ? playerY : GROUND_Y - playerHeight;
  ctx.fillStyle = COLOR_PLAYER;
  ctx.fillRect(PLAYER_X, drawY, PLAYER_SIZE, playerHeight);
}

let lastTime = null;
function loop(now) {
  if (lastTime === null) lastTime = now;
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(delta);
  draw();
  document.getElementById("scoreVal").textContent = Math.floor(score);
  if (!over) requestAnimationFrame(loop);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.hit();
  best = Math.max(Math.floor(score), best);
  localStorage.setItem("runner2dBest", best);

  document.getElementById("statScore").textContent = Math.floor(score);
  document.getElementById("statBest").textContent = best;
  document.getElementById("bestVal").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "runner-2d", Math.floor(score));
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  playerY = GROUND_Y - PLAYER_SIZE;
  velocityY = 0;
  jumping = false;
  ducking = false;
  obstacles = [];
  particles = [];
  score = 0;
  best = Number(localStorage.getItem("runner2dBest") || 0);
  spawnTimer = 0;
  over = false;

  document.getElementById("bestVal").textContent = best;
  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  document.getElementById("startOverlay").hidden = true;

  lastTime = null;
  requestAnimationFrame(loop);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("startBtn").onclick = e => {
  e.stopPropagation();
};
document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("btnJump").onclick = () => jump();
document.getElementById("btnDuck").onmousedown = () => duck(true);
document.getElementById("btnDuck").onmouseup = () => duck(false);
document.getElementById("btnDuck").ontouchstart = e => { e.preventDefault(); duck(true); };
document.getElementById("btnDuck").ontouchend = e => { e.preventDefault(); duck(false); };

area.addEventListener("click", jump);

let touchStartY = 0;
area.addEventListener("touchstart", e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

area.addEventListener("touchend", e => {
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (dy > 30) {
    duck(true);
    setTimeout(() => duck(false), 500);
  } else {
    jump();
  }
});

window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
  if (e.code === "ArrowDown") {
    e.preventDefault();
    duck(true);
  }
});
window.addEventListener("keyup", e => {
  if (e.code === "ArrowDown") duck(false);
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
window.__runner2dDebug = { update, draw, jump, duck, getState: () => ({ score, over, playerY, jumping, ducking }), getObstacles: () => obstacles, spawnObstacle };

applyLang();
draw();
