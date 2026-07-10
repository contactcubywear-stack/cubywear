import { saveScore } from "../api.js";

const DIFFICULTY_SETTINGS = {
  facile:     { size: 5,  time: 45, keys: 0, badge: false },
  moyen:      { size: 8,  time: 30, keys: 0, badge: false },
  difficile:  { size: 12, time: 60, keys: 5, badge: false },
  impossible: { size: 16, time: 60, keys: 5, badge: true }
};

const DELTA = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
const OPPOSITE = { N: "S", S: "N", E: "W", W: "E" };
const DIR_LETTER = { up: "N", down: "S", left: "W", right: "E" };

const mazeEl = document.getElementById("maze");
const timerEl = document.getElementById("timer");
const keysStatusEl = document.getElementById("keysStatus");
const badgeStatusEl = document.getElementById("badgeStatus");

let difficulty;
let SIZE, TIME_LIMIT, KEYS_NEEDED, BADGE_REQUIRED;
let cells;
let playerR, playerC;
let goalR, goalC;
let keyPositions = [];
let keysCollected = 0;
let badgePosition = null;
let badgeCollected = false;
let gate = null;
let over = false;
let timeLeft;
let timerInterval;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateMaze() {
  cells = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => ({ N: true, S: true, E: true, W: true, visited: false }))
  );

  const stack = [[0, 0]];
  cells[0][0].visited = true;

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
    cells[nr][nc][OPPOSITE[dir]] = false;
    cells[nr][nc].visited = true;
    stack.push([nr, nc]);
  }
}

function countOpenConnections(cell) {
  return ["N", "S", "E", "W"].filter(d => !cell[d]).length;
}

function allCandidates(exclude) {
  const list = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (exclude.some(([er, ec]) => er === r && ec === c)) continue;
      list.push([r, c]);
    }
  }
  return list;
}

function getDeadEnds(exclude) {
  return allCandidates(exclude).filter(([r, c]) => countOpenConnections(cells[r][c]) === 1);
}

function placeKeys() {
  const exclude = [[0, 0], [goalR, goalC]];

  // En difficile/impossible, on privilégie les culs-de-sac pour forcer
  // des détours plutôt que de laisser les clés sur le chemin direct.
  let candidates;
  if (difficulty === "difficile" || difficulty === "impossible") {
    const deadEnds = shuffle(getDeadEnds(exclude));
    const others = shuffle(allCandidates(exclude).filter(
      ([r, c]) => !deadEnds.some(([dr, dc]) => dr === r && dc === c)
    ));
    candidates = [...deadEnds, ...others];
  } else {
    candidates = shuffle(allCandidates(exclude));
  }

  keyPositions = candidates.slice(0, KEYS_NEEDED);
}

function placeBadgeAndGate() {
  if (!BADGE_REQUIRED) {
    badgePosition = null;
    gate = null;
    return;
  }

  const exclude = [[0, 0], [goalR, goalC], ...keyPositions];
  const candidates = shuffle(allCandidates(exclude));
  badgePosition = candidates[0];

  // Verrouille une des sorties de la case d'arrivée : tant que le
  // badge n'est pas ramassé, cette portion du labyrinthe reste bloquée.
  const goalCell = cells[goalR][goalC];
  const openDirs = ["N", "S", "E", "W"].filter(d => !goalCell[d]);
  const dir = openDirs[Math.floor(Math.random() * openDirs.length)];
  gate = { r: goalR, c: goalC, dir };
}

function isGateBlocking(r, c, dirLetter) {
  if (!gate || badgeCollected) return false;
  if (r === gate.r && c === gate.c && dirLetter === gate.dir) return true;

  const [dr, dc] = DELTA[gate.dir];
  const neighborR = gate.r + dr;
  const neighborC = gate.c + dc;
  if (r === neighborR && c === neighborC && dirLetter === OPPOSITE[gate.dir]) return true;

  return false;
}

function render() {
  mazeEl.innerHTML = "";
  cells.forEach((row, r) => {
    row.forEach((cell, c) => {
      const div = document.createElement("div");
      div.className = "maze-cell";
      if (cell.N || isGateBlocking(r, c, "N")) div.classList.add("wall-N");
      if (cell.S || isGateBlocking(r, c, "S")) div.classList.add("wall-S");
      if (cell.E || isGateBlocking(r, c, "E")) div.classList.add("wall-E");
      if (cell.W || isGateBlocking(r, c, "W")) div.classList.add("wall-W");

      if (r === playerR && c === playerC) {
        div.classList.add("player");
      } else if (r === goalR && c === goalC) {
        div.classList.add("goal");
        div.textContent = "🏁";
      } else if (badgePosition && badgePosition[0] === r && badgePosition[1] === c) {
        div.classList.add("badge");
        div.textContent = "🏅";
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
  const dirLetter = DIR_LETTER[dir];
  const cell = cells[playerR][playerC];

  if (cell[dirLetter] || isGateBlocking(playerR, playerC, dirLetter)) return;

  if (dir === "up") playerR--;
  if (dir === "down") playerR++;
  if (dir === "left") playerC--;
  if (dir === "right") playerC++;

  const keyIndex = keyPositions.findIndex(([r, c]) => r === playerR && c === playerC);
  if (keyIndex !== -1) {
    keyPositions.splice(keyIndex, 1);
    keysCollected++;
    keysStatusEl.textContent = `🔑 Clés : ${keysCollected}/${KEYS_NEEDED}`;
  }

  if (badgePosition && badgePosition[0] === playerR && badgePosition[1] === playerC) {
    badgeCollected = true;
    badgePosition = null;
    badgeStatusEl.textContent = "🏅 Badge trouvé, passage débloqué !";
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

function startGame(level) {
  difficulty = level;
  const settings = DIFFICULTY_SETTINGS[difficulty];
  SIZE = settings.size;
  TIME_LIMIT = settings.time;
  KEYS_NEEDED = settings.keys;
  BADGE_REQUIRED = settings.badge;

  playerR = 0;
  playerC = 0;
  goalR = SIZE - 1;
  goalC = SIZE - 1;
  keysCollected = 0;
  badgeCollected = false;
  over = false;
  timeLeft = TIME_LIMIT;

  mazeEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  mazeEl.style.gridTemplateRows = `repeat(${SIZE}, minmax(0, 1fr))`;

  generateMaze();
  placeKeys();
  placeBadgeAndGate();

  keysStatusEl.hidden = KEYS_NEEDED === 0;
  keysStatusEl.textContent = `🔑 Clés : 0/${KEYS_NEEDED}`;

  badgeStatusEl.hidden = !BADGE_REQUIRED;
  badgeStatusEl.textContent = "🏅 Badge non trouvé";

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
