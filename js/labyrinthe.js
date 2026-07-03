import { saveScore } from "../api.js";

const SIZE = 8;
const TIME_LIMIT = 90;
const mazeEl = document.getElementById("maze");
const timerEl = document.getElementById("timer");

const cells = Array.from({ length: SIZE }, () =>
  Array.from({ length: SIZE }, () => ({ N: true, S: true, E: true, W: true, visited: false }))
);

function generateMaze() {
  const stack = [[0, 0]];
  cells[0][0].visited = true;
  const opposite = { N: "S", S: "N", E: "W", W: "E" };

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const neighbors = [];

    if (r > 0 && !cells[r - 1][c].visited) neighbors.push(["N", r - 1, c]);
    if (r < SIZE - 1 && !cells[r + 1][c].visited) neighbors.push(["S", r + 1, c]);
    if (c > 0 && !cells[r][c - 1].visited) neighbors.push(["W", r, c - 1]);
    if (c < SIZE - 1 && !cells[r][c + 1].visited) neighbors.push(["E", r, c + 1]);

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const [dir, nr, nc] = neighbors[Math.floor(Math.random() * neighbors.length)];
    cells[r][c][dir] = false;
    cells[nr][nc][opposite[dir]] = false;
    cells[nr][nc].visited = true;
    stack.push([nr, nc]);
  }
}

let playerR = 0;
let playerC = 0;
const goalR = SIZE - 1;
const goalC = SIZE - 1;
let over = false;
let timeLeft = TIME_LIMIT;

function render() {
  mazeEl.innerHTML = "";
  cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      const div = document.createElement("div");
      div.className = "maze-cell";
      if (cell.N) div.classList.add("wall-N");
      if (cell.S) div.classList.add("wall-S");
      if (cell.E) div.classList.add("wall-E");
      if (cell.W) div.classList.add("wall-W");

      if (r === playerR && c === playerC) {
        div.classList.add("player");
      } else if (r === goalR && c === goalC) {
        div.classList.add("goal");
        div.textContent = "🏁";
      }

      mazeEl.appendChild(div);
    });
  });
}

function move(dir) {
  if (over) return;
  const cell = cells[playerR][playerC];
  if (dir === "up" && !cell.N) playerR--;
  if (dir === "down" && !cell.S) playerR++;
  if (dir === "left" && !cell.W) playerC--;
  if (dir === "right" && !cell.E) playerC++;

  render();

  if (playerR === goalR && playerC === goalC) {
    win();
  }
}

async function win() {
  over = true;
  clearInterval(timerInterval);
  alert(`Bravo, tu as trouvé la sortie avec ${timeLeft}s restantes !`);
  await saveScore("CW-BLK-1-0001", "labyrinthe", timeLeft);
  window.location.href = "../index.html";
}

async function lose() {
  over = true;
  alert("Temps écoulé !");
  await saveScore("CW-BLK-1-0001", "labyrinthe", 0);
  window.location.href = "../index.html";
}

const timerInterval = setInterval(() => {
  timeLeft--;
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `${min}:${sec}`;
  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    lose();
  }
}, 1000);

const KEY_DIRECTIONS = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down"
};

window.addEventListener("keydown", e => {
  const dir = KEY_DIRECTIONS[e.key];
  if (!dir) return;
  e.preventDefault();
  move(dir);
});

let touchStartX = 0;
let touchStartY = 0;

mazeEl.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

mazeEl.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}, { passive: true });

generateMaze();
render();
