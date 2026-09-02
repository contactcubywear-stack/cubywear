import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Touche l'écran pour changer de direction, passe par la couleur qui correspond à ta balle",
    gameOver: "💥 Perdu !", score: "Score", best: "Meilleur score",
    startPrompt: "Touche pour commencer"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Tap the screen to change direction, pass through the color matching your ball",
    gameOver: "💥 Lost!", score: "Score", best: "Best score",
    startPrompt: "Tap to start"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile: { speed: 1.7, rot: 0.006, gap: 210, stroke: 34 },
  moyen: { speed: 2.2, rot: 0.011, gap: 190, stroke: 28 },
  difficile: { speed: 2.8, rot: 0.017, gap: 170, stroke: 22 },
  impossible: { speed: 3.5, rot: 0.026, gap: 155, stroke: 18 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_TEXT = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const BALL_COLOR = "#E8AA42";
const WHEEL_COLORS = ["#E8AA42", "#e74c3c", "#5AC8FA", "#2ecc71"];

// La balle est fixe près du bas de l'écran ; elle rebondit horizontalement
// pendant que les anneaux défilent du haut vers le bas (donc la progression
// se lit visuellement de bas en haut, comme le vrai Color Switch).
const BALL_Y = H - 110;
const BALL_R = 13;
const GRAVITY = 0.32;
const JUMP = -6.2;
const RING_R = 95;

let cfg = DIFFICULTIES.moyen;
let ballX = W / 2;
let velocity = 0;
let score = 0;
let best = 0;
let over = true;
let started = false;
let frame = 0;
let framesSinceSpawn = 0;
let rings = [];
let particles = [];
let flashAlpha = 0;

function spawnRing() {
  const margin = RING_R + 20;
  const centerX = margin + Math.random() * (W - margin * 2);
  rings.push({
    y: -RING_R - cfg.stroke,
    centerX,
    rotation: Math.random() * Math.PI * 2,
    passed: false
  });
}

function jump() {
  if (over) return;
  started = true;
  velocity = JUMP;
  if (window.CubySfx) CubySfx.tap();
}

function quadrantColor(ring, angle) {
  let a = angle - ring.rotation;
  a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(a / (Math.PI / 2)) % 4;
  return WHEEL_COLORS[idx];
}

function spawnBurst(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

function update() {
  if (!started) {
    ballX = W / 2 + Math.sin(frame / 15) * 8;
    frame++;
    return;
  }
  if (over) return;

  velocity += GRAVITY;
  ballX += velocity;
  frame++;

  framesSinceSpawn++;
  if (framesSinceSpawn >= cfg.gap) {
    spawnRing();
    framesSinceSpawn = 0;
  }

  rings.forEach(r => {
    r.y += cfg.speed;
    r.rotation += cfg.rot;
  });
  rings = rings.filter(r => r.y < H + RING_R + cfg.stroke);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.03;
  });
  particles = particles.filter(p => p.life > 0);

  for (const r of rings) {
    if (r.passed) continue;

    const withinBand = BALL_Y + BALL_R > r.y - cfg.stroke / 2 && BALL_Y - BALL_R < r.y + cfg.stroke / 2;
    if (withinBand) {
      const dist = Math.hypot(ballX - r.centerX, BALL_Y - r.y);
      const inner = RING_R - cfg.stroke / 2;
      const outer = RING_R + cfg.stroke / 2;
      if (dist >= inner && dist <= outer) {
        const angle = Math.atan2(BALL_Y - r.y, ballX - r.centerX);
        const color = quadrantColor(r, angle);
        if (color !== BALL_COLOR) {
          endGame();
          return;
        }
      }
    }

    if (r.y - cfg.stroke / 2 > BALL_Y + BALL_R) {
      r.passed = true;
      score++;
      spawnBurst(r.centerX, r.y, BALL_COLOR);
      if (window.CubySfx) CubySfx.match();
    }
  }

  if (ballX - BALL_R < 0 || ballX + BALL_R > W) {
    endGame();
  }
}

function drawRing(r) {
  const segments = 4;
  for (let i = 0; i < segments; i++) {
    const start = r.rotation + i * (Math.PI / 2);
    ctx.beginPath();
    ctx.arc(r.centerX, r.y, RING_R, start, start + Math.PI / 2);
    ctx.strokeStyle = WHEEL_COLORS[i];
    ctx.lineWidth = cfg.stroke;
    ctx.lineCap = "butt";
    ctx.stroke();
  }
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  rings.forEach(drawRing);

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = BALL_COLOR;
  ctx.beginPath();
  ctx.arc(ballX, BALL_Y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(score, W / 2, 50);

  if (!started) {
    ctx.font = "bold 16px Arial";
    ctx.fillText(T[lang].startPrompt, W / 2, H / 2 - 40);
  }

  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
    flashAlpha -= 0.08;
  }
}

function loop() {
  update();
  draw();
  if (!over) requestAnimationFrame(loop);
}

async function endGame() {
  if (over) return;
  over = true;
  flashAlpha = 0.8;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 350);
  if (window.CubySfx) CubySfx.hit();

  best = Math.max(score, best);
  localStorage.setItem("bestColorSwitch", best);

  draw();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "color-switch", score);
}

function startGame(level) {
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  ballX = W / 2;
  velocity = 0;
  score = 0;
  best = Number(localStorage.getItem("bestColorSwitch") || 0);
  frame = 0;
  framesSinceSpawn = 0;
  rings = [];
  particles = [];
  over = false;
  started = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  document.getElementById("resultModal").hidden = true;

  requestAnimationFrame(loop);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

canvas.addEventListener("click", jump);
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
}, { passive: false });
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
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
window.__colorSwitchDebug = {
  jump, startGame, update, draw,
  getState: () => ({ score, over, started, ballX, rings: rings.length })
};

applyLang();
draw();
