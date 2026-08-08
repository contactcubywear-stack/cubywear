import { saveScore } from "../api.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");
const hudEl = document.getElementById("hud");

const W = 340;
const H = 500;
canvas.width = W;
canvas.height = H;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_PADDLE = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_BALL = theme.getPropertyValue("--text-white").trim() || "#ffffff";
const BRICK_COLORS = ["#e74c3c", "#F2811D", "#F5D30F", "#2ecc71"];

const PADDLE_W = 70;
const PADDLE_H = 12;
const PADDLE_Y = H - 30;
const PADDLE_SPEED = 260;

const BALL_R = 6;

const BRICK_COLS = 6;
const BRICK_ROWS = 4;
const BRICK_W = 46;
const BRICK_H = 18;
const BRICK_PAD = 5;
const BRICK_TOP = 45;
const BRICK_LEFT = (W - (BRICK_COLS * (BRICK_W + BRICK_PAD) - BRICK_PAD)) / 2;

let paddleX = W / 2 - PADDLE_W / 2;
let movingLeft = false;
let movingRight = false;

let ball = { x: W / 2, y: PADDLE_Y - BALL_R, vx: 0, vy: 0 };
let bricks = [];
let score = 0;
let lives = 3;
let over = true;
let started = false;

function initBricks() {
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_LEFT + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w: BRICK_W,
        h: BRICK_H,
        color: BRICK_COLORS[r % BRICK_COLORS.length],
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
  ball.x = paddleX + PADDLE_W / 2;
  ball.y = PADDLE_Y - BALL_R;
  ball.vx = 0;
  ball.vy = 0;
}

function launchBall() {
  if (over) return;
  started = true;
  ball.vx = (Math.random() < 0.5 ? -1 : 1) * 160;
  ball.vy = -220;
  document.getElementById("startOverlay").hidden = true;
}

function update(delta) {
  if (over) return;

  if (movingLeft) paddleX -= PADDLE_SPEED * delta;
  if (movingRight) paddleX += PADDLE_SPEED * delta;
  paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

  if (!started) {
    ball.x = paddleX + PADDLE_W / 2;
    return;
  }

  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

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
      b.alive = false;
      ball.vy *= -1;
      score += 10;
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
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
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

function startGame() {
  initBricks();
  paddleX = W / 2 - PADDLE_W / 2;
  score = 0;
  lives = 3;
  over = false;
  updateHud();
  resetBall();
  draw();
  lastTime = null;
  requestAnimationFrame(loop);
}

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
window.__breakoutDebug = { update, draw, launchBall, getBall: () => ball, getBricks: () => bricks, getState: () => ({ score, lives, over, started, paddleX }) };

startGame();
