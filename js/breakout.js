import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    launch: "Lancer la balle",
    hint: "Glisse, utilise les boutons ou les flèches pour déplacer la raquette",
    finalScore: "Score final", best: "Meilleur score",
    win: "🎉 Bravo, briques détruites !", lose: "💥 Perdu !"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    launch: "Launch the ball",
    hint: "Swipe, use the buttons, or the arrow keys to move the paddle",
    finalScore: "Final score", best: "Best score",
    win: "🎉 All bricks destroyed!", lose: "💥 Lost!"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTY_SETTINGS = {
  facile:     { lives: 3, w: 340, h: 500, brickHits: 1, bonus: false, cols: 6, rows: 4 },
  moyen:      { lives: 3, w: 340, h: 500, brickHits: 2, bonus: false, cols: 6, rows: 4 },
  difficile:  { lives: 1, w: 380, h: 560, brickHits: 2, bonus: false, cols: 7, rows: 5 },
  impossible: { lives: 1, w: 380, h: 560, brickHits: 3, bonus: true,  cols: 7, rows: 5 }
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_PADDLE = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_BALL = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const COLOR_BONUS = "#2ecc71";
const BRICK_COLORS = ["#e74c3c", "#F2811D", "#F5D30F", "#5AC8FA", "#9B59B6"];

let W, H;
let difficulty;
let settings;

const PADDLE_W = 70;
const PADDLE_H = 12;
const PADDLE_SPEED = 260;
const BALL_R = 6;
const BRICK_H = 18;
const BRICK_PAD = 5;
const BRICK_TOP = 45;

let PADDLE_Y;
let paddleX;
let movingLeft = false;
let movingRight = false;

let ball;
let bricks = [];
let bonuses = [];
let particles = [];
let bricksDestroyed = 0;
let score = 0;
let lives = 3;
let best = 0;
let over = true;
let started = false;

function spawnParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 80;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
  }
}

function speedMultiplier() {
  return Math.min(1 + bricksDestroyed * 0.04, 2.2);
}

function initBricks() {
  bricks = [];
  const brickW = Math.floor((W - 20 - (settings.cols - 1) * BRICK_PAD) / settings.cols);
  const left = (W - (settings.cols * (brickW + BRICK_PAD) - BRICK_PAD)) / 2;

  for (let r = 0; r < settings.rows; r++) {
    for (let c = 0; c < settings.cols; c++) {
      const isBonus = settings.bonus && Math.random() < 0.12;
      bricks.push({
        x: left + c * (brickW + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w: brickW,
        h: BRICK_H,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
        hits: settings.brickHits,
        maxHits: settings.brickHits,
        bonus: isBonus,
        alive: true
      });
    }
  }
}

function updateHud() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("livesVal").textContent = lives;
}

function resetBall() {
  started = false;
  ball = { x: paddleX + PADDLE_W / 2, y: PADDLE_Y - BALL_R, vx: 0, vy: 0 };
}

function launchBall(e) {
  if (e) e.stopPropagation();
  if (over) return;
  started = true;
  ball.vx = (Math.random() < 0.5 ? -1 : 1) * 160;
  ball.vy = -220;
  document.getElementById("startOverlay").hidden = true;
  if (window.CubySfx) CubySfx.tap();
}

function spawnBonus(x, y) {
  bonuses.push({ x, y, vy: 90 });
}

function update(delta) {
  if (over) return;

  if (movingLeft) paddleX -= PADDLE_SPEED * delta;
  if (movingRight) paddleX += PADDLE_SPEED * delta;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

  particles.forEach(p => {
    p.x += p.vx * delta;
    p.y += p.vy * delta;
    p.life -= delta * 2;
  });
  particles = particles.filter(p => p.life > 0);

  bonuses.forEach(b => (b.y += b.vy * delta));
  bonuses = bonuses.filter(b => {
    if (b.y > PADDLE_Y && b.y < PADDLE_Y + PADDLE_H && b.x > paddleX && b.x < paddleX + PADDLE_W) {
      lives++;
      if (window.CubySfx) CubySfx.coin();
      updateHud();
      return false;
    }
    return b.y < H + 20;
  });

  if (!started) {
    ball.x = paddleX + PADDLE_W / 2;
    return;
  }

  const mult = speedMultiplier();
  ball.x += ball.vx * mult * delta;
  ball.y += ball.vy * mult * delta;

  if (ball.x < BALL_R) {
    ball.x = BALL_R;
    ball.vx *= -1;
    if (window.CubySfx) CubySfx.tap();
  } else if (ball.x > W - BALL_R) {
    ball.x = W - BALL_R;
    ball.vx *= -1;
    if (window.CubySfx) CubySfx.tap();
  }
  if (ball.y < BALL_R) {
    ball.y = BALL_R;
    ball.vy *= -1;
    if (window.CubySfx) CubySfx.tap();
  }

  if (
    ball.vy > 0 &&
    ball.y + BALL_R >= PADDLE_Y &&
    ball.y + BALL_R <= PADDLE_Y + PADDLE_H &&
    ball.x >= paddleX &&
    ball.x <= paddleX + PADDLE_W
  ) {
    ball.y = PADDLE_Y - BALL_R;
    const hitPos = (ball.x - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
    ball.vx = hitPos * 220;
    ball.vy = -Math.abs(ball.vy);
    if (window.CubySfx) CubySfx.place();
  }

  bricks.forEach(b => {
    if (!b.alive) return;
    if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + b.w && ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + b.h) {
      b.hits--;
      ball.vy *= -1;
      if (b.hits <= 0) {
        b.alive = false;
        bricksDestroyed++;
        score += 10;
        spawnParticles(b.x + b.w / 2, b.y + b.h / 2, b.color);
        if (window.CubySfx) CubySfx.match();
        if (b.bonus) spawnBonus(b.x + b.w / 2, b.y + b.h / 2);
      } else {
        if (window.CubySfx) CubySfx.tap();
        score += 3;
      }
      updateHud();
    }
  });

  if (ball.y > H) {
    lives--;
    updateHud();
    if (window.CubySfx) CubySfx.hit();
    if (lives <= 0) {
      endGame(false);
      return;
    }
    resetBall();
    document.getElementById("startOverlay").hidden = false;
  }

  if (bricks.every(b => !b.alive)) {
    endGame(true);
  }
}

function draw() {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, W, H);

  bricks.forEach(b => {
    if (!b.alive) return;
    ctx.globalAlpha = 0.4 + 0.6 * (b.hits / b.maxHits);
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.globalAlpha = 1;
    if (b.bonus) {
      ctx.fillStyle = COLOR_BONUS;
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (b.maxHits > 1) {
      ctx.fillStyle = "#130D33";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.fillText(b.hits, b.x + b.w / 2, b.y + b.h / 2 + 4);
    }
  });

  ctx.fillStyle = COLOR_BONUS;
  bonuses.forEach(b => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  particles.forEach(p => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = COLOR_PADDLE;
  ctx.fillRect(paddleX, PADDLE_Y, PADDLE_W, PADDLE_H);

  ctx.fillStyle = COLOR_BALL;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
}

let lastTime = null;
function loop(now) {
  if (lastTime === null) lastTime = now;
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(delta);
  draw();
  if (!over) requestAnimationFrame(loop);
}

async function endGame(won) {
  over = true;
  if (window.CubySfx) (won ? CubySfx.win() : CubySfx.lose());

  best = Math.max(score, best);
  localStorage.setItem("bestBreakout", best);

  document.getElementById("resultTitle").textContent = won ? T[lang].win : T[lang].lose;
  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "breakout", score);
}

function applyAreaSize() {
  canvas.width = W;
  canvas.height = H;
  area.style.width = `min(calc(100vw - 40px), ${W}px)`;
  area.style.aspectRatio = `${W} / ${H}`;
  area.style.height = "auto";
}

function startGame(level) {
  difficulty = level;
  settings = DIFFICULTY_SETTINGS[difficulty];
  W = settings.w;
  H = settings.h;
  PADDLE_Y = H - 30;

  applyAreaSize();
  initBricks();
  bonuses = [];
  particles = [];
  bricksDestroyed = 0;
  paddleX = W / 2 - PADDLE_W / 2;
  score = 0;
  best = Number(localStorage.getItem("bestBreakout") || 0);
  lives = settings.lives;
  over = false;
  updateHud();
  resetBall();
  draw();
  lastTime = null;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  requestAnimationFrame(loop);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("startBtn").onclick = launchBall;
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

function setMove(dir, active) {
  if (dir === "left") movingLeft = active;
  if (dir === "right") movingRight = active;
}

const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");

["mousedown", "touchstart"].forEach(evt => {
  btnLeft.addEventListener(evt, e => { e.preventDefault(); setMove("left", true); });
  btnRight.addEventListener(evt, e => { e.preventDefault(); setMove("right", true); });
});
["mouseup", "mouseleave", "touchend"].forEach(evt => {
  btnLeft.addEventListener(evt, () => setMove("left", false));
  btnRight.addEventListener(evt, () => setMove("right", false));
});

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") setMove("left", true);
  if (e.key === "ArrowRight") setMove("right", true);
  if (e.key === " ") launchBall();
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") setMove("left", false);
  if (e.key === "ArrowRight") setMove("right", false);
});

area.addEventListener("touchmove", e => {
  const rect = area.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, (touchX / rect.width) * W - PADDLE_W / 2));
}, { passive: true });

// Hook de test/debug (aucun impact en jeu normal).
window.__breakoutDebug = {
  update, draw, launchBall,
  getBall: () => ball, getBricks: () => bricks, getBonuses: () => bonuses,
  getState: () => ({ score, lives, over, started, paddleX, bricksDestroyed, mult: speedMultiplier() })
};
