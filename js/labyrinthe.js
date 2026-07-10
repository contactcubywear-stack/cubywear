import { saveScore } from "../api.js";

const DIFFICULTY_SETTINGS = {
  facile:    { size: 5,  time: 45, keys: 0 },
  moyen:     { size: 8,  time: 30, keys: 0 },
  difficile: { size: 12, time: 30, keys: 5 }
};

const mazeEl = document.getElementById("maze");
const timerEl = document.getElementById("timer");
const keysStatusEl = document.getElementById("keysStatus");

let SIZE, TIME_LIMIT, KEYS_NEEDED;
let cells;
let playerR, playerC;
let goalR, goalC;
let keyPositions = [];
let keysCollected = 0;
let over = false;
let timeLeft;
let timerInterval;

function generateMaze() {
  cells = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ N: true, S: true, E: true, W: true, visited: false }))
  );

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

function placeKeys() {
  const candidates = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if ((r === 0 && c === 0) || (r === goalR && c === goalC)) continue;
      candidates.push([r, c]);
    }
  }
  candidates.sort(() => Math.random() - 0.5);
  keyPositions = candidates.slice(0, KEYS_NEEDED);
}

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
      } else if (keyPositions.some(([kr, kc]) => kr === r && kc === c)) {
        div.classList.add("key");
        div.textContent = "🔑";
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

  const keyIndex = keyPositions.findIndex(([r, c]) => r === playerR && c === playerC);
  if (keyIndex !== -1) {
    keyPositions.splice(keyIndex, 1);
    keysCollected++;
    keysStatusEl.textContent = `🔑 Clés : ${keysCollected}/${KEYS_NEEDED}`;
  }

  render();

  if (playerR === goalR && playerC === goalC && keysCollected >= KEYS_NEEDED) {
    win();
  }
}

async function win() {
  over = true;
  clearInterval(timerInterval);
  document.getElementById("resultTitle").textContent = `🎉 Trouvé avec ${timeLeft}s restantes !`;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "labyrinthe", timeLeft);
}

async function lose() {
  over = true;
  document.getElementById("resultTitle").textContent = "😕 Temps écoulé !";
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "labyrinthe", 0);
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const sec = String(timeLeft % 60).padStart(2, "0");
    timerEl.textContent = `${min}:${sec}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      lose();
    }
  }, 1000);
}

function startGame(difficulty) {
  const settings = DIFFICULTY_SETTINGS[difficulty];
  SIZE = settings.size;
  TIME_LIMIT = settings.time;
  KEYS_NEEDED = settings.keys;

  playerR = 0;
  playerC = 0;
  goalR = SIZE - 1;
  goalC = SIZE - 1;
  keysCollected = 0;
  over = false;
  timeLeft = TIME_LIMIT;

  mazeEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  mazeEl.style.gridTemplateRows = `repeat(${SIZE}, minmax(0, 1fr))`;

  generateMaze();
  placeKeys();

  keysStatusEl.hidden = KEYS_NEEDED === 0;
  keysStatusEl.textContent = `🔑 Clés : 0/${KEYS_NEEDED}`;

  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  timerEl.textContent = `${min}:${sec}`;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  render();
  startTimer();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("btnUp").onclick = () => move("up");
document.getElementById("btnDown").onclick = () => move("down");
document.getElementById("btnLeft").onclick = () => move("left");
document.getElementById("btnRight").onclick = () => move("right");

document.getElementById("replayBtn").onclick = () => location.reload();
