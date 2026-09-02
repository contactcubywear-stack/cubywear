import { saveScore } from "../api.js";

const T = {
  fr: {
    hint: "Clique, appuie sur Espace ou touche l'écran pour voler",
    home: "Accueil", gameOver: "💥 Game Over !",
    score: "Score", coins: "Pièces", best: "Meilleur score",
    replay: "Rejouer", mainMenu: "Menu principal",
    startPrompt: "Touche pour commencer"
  },
  en: {
    hint: "Click, press Space, or tap the screen to fly",
    home: "Home", gameOver: "💥 Game Over!",
    score: "Score", coins: "Coins", best: "Best score",
    replay: "Replay", mainMenu: "Main menu",
    startPrompt: "Tap to start"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

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

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const theme = getComputedStyle(document.documentElement);
const COLOR_SKY_TOP = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";
const COLOR_SKY_BOTTOM = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_PIPE = theme.getPropertyValue("--bg-card").trim() || "#231955";
const COLOR_PIPE_EDGE = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_BIRD = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_GROUND = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";
const COLOR_TEXT = theme.getPropertyValue("--text-white").trim() || "#ffffff";

const GRAVITY = 0.35;
const JUMP = -6.5;
const BIRD_X = 70;
const BIRD_SIZE = 26;
const PIPE_WIDTH = 56;
const GROUND_HEIGHT = 22;

const BASE_SPEED = 2.2;
const MAX_SPEED = 5.5;
const SPEED_PER_POINT = 0.05;

const BASE_GAP = 170;
const MIN_GAP = 110;
const GAP_LOSS_PER_POINT = 2.5;

const BASE_INTERVAL = 130;
const MIN_INTERVAL = 60;
const INTERVAL_LOSS_PER_POINT = 1.8;

function currentSpeed() { return Math.min(BASE_SPEED + score * SPEED_PER_POINT, MAX_SPEED); }
function currentGap() { return Math.max(BASE_GAP - score * GAP_LOSS_PER_POINT, MIN_GAP); }
function currentInterval() { return Math.max(BASE_INTERVAL - score * INTERVAL_LOSS_PER_POINT, MIN_INTERVAL); }

let birdY = H / 2;
let velocity = 0;
let score = 0;
let coins = 0;
let frame = 0;
let framesSinceSpawn = 0;
let pipes = [];
let particles = [];
let coinObjs = [];
let flapPulse = 0;
let groundOffset = 0;
let started = false;
let over = false;
let flashAlpha = 0;

// Décor parallax : nuages lointains + silhouette de ville proche
const clouds = Array.from({ length: 6 }, () => ({
  x: Math.random() * W,
  y: 30 + Math.random() * 140,
  r: 18 + Math.random() * 22,
  speed: 0.3 + Math.random() * 0.3
}));

const buildings = Array.from({ length: 10 }, (_, i) => ({
  x: i * 60,
  w: 40 + Math.random() * 20,
  h: 40 + Math.random() * 90
}));

function spawnPipe() {
  const gap = currentGap();
  const margin = 60;
  const gapY = margin + Math.random() * (H - GROUND_HEIGHT - margin * 2 - gap) + gap / 2;
  const pipe = { x: W, gapY, gap, passed: false };
  pipes.push(pipe);

  if (Math.random() < 0.55) {
    coinObjs.push({ x: W + PIPE_WIDTH / 2, y: gapY, collected: false });
  }
}

function flap() {
  if (over) return;
  started = true;
  velocity = JUMP;
  flapPulse = 8;
  if (window.CubySfx) CubySfx.tap();
}

function spawnParticle() {
  particles.push({
    x: BIRD_X,
    y: birdY + BIRD_SIZE / 2,
    vx: -1.5 - Math.random(),
    vy: (Math.random() - 0.5) * 1.5,
    life: 1,
    size: 2 + Math.random() * 2
  });
}

function update() {
  groundOffset = (groundOffset + (started ? currentSpeed() : 1)) % 24;
  clouds.forEach(c => {
    c.x -= c.speed;
    if (c.x < -40) c.x = W + 40;
  });

  if (!started) {
    birdY = H / 2 + Math.sin(frame / 15) * 8;
    frame++;
    return;
  }

  velocity += GRAVITY;
  birdY += velocity;

  if (flapPulse > 0) flapPulse--;
  if (frame % 3 === 0) spawnParticle();

  frame++;
  framesSinceSpawn++;
  if (framesSinceSpawn >= currentInterval()) {
    spawnPipe();
    framesSinceSpawn = 0;
  }

  const speed = currentSpeed();
  pipes.forEach(p => (p.x -= speed));
  pipes = pipes.filter(p => p.x + PIPE_WIDTH > 0);

  coinObjs.forEach(c => (c.x -= speed));
  coinObjs = coinObjs.filter(c => c.x > -20 && !c.collected);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
  });
  particles = particles.filter(p => p.life > 0);

  pipes.forEach(p => {
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
      p.passed = true;
      score++;
      if (window.CubySfx) CubySfx.tap();
    }

    const withinX = BIRD_X + BIRD_SIZE > p.x && BIRD_X < p.x + PIPE_WIDTH;
    if (withinX) {
      const hitsTop = birdY < p.gapY - p.gap / 2;
      const hitsBottom = birdY + BIRD_SIZE > p.gapY + p.gap / 2;
      if (hitsTop || hitsBottom) endGame();
    }
  });

  coinObjs.forEach(c => {
    if (c.collected) return;
    const dx = (BIRD_X + BIRD_SIZE / 2) - c.x;
    const dy = (birdY + BIRD_SIZE / 2) - c.y;
    if (Math.sqrt(dx * dx + dy * dy) < 18) {
      c.collected = true;
      coins++;
      score += 5;
      if (window.CubySfx) CubySfx.coin();
    }
  });

  if (birdY + BIRD_SIZE > H - GROUND_HEIGHT || birdY < 0) endGame();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, COLOR_SKY_TOP);
  sky.addColorStop(1, COLOR_SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = COLOR_TEXT;
  clouds.forEach(c => {
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.r, c.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.25;
  ctx.fillStyle = COLOR_PIPE;
  buildings.forEach(b => {
    const bx = ((b.x - groundOffset * 0.4) % (W + 60)) - 30;
    ctx.fillRect(bx, H - GROUND_HEIGHT - b.h, b.w, b.h);
  });
  ctx.globalAlpha = 1;
}

function drawPipes() {
  pipes.forEach(p => {
    const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_WIDTH, 0);
    grad.addColorStop(0, COLOR_PIPE);
    grad.addColorStop(0.5, COLOR_PIPE_EDGE + "33");
    grad.addColorStop(1, COLOR_PIPE);

    ctx.fillStyle = grad;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY - p.gap / 2);
    ctx.fillRect(p.x, p.gapY + p.gap / 2, PIPE_WIDTH, H - (p.gapY + p.gap / 2));

    ctx.fillStyle = COLOR_PIPE_EDGE;
    ctx.fillRect(p.x - 4, p.gapY - p.gap / 2 - 10, PIPE_WIDTH + 8, 10);
    ctx.fillRect(p.x - 4, p.gapY + p.gap / 2, PIPE_WIDTH + 8, 10);
  });
}

function drawCoins() {
  coinObjs.forEach(c => {
    if (c.collected) return;
    const squish = Math.abs(Math.sin(frame / 8 + c.x));
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(0.4 + squish * 0.6, 1);
    ctx.fillStyle = COLOR_PIPE_EDGE;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLOR_SKY_BOTTOM;
    ctx.font = "bold 10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0);
    ctx.restore();
  });
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = COLOR_PIPE_EDGE;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawGround() {
  ctx.fillStyle = COLOR_GROUND;
  ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);

  ctx.strokeStyle = COLOR_PIPE_EDGE;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 3;
  for (let x = -24; x < W + 24; x += 24) {
    const sx = x - (groundOffset % 24);
    ctx.beginPath();
    ctx.moveTo(sx, H - GROUND_HEIGHT);
    ctx.lineTo(sx + 12, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBird() {
  ctx.save();
  ctx.translate(BIRD_X + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2);
  ctx.rotate(Math.max(-0.4, Math.min(0.9, velocity / 12)));

  // Aile qui bat
  const wingAngle = flapPulse > 0 ? -0.9 : Math.sin(frame / 6) * 0.35;
  ctx.save();
  ctx.rotate(wingAngle);
  ctx.fillStyle = COLOR_SKY_BOTTOM;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-BIRD_SIZE / 2, -2);
  ctx.lineTo(-4, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Corps
  ctx.fillStyle = COLOR_BIRD;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Bec
  ctx.fillStyle = COLOR_PIPE_EDGE === COLOR_BIRD ? "#ff8b13" : COLOR_PIPE_EDGE;
  ctx.beginPath();
  ctx.moveTo(BIRD_SIZE / 2 - 2, -2);
  ctx.lineTo(BIRD_SIZE / 2 + 7, 1);
  ctx.lineTo(BIRD_SIZE / 2 - 2, 5);
  ctx.closePath();
  ctx.fill();

  // Oeil
  ctx.fillStyle = COLOR_SKY_BOTTOM;
  ctx.beginPath();
  ctx.arc(BIRD_SIZE / 4, -BIRD_SIZE / 6, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHud() {
  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(score, W / 2, 50);

  if (coins > 0) {
    ctx.font = "bold 14px Arial";
    ctx.fillStyle = COLOR_PIPE_EDGE;
    ctx.fillText(`🪙 ${coins}`, W / 2, 72);
  }

  if (!started) {
    ctx.fillStyle = COLOR_TEXT;
    ctx.font = "bold 16px Arial";
    ctx.fillText(T[lang].startPrompt, W / 2, H / 2 - 40);
  }

  if (flashAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
    ctx.fillRect(0, 0, W, H);
    flashAlpha -= 0.08;
  }
}

function draw() {
  drawBackground();
  drawPipes();
  drawCoins();
  drawParticles();
  drawGround();
  drawBird();
  drawHud();
}

function loop() {
  if (over) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

async function endGame() {
  over = true;
  flashAlpha = 0.8;
  canvas.classList.add("shake");
  setTimeout(() => canvas.classList.remove("shake"), 350);
  if (window.CubySfx) CubySfx.hit();

  draw();

  const best = Math.max(score, Number(localStorage.getItem("flappyBest") || 0));
  localStorage.setItem("flappyBest", best);

  document.getElementById("statScore").textContent = score;
  document.getElementById("statCoins").textContent = coins;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "flappy", score);
}

document.getElementById("replayBtn").onclick = () => location.reload();

canvas.addEventListener("click", flap);
window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    flap();
  }
});
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  flap();
}, { passive: false });

applyLang();
loop();
