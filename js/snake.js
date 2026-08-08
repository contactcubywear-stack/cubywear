import { saveScore } from "../api.js";

const GRID = 15;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");

const cells = [];
for (let i = 0; i < GRID * GRID; i++) {
  const div = document.createElement("div");
  div.className = "cell";
  boardEl.appendChild(div);
  cells.push(div);
}

function idx(x, y) {
  return y * GRID + x;
}

let snake, dir, nextDir, food, score, over, tickHandle;

function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function render() {
  cells.forEach(c => (c.className = "cell"));
  snake.forEach((s, i) => {
    cells[idx(s.x, s.y)].classList.add(i === 0 ? "head" : "body");
  });
  cells[idx(food.x, food.y)].classList.add("food");
}

function speedForScore() {
  return Math.max(180 - score * 4, 70);
}

function scheduleTick() {
  clearInterval(tickHandle);
  tickHandle = setInterval(tick, speedForScore());
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
  render();
  scheduleTick();
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
