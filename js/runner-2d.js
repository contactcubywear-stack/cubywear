import { saveScore } from "../api.js";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const area = document.getElementById("area");
const scoreEl = document.getElementById("score");

const W = 380;
const H = 260;
canvas.width = W;
canvas.height = H;

const theme = getComputedStyle(document.documentElement);
const COLOR_BG = theme.getPropertyValue("--bg-main").trim() || "#130D33";
const COLOR_GROUND = theme.getPropertyValue("--accent-blue").trim() || "#1F4690";
const COLOR_PLAYER = theme.getPropertyValue("--accent-gold").trim() || "#E8AA42";
const COLOR_OBSTACLE = "#e74c3c";

const GROUND_Y = H - 40;
const PLAYER_X = 50;
const PLAYER_SIZE = 28;
const GRAVITY = 1400;
const JUMP_VELOCITY = -560;

let playerY = GROUND_Y - PLAYER_SIZE;
let velocityY = 0;
let jumping = false;

let obstacles = [];
let score = 0;
let over = true;
let spawnTimer = 0;

function speedForScore() {
  return Math.min(180 + score * 1.5, 420);
}

function jump() {
  if (over || jumping) return;
  velocityY = JUMP_VELOCITY;
  jumping = true;
}

function spawnObstacle() {
  const height = 24 + Math.random() * 20;
  obstacles.push({ x: W + 10, y: GROUND_Y - height, w: 18, h: height });
}

function update(delta) {
  if (over) return;

  score += delta * 10;

  velocityY += GRAVITY * delta;
  playerY += velocityY * delta;
  if (playerY >= GROUND_Y - PLAYER_SIZE) {
    playerY = GROUND_Y - PLAYER_SIZE;
    velocityY = 0;
    jumping = false;
  }

  const speed = speedForScore();
  spawnTimer += delta;
  const spawnInterval = Math.max(1.3 - score * 0.005, 0.55);
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    spawnObstacle();
  }

  obstacles.forEach(o => (o.x -= speed * delta));
  obstacles = obstacles.filter(o => o.x + o.w > 0);

  const playerBox = { x: PLAYER_X, y: playerY, w: PLAYER_SIZE, h: PLAYER_SIZE };
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

  ctx.fillStyle = COLOR_OBSTACLE;
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  ctx.fillStyle = COLOR_PLAYER;
  ctx.fillRect(PLAYER_X, playerY, PLAYER_SIZE, PLAYER_SIZE);

  ctx.fillStyle = theme.getPropertyValue("--text-white").trim() || "#fff";
  ctx.font = "bold 16px Arial";
  ctx.fillText(Math.floor(score), 10, 22);
}

let lastTime = null;
function loop(now) {
  if (lastTime === null) lastTime = now;
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(delta);
  draw();
  scoreEl.textContent = `Score : ${Math.floor(score)}`;
  if (!over) requestAnimationFrame(loop);
}

async function endGame() {
  over = true;
  const best = Math.max(Math.floor(score), Number(localStorage.getItem("runner2dBest") || 0));
  localStorage.setItem("runner2dBest", best);

  document.getElementById("statScore").textContent = Math.floor(score);
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "runner-2d", Math.floor(score));
}

function startGame() {
  playerY = GROUND_Y - PLAYER_SIZE;
  velocityY = 0;
  jumping = false;
  obstacles = [];
  score = 0;
  spawnTimer = 0;
  over = false;
  document.getElementById("startOverlay").hidden = true;

  lastTime = null;
  requestAnimationFrame(loop);
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("replayBtn").onclick = () => location.reload();

area.addEventListener("click", jump);
area.addEventListener("touchstart", e => {
  e.preventDefault();
  jump();
}, { passive: false });

window.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

// Hook de test/debug (aucun impact en jeu normal).
window.__runner2dDebug = { update, draw, jump, getState: () => ({ score, over, playerY, jumping }), getObstacles: () => obstacles, spawnObstacle };

draw();
