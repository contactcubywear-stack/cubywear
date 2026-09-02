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
  facile: { gravity: 0.28, jump: -6.6, rot: 0.006, gap: 380, stroke: 34, orbChance: 0.45 },
  moyen: { gravity: 0.32, jump: -6.6, rot: 0.011, gap: 340, stroke: 28, orbChance: 0.4 },
  difficile: { gravity: 0.37, jump: -6.6, rot: 0.017, gap: 300, stroke: 22, orbChance: 0.35 },
  impossible: { gravity: 0.43, jump: -6.6, rot: 0.026, gap: 260, stroke: 18, orbChance: 0.3 }
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_TEXT = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const WHEEL_COLORS = ["#E8AA42", "#e74c3c", "#5AC8FA", "#2ecc71"];

// La balle reste toujours fixe au centre de l'écran : c'est le décor (anneaux,
// orbes) qui défile en fonction de la propre vélocité de la balle (gravité +
// sauts du joueur), jamais sur un minuteur indépendant.
const CENTER_X = W / 2;
const CENTER_Y = H / 2;
const BALL_R = 13;
const RING_R = 95;
const ORB_R = 12;
const FALL_LIMIT = H;

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
let nextSpawnWorldY = -260;
let rings = [];
let orbs = [];
let particles = [];
let flashAlpha = 0;

function screenY(worldY) {
  return worldY - ballWorldY + CENTER_Y;
}

function spawnAhead() {
  while (ballWorldY - nextSpawnWorldY < H) {
    rings.push({
      worldY: nextSpawnWorldY,
      rotation: Math.random() * Math.PI * 2,
      passed: false
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

function quadrantColor(ring, angle) {
  let a = angle - ring.rotation;
  a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const idx = Math.floor(a / (Math.PI / 2)) % 4;
  return WHEEL_COLORS[idx];
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
  peakWorldY = Math.min(peakWorldY, ballWorldY);

  spawnAhead();

  rings.forEach(r => (r.rotation += cfg.rot));
  rings = rings.filter(r => ballWorldY - r.worldY < H + RING_R);

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
  orbs = orbs.filter(o => !o.collected && ballWorldY - o.worldY < H + ORB_R);

  for (const r of rings) {
    if (r.passed) continue;

    const dist = Math.abs(ballWorldY - r.worldY);
    const inner = RING_R - cfg.stroke / 2;
    const outer = RING_R + cfg.stroke / 2;

    // Un seul contrôle de couleur au moment du contact (pas à chaque frame
    // tant que la balle reste dans la bande), sinon la couleur devrait
    // rester valide pendant plusieurs frames d'affilée au lieu d'un instant.
    if (!r.checked && dist <= outer + BALL_R) {
      r.checked = true;
      const angle = ballWorldY < r.worldY ? -Math.PI / 2 : Math.PI / 2;
      const color = quadrantColor(r, angle);
      if (color !== ballColor) {
        endGame();
        return;
      }
    }

    if (ballWorldY < r.worldY - outer) {
      r.passed = true;
      score++;
      spawnBurst(r.worldY, ballColor);
      if (window.CubySfx) CubySfx.match();
    }
  }

  if (ballWorldY - peakWorldY > FALL_LIMIT) {
    endGame();
  }
}

function drawRing(r) {
  const y = screenY(r.worldY);
  if (y < -RING_R - cfg.stroke || y > H + RING_R + cfg.stroke) return;
  const segments = 4;
  for (let i = 0; i < segments; i++) {
    const start = r.rotation + i * (Math.PI / 2);
    ctx.beginPath();
    ctx.arc(CENTER_X, y, RING_R, start, start + Math.PI / 2);
    ctx.strokeStyle = WHEEL_COLORS[i];
    ctx.lineWidth = cfg.stroke;
    ctx.lineCap = "butt";
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

  rings.forEach(drawRing);
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
  nextSpawnWorldY = -260;
  rings = [];
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
  getState: () => ({ score, over, started, ballWorldY, ballColor, rings: rings.length, orbs: orbs.length })
};

applyLang();
draw();
