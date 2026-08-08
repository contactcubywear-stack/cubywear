import { saveScore } from "../api.js";

const GRID = 15;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");

const foodEl = document.createElement("div");
foodEl.className = "food";
boardEl.appendChild(foodEl);

let segmentEls = [];

function cellPct(v) {
  return (v / GRID) * 100;
}

function syncSegments() {
  while (segmentEls.length < snake.length) {
    const div = document.createElement("div");
    div.className = "segment";
    boardEl.insertBefore(div, foodEl);
    segmentEls.push(div);
  }
  while (segmentEls.length > snake.length) {
    segmentEls.pop().remove();
  }
}

let snake, dir, nextDir, food, score, over, tickHandle, tickDuration;

function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function render() {
  syncSegments();
  snake.forEach((s, i) => {
    const el = segmentEls[i];
    el.className = "segment " + (i === 0 ? "head" : "body");
    el.style.transitionDuration = `${tickDuration}ms`;
    el.style.left = `${cellPct(s.x)}%`;
    el.style.top = `${cellPct(s.y)}%`;
  });
  foodEl.style.left = `${cellPct(food.x)}%`;
  foodEl.style.top = `${cellPct(food.y)}%`;
}

function speedForScore() {
  return Math.max(180 - score * 4, 70);
}

function scheduleTick() {
  clearInterval(tickHandle);
  tickDuration = speedForScore();
  tickHandle = setInterval(tick, tickDuration);
}

function tick() {
  if (over) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitsWall = head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID;
  const hitsSelf = snake.some(s => s.x === head.x && s.y === head.y);
  if (hitsWall || hitsSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = `Score : ${score}`;
    placeFood();
    scheduleTick();
  } else {
    snake.pop();
  }

  render();
}

function setDir(x, y) {
  if (over) return;
  if (dir.x === -x && dir.y === -y) return;
  nextDir = { x, y };
}

async function endGame() {
  over = true;
  clearInterval(tickHandle);
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "snake", score);
}

function startGame() {
  snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  over = false;
  scoreEl.textContent = "Score : 0";
  placeFood();
  tickDuration = speedForScore();
  render();
  // Pas de transition sur le premier rendu, pour éviter un glissement
  // depuis le coin (0,0) au tout premier affichage.
  segmentEls.forEach(el => { el.style.transitionDuration = "0ms"; });
  requestAnimationFrame(() => scheduleTick());
}

document.getElementById("btnUp").onclick = () => setDir(0, -1);
document.getElementById("btnDown").onclick = () => setDir(0, 1);
document.getElementById("btnLeft").onclick = () => setDir(-1, 0);
document.getElementById("btnRight").onclick = () => setDir(1, 0);

const KEY_DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
window.addEventListener("keydown", e => {
  const d = KEY_DIRS[e.key];
  if (!d) return;
  e.preventDefault();
  setDir(d[0], d[1]);
});

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__snakeDebug = { tick, setDir, getSnake: () => snake, getFood: () => food };

startGame();
