import { saveScore } from "../api.js";

const LANES = 3;
const TICK_MS = 60;
const SPAWN_EVERY = 18;

const area = document.getElementById("area");
const runner = document.getElementById("runner");
const scoreEl = document.getElementById("score");

let playerLane = 1;
let obstacles = [];
let score = 0;
let tickCount = 0;
let over = true;
let gameInterval = null;

function laneCenterPercent(lane) {
  return ((lane + 0.5) / LANES) * 100;
}

function positionRunner() {
  runner.style.left = `${laneCenterPercent(playerLane)}%`;
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const el = document.createElement("div");
  el.className = "obstacle";
  el.textContent = "🚧";
  el.style.left = `${laneCenterPercent(lane)}%`;
  el.style.top = "0%";
  area.appendChild(el);
  obstacles.push({ lane, top: 0, el });
}

function speedForScore() {
  return Math.min(2 + score * 0.01, 6);
}

function tick() {
  score++;
  scoreEl.textContent = `Score : ${score}`;

  tickCount++;
  if (tickCount % SPAWN_EVERY === 0) spawnObstacle();

  const speed = speedForScore();
  obstacles.forEach(o => {
    o.top += speed;
    o.el.style.top = `${o.top}%`;
  });

  const collided = obstacles.some(o => o.lane === playerLane && o.top >= 78 && o.top <= 92);
  if (collided) {
    endGame();
    return;
  }

  obstacles = obstacles.filter(o => {
    if (o.top > 100) {
      o.el.remove();
      return false;
    }
    return true;
  });
}

function moveLane(dir) {
  if (over) return;
  if (dir === "left" && playerLane > 0) playerLane--;
  if (dir === "right" && playerLane < LANES - 1) playerLane++;
  positionRunner();
}

async function endGame() {
  over = true;
  clearInterval(gameInterval);
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "swipe-runner", score);
}

function startGame() {
  playerLane = 1;
  obstacles.forEach(o => o.el.remove());
  obstacles = [];
  score = 0;
  tickCount = 0;
  over = false;

  positionRunner();
  scoreEl.textContent = "Score : 0";
  document.getElementById("startOverlay").hidden = true;

  gameInterval = setInterval(tick, TICK_MS);
}

document.getElementById("startBtn").onclick = startGame;
document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("btnLeft").onclick = () => moveLane("left");
document.getElementById("btnRight").onclick = () => moveLane("right");

let touchStartX = 0;
area.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

area.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) < 30) return;
  moveLane(dx > 0 ? "right" : "left");
}, { passive: true });

positionRunner();
