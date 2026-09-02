import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Touche l'écran pour sauter, passe par la couleur qui correspond à ta balle",
    gameOver: "💥 Perdu !", score: "Score", best: "Meilleur score",
    startPrompt: "Touche pour commencer"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Tap the screen to jump, pass through the color matching your ball",
    gameOver: "💥 Lost!", score: "Score", best: "Best score",
    startPrompt: "Tap to start"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile: { gravity: 0.15, jump: -5.6, rot: 0.005, gap: 480, stroke: 38, orbChance: 0.45 },
  moyen: { gravity: 0.18, jump: -5.8, rot: 0.009, gap: 440, stroke: 32, orbChance: 0.4 },
  difficile: { gravity: 0.22, jump: -6.0, rot: 0.014, gap: 400, stroke: 26, orbChance: 0.35 },
  impossible: { gravity: 0.27, jump: -6.3, rot: 0.02, gap: 360, stroke: 20, orbChance: 0.3 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_TEXT = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const WHEEL_COLORS = ["#E8AA42", "#e74c3c", "#5AC8FA", "#2ecc71"];

// La balle reste toujours fixe au centre de l'écran : c'est le décor
// (obstacles, orbes) qui défile en fonction de la propre vélocité de la
// balle (gravité + sauts du joueur), jamais sur un minuteur indépendant.
const CENTER_X = W / 2;
const CENTER_Y = H / 2;
const BALL_R = 13;
const RING_R = 130;
const ORB_R = 14;
const FALL_LIMIT = H;

// Zone de départ : la balle ne peut pas tomber en dessous de cette hauteur
// tant qu'elle n'a franchi aucun obstacle (comme un mur/sol invisible).
const START_FLOOR_Y = 230;
// Distance (en unités du monde) avant le tout premier obstacle.
const FIRST_OBSTACLE_DIST = 480;

const SHAPES = [
  { shape: "ring", segments: 4, weight: 0.4 },
  { shape: "bar", segments: 2, weight: 0.3 },
  { shape: "triangle", segments: 3, weight: 0.3 }
];

let cfg = DIFFICULTIES.moyen;
let ballColor = WHEEL_COLORS[0];
let ballWorldY = 0;
let peakWorldY = 0;
let velocity = 0;
let score = 0;
let best = 0;
let over = true;
let started = false;
let frame = 0;
let nextSpawnWorldY = -FIRST_OBSTACLE_DIST;
let obstacles = [];
let orbs = [];
let particles = [];
let flashAlpha = 0;

function screenY(worldY) {
  return worldY - ballWorldY + CENTER_Y;
}

function pickShape() {
  const r = Math.random();
  let acc = 0;
  for (const s of SHAPES) {
    acc += s.weight;
    if (r <= acc) return s;
  }
  return SHAPES[0];
}

function pickColors(segments) {
  const shuffled = [...WHEEL_COLORS].sort(() => Math.random() - 0.5);
  const colors = shuffled.slice(0, segments);
  // Garantit qu'au moins un segment correspond toujours à la couleur
  // actuelle de la balle au moment de la génération : sinon l'obstacle
  // serait impossible à franchir.
  if (!colors.includes(ballColor)) {
    colors[Math.floor(Math.random() * colors.length)] = ballColor;
  }
  return colors;
}

function spawnAhead() {
  while (ballWorldY - nextSpawnWorldY < H) {
    const { shape, segments } = pickShape();
    const solid = shape !== "ring";
    const outer = solid ? RING_R * (shape === "bar" ? 0.62 : 0.7) : RING_R + cfg.stroke / 2;
    const inner = solid ? 0 : RING_R - cfg.stroke / 2;

    obstacles.push({
      worldY: nextSpawnWorldY,
      rotation: Math.random() * Math.PI * 2,
      shape, segments, solid, outer, inner,
      colors: pickColors(segments),
      passed: false,
      checked: false
    });

    if (Math.random() < cfg.orbChance) {
      const otherColors = WHEEL_COLORS.filter(c => c !== ballColor);
      orbs.push({
        worldY: nextSpawnWorldY + cfg.gap / 2,
        color: otherColors[Math.floor(Math.random() * otherColors.length)],
        collected: false
      });
    }

    nextSpawnWorldY -= cfg.gap;
  }
}

function jump() {
  if (over) return;
  started = true;
  velocity = cfg.jump;
  if (window.CubySfx) CubySfx.tap();
}

function segmentColor(obstacle, angle) {
  let a = angle - obstacle.rotation;
  a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const step = (Math.PI * 2) / obstacle.segments;
  const idx = Math.floor(a / step) % obstacle.segments;
  return obstacle.colors[idx];
}

function spawnBurst(worldY, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 2.5;
    particles.push({ x: CENTER_X, worldY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

function update() {
  frame++;

  if (!started) {
    return;
  }
  if (over) return;

  velocity += cfg.gravity;
  ballWorldY += velocity;

  // Mur invisible : impossible de mourir en tombant tant qu'aucun obstacle
  // n'a encore été franchi.
  if (score === 0 && ballWorldY > START_FLOOR_Y) {
    ballWorldY = START_FLOOR_Y;
    velocity = Math.min(velocity, 0);
  }

  peakWorldY = Math.min(peakWorldY, ballWorldY);

  spawnAhead();

  obstacles.forEach(o => (o.rotation += cfg.rot));
  // On ne retire un obstacle que lorsqu'il est réellement passé et défilé
  // hors de l'écran, jamais parce qu'il est simplement encore loin devant.
  obstacles = obstacles.filter(o => screenY(o.worldY) < H + RING_R + cfg.stroke);

  particles.forEach(p => {
    p.x += p.vx;
    p.worldY += p.vy;
    p.life -= 0.03;
  });
  particles = particles.filter(p => p.life > 0);

  orbs.forEach(o => {
    if (o.collected) return;
    if (Math.abs(ballWorldY - o.worldY) < ORB_R + BALL_R) {
      o.collected = true;
      ballColor = o.color;
      spawnBurst(o.worldY, o.color);
      if (window.CubySfx) CubySfx.coin();
    }
  });
  orbs = orbs.filter(o => !o.collected && screenY(o.worldY) < H + ORB_R);

  for (const o of obstacles) {
    if (o.passed) continue;

    const dist = Math.abs(ballWorldY - o.worldY);

    // Un seul contrôle de couleur au moment du contact (pas à chaque frame
    // tant que la balle reste dans la bande), sinon la couleur devrait
    // rester valide pendant plusieurs frames d'affilée au lieu d'un instant.
    if (!o.checked && dist <= o.outer + BALL_R) {
      o.checked = true;
      const angle = ballWorldY < o.worldY ? -Math.PI / 2 : Math.PI / 2;
      const color = segmentColor(o, angle);
      if (color !== ballColor) {
        endGame();
        return;
      }
    }

    if (ballWorldY < o.worldY - o.outer) {
      o.passed = true;
      score++;
      spawnBurst(o.worldY, ballColor);
      if (window.CubySfx) CubySfx.match();
    }
  }

  if (score > 0 && ballWorldY - peakWorldY > FALL_LIMIT) {
    endGame();
  }
}

function drawObstacle(o) {
  const y = screenY(o.worldY);
  if (y < -RING_R - cfg.stroke || y > H + RING_R + cfg.stroke) return;
  const step = (Math.PI * 2) / o.segments;

  if (!o.solid) {
    for (let i = 0; i < o.segments; i++) {
      const start = o.rotation + i * step;
      ctx.beginPath();
      ctx.arc(CENTER_X, y, RING_R, start, start + step);
      ctx.strokeStyle = o.colors[i];
      ctx.lineWidth = cfg.stroke;
      ctx.lineCap = "butt";
      ctx.stroke();
    }
  } else {
    for (let i = 0; i < o.segments; i++) {
      const start = o.rotation + i * step;
      ctx.beginPath();
      ctx.moveTo(CENTER_X, y);
      ctx.arc(CENTER_X, y, o.outer, start, start + step);
      ctx.closePath();
      ctx.fillStyle = o.colors[i];
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(CENTER_X, y, o.outer, 0, Math.PI * 2);
    ctx.strokeStyle = COLOR_BG;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawOrb(o) {
  const y = screenY(o.worldY);
  if (y < -30 || y > H + 30) return;
  ctx.fillStyle = o.color;
  ctx.beginPath();
  ctx.arc(CENTER_X, y, ORB_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLOR_TEXT;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  obstacles.forEach(drawObstacle);
  orbs.forEach(drawOrb);

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, screenY(p.worldY), 3, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = ballColor;
  ctx.beginPath();
  ctx.arc(CENTER_X, CENTER_Y, BALL_R, 0, Math.PI * 2);
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
  ballColor = WHEEL_COLORS[0];
  ballWorldY = 0;
  peakWorldY = 0;
  velocity = 0;
  score = 0;
  best = Number(localStorage.getItem("bestColorSwitch") || 0);
  frame = 0;
  nextSpawnWorldY = -FIRST_OBSTACLE_DIST;
  obstacles = [];
  orbs = [];
  particles = [];
  over = false;
  started = false;

  spawnAhead();

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
  getState: () => ({ score, over, started, ballWorldY, ballColor, obstacles: obstacles.length, orbs: orbs.length })
};

applyLang();
draw();
