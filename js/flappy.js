import { saveScore } from "../api.js";

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
const PIPE_GAP = 150;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 95;
const GROUND_HEIGHT = 20;

let birdY = H / 2;
let velocity = 0;
let score = 0;
let frame = 0;
let pipes = [];
let started = false;
let over = false;

function spawnPipe() {
  const margin = 60;
  const gapY = margin + Math.random() * (H - GROUND_HEIGHT - margin * 2 - PIPE_GAP) + PIPE_GAP / 2;
  pipes.push({ x: W, gapY, passed: false });
}

function flap() {
  if (over) return;
  started = true;
  velocity = JUMP;
}

function update() {
  if (!started) {
    birdY = H / 2 + Math.sin(frame / 15) * 8;
    frame++;
    return;
  }

  velocity += GRAVITY;
  birdY += velocity;

  frame++;
  if (frame % PIPE_INTERVAL === 0) spawnPipe();

  pipes.forEach(p => (p.x -= PIPE_SPEED));
  pipes = pipes.filter(p => p.x + PIPE_WIDTH > 0);

  pipes.forEach(p => {
    if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
      p.passed = true;
      score++;
    }

    const withinX = BIRD_X + BIRD_SIZE > p.x && BIRD_X < p.x + PIPE_WIDTH;
    if (withinX) {
      const hitsTop = birdY < p.gapY - PIPE_GAP / 2;
      const hitsBottom = birdY + BIRD_SIZE > p.gapY + PIPE_GAP / 2;
      if (hitsTop || hitsBottom) endGame();
    }
  });

  if (birdY + BIRD_SIZE > H - GROUND_HEIGHT || birdY < 0) endGame();
}

function draw() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, COLOR_SKY_TOP);
  sky.addColorStop(1, COLOR_SKY_BOTTOM);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  pipes.forEach(p => {
    ctx.fillStyle = COLOR_PIPE;
    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.gapY - PIPE_GAP / 2);
    ctx.fillRect(p.x, p.gapY + PIPE_GAP / 2, PIPE_WIDTH, H - (p.gapY + PIPE_GAP / 2));

    ctx.fillStyle = COLOR_PIPE_EDGE;
    ctx.fillRect(p.x - 3, p.gapY - PIPE_GAP / 2 - 8, PIPE_WIDTH + 6, 8);
    ctx.fillRect(p.x - 3, p.gapY + PIPE_GAP / 2, PIPE_WIDTH + 6, 8);
  });

  ctx.fillStyle = COLOR_GROUND;
  ctx.fillRect(0, H - GROUND_HEIGHT, W, GROUND_HEIGHT);

  ctx.save();
  ctx.translate(BIRD_X + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2);
  ctx.rotate(Math.max(-0.4, Math.min(0.9, velocity / 12)));
  ctx.fillStyle = COLOR_BIRD;
  ctx.beginPath();
  ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLOR_SKY_BOTTOM;
  ctx.beginPath();
  ctx.arc(BIRD_SIZE / 4, -BIRD_SIZE / 6, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = COLOR_TEXT;
  ctx.font = "bold 28px Arial";
  ctx.textAlign = "center";
  ctx.fillText(score, W / 2, 50);

  if (!started) {
    ctx.font = "bold 16px Arial";
    ctx.fillText("Touche pour commencer", W / 2, H / 2 - 40);
  }
}

function loop() {
  if (over) return;
  update();
  draw();
  requestAnimationFrame(loop);
}

async function endGame() {
  over = true;
  const best = Math.max(score, Number(localStorage.getItem("flappyBest") || 0));
  localStorage.setItem("flappyBest", best);

  document.getElementById("statScore").textContent = score;
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

loop();
