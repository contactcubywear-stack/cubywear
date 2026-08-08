import { saveScore } from "../api.js";

const DIFFICULTY_SETTINGS = {
  facile:     { lives: 3, w: 340, h: 500, brickHits: 1, bonus: false, cols: 6, rows: 4 },
  moyen:      { lives: 3, w: 340, h: 500, brickHits: 2, bonus: false, cols: 6, rows: 4 },
  difficile:  { lives: 1, w: 380, h: 560, brickHits: 2, bonus: false, cols: 7, rows: 5 },
  impossible: { lives: 1, w: 380, h: 560, brickHits: 3, bonus: true,  cols: 7, rows: 5 }
};

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");
const hudEl = document.getElementById("hud");

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
let bricksDestroyed = 0;
let score = 0;
let lives = 3;
let over = true;
let started = false;

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
  hudEl.textContent = `Score : ${score} · Vies : ${lives}`;
}

function resetBall() {
  started = false;
  ball = { x: paddleX + PADDLE_W / 2, y: PADDLE_Y - BALL_R, vx: 0, vy: 0 };
}

function launchBall() {
  if (over) return;
  started = true;
  ball.vx = (Math.random() < 0.5 ? -1 : 1) * 160;
  ball.vy = -220;
  document.getElementById("startOverlay").hidden = true;
}

function spawnBonus(x, y) {
  bonuses.push({ x, y, vy: 90 });
}

function update(delta) {
  if (over) return;

  if (movingLeft) paddleX -= PADDLE_SPEED * delta;
  if (movingRight) paddleX += PADDLE_SPEED * delta;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

  bonuses.forEach(b => (b.y += b.vy * delta));
  bonuses = bonuses.filter(b => {
    if (b.y > PADDLE_Y && b.y < PADDLE_Y + PADDLE_H && b.x > paddleX && b.x < paddleX + PADDLE_W) {
      lives++;
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
  } else if (ball.x > W - BALL_R) {
    ball.x = W - BALL_R;
    ball.vx *= -1;
  }
  if (ball.y < BALL_R) {
    ball.y = BALL_R;
    ball.vy *= -1;
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
        if (b.bonus) spawnBonus(b.x + b.w / 2, b.y + b.h / 2);
      } else {
        score += 3;
      }
      updateHud();
    }
  });

  if (ball.y > H) {
    lives--;
    updateHud();
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
  document.getElementById("resultTitle").textContent = won ? "🎉 Bravo, briques détruites !" : "💥 Perdu !";
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "breakout", score);
}

function applyAreaSize() {
  canvas.width = W;
  canvas.height = H;
  area.style.width = `min(92vw, ${W}px)`;
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
  bricksDestroyed = 0;
  paddleX = W / 2 - PADDLE_W / 2;
  score = 0;
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
