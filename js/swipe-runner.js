import { saveScore } from "../api.js";

const LANES = 3;
const TICK_MS = 60;
const SPAWN_EVERY = 22;

// Perspective illusion: obstacles start small near the "horizon" and
// grow/spread out as they approach the player, like a Subway Surfers–
// style lane runner, without needing real 3D/WebGL.
const HORIZON_Y = 20;
const BOTTOM_Y = 88;
const HORIZON_LANE_X = [44, 50, 56];
const BOTTOM_LANE_X = [15, 50, 85];
const HORIZON_SIZE = 14;
const BOTTOM_SIZE = 42;

const area = document.getElementById("area");
const runner = document.getElementById("runner");
const scoreEl = document.getElementById("score");
const roadSvg = document.getElementById("roadSvg");

let playerLane = 1;
let obstacles = [];
let score = 0;
let tickCount = 0;
let over = true;
let gameInterval = null;

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function laneX(lane, t) {
  return lerp(HORIZON_LANE_X[lane], BOTTOM_LANE_X[lane], t);
}

function yAt(t) {
  return lerp(HORIZON_Y, BOTTOM_Y, t);
}

function sizeAt(t) {
  return lerp(HORIZON_SIZE, BOTTOM_SIZE, t);
}

function drawRoad() {
  const margin = 6;
  const roadPath = `M ${HORIZON_LANE_X[0] - margin} ${HORIZON_Y}
    L ${HORIZON_LANE_X[2] + margin} ${HORIZON_Y}
    L ${BOTTOM_LANE_X[2] + margin * 2} ${BOTTOM_Y + 8}
    L ${BOTTOM_LANE_X[0] - margin * 2} ${BOTTOM_Y + 8} Z`;

  const dividerBetween = (laneA, laneB) => {
    const hx = (HORIZON_LANE_X[laneA] + HORIZON_LANE_X[laneB]) / 2;
    const bx = (BOTTOM_LANE_X[laneA] + BOTTOM_LANE_X[laneB]) / 2;
    return `M ${hx} ${HORIZON_Y} L ${bx} ${BOTTOM_Y + 8}`;
  };

  roadSvg.innerHTML = `
    <path d="${roadPath}" fill="#1c2450" stroke="none"></path>
    <path d="${dividerBetween(0, 1)}" stroke="rgba(255,255,255,0.25)" stroke-width="0.6" stroke-dasharray="3,2"></path>
    <path d="${dividerBetween(1, 2)}" stroke="rgba(255,255,255,0.25)" stroke-width="0.6" stroke-dasharray="3,2"></path>
  `;
}

function positionRunner() {
  runner.style.left = `${laneX(playerLane, 1)}%`;
  runner.style.top = `${BOTTOM_Y}%`;
  runner.style.fontSize = `${BOTTOM_SIZE}px`;
}

function spawnObstacle() {
  const lane = Math.floor(Math.random() * LANES);
  const el = document.createElement("div");
  el.className = "obstacle-3d";
  el.textContent = "🚧";
  area.appendChild(el);
  const obstacle = { lane, t: 0, el };
  renderObstacle(obstacle);
  obstacles.push(obstacle);
}

function renderObstacle(o) {
  o.el.style.left = `${laneX(o.lane, o.t)}%`;
  o.el.style.top = `${yAt(o.t)}%`;
  o.el.style.fontSize = `${sizeAt(o.t)}px`;
}

function speedForScore() {
  return Math.min(0.012 + score * 0.00008, 0.03);
}

function tick() {
  score++;
  scoreEl.textContent = `Score : ${score}`;

  tickCount++;
  if (tickCount % SPAWN_EVERY === 0) spawnObstacle();

  const speed = speedForScore();
  obstacles.forEach(o => {
    o.t += speed;
    renderObstacle(o);
  });

  const collided = obstacles.some(o => o.lane === playerLane && o.t >= 0.94 && o.t <= 1.05);
  if (collided) {
    endGame();
    return;
  }

  obstacles = obstacles.filter(o => {
    if (o.t > 1.1) {
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

drawRoad();
positionRunner();
