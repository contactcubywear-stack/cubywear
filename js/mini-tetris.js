import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    next: "Prochain", hardDrop: "Chute rapide",
    lost: "💥 Perdu !", finalScore: "Score final", best: "Meilleur score"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    next: "Next", hardDrop: "Hard drop",
    lost: "💥 Lost!", finalScore: "Final score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const STANDARD_PIECES = {
  O: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  I: [
    [[0, 0], [1, 0], [2, 0], [3, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3]]
  ],
  L: [
    [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [0, 1]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[2, 0], [0, 1], [1, 1], [2, 1]]
  ],
  T: [
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[1, 0], [0, 1], [1, 1], [1, 2]],
    [[1, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [1, 1], [0, 2]]
  ]
};

const WEIRD_PIECES = {
  ...STANDARD_PIECES,
  S: [
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[0, 0], [0, 1], [1, 1], [1, 2]]
  ],
  PLUS: [
    [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]]
  ]
};

const COLORS = {
  O: "#F5D30F", I: "#5AC8FA", L: "#F2811D", T: "#9B59B6",
  S: "#2ecc71", PLUS: "#e74c3c"
};

const LINE_SCORES = [0, 100, 300, 500, 800];

const DIFFICULTY_SETTINGS = {
  facile:    { cols: 8,  rows: 14, pieces: STANDARD_PIECES },
  moyen:     { cols: 10, rows: 18, pieces: STANDARD_PIECES },
  difficile: { cols: 10, rows: 18, pieces: WEIRD_PIECES }
};

const boardEl = document.getElementById("board");
const nextPreviewEl = document.getElementById("nextPreview");

let COLS, ROWS, PIECES;
let cells = [];
let board, current, nextType, score, best, over, clearing, tickHandle;

function buildGrid() {
  boardEl.innerHTML = "";
  boardEl.style.aspectRatio = `${COLS} / ${ROWS}`;
  boardEl.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${ROWS}, minmax(0, 1fr))`;
  cells = [];
  for (let i = 0; i < COLS * ROWS; i++) {
    const div = document.createElement("div");
    div.className = "cell";
    boardEl.appendChild(div);
    cells.push(div);
  }
}

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function shapeCells(piece) {
  return PIECES[piece.type][piece.rot].map(([dx, dy]) => ({ x: piece.x + dx, y: piece.y + dy }));
}

function collides(piece, offsetX, offsetY, rot) {
  const test = { type: piece.type, x: piece.x + offsetX, y: piece.y + offsetY, rot: rot === undefined ? piece.rot : rot };
  return shapeCells(test).some(c => c.x < 0 || c.x >= COLS || c.y >= ROWS || (c.y >= 0 && board[c.y][c.x]));
}

function render() {
  cells.forEach(c => {
    c.className = "cell";
    c.style.background = "";
  });

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        const el = cells[y * COLS + x];
        el.classList.add("filled");
        el.style.background = board[y][x];
      }
    }
  }

  shapeCells(current).forEach(c => {
    if (c.y >= 0 && c.y < ROWS && c.x >= 0 && c.x < COLS) {
      const el = cells[c.y * COLS + c.x];
      el.classList.add("filled");
      el.style.background = COLORS[current.type];
    }
  });
}

function renderNextPreview() {
  nextPreviewEl.innerHTML = "";
  const shape = PIECES[nextType][0];
  const grid = Array.from({ length: 16 }, () => false);
  shape.forEach(([dx, dy]) => {
    if (dx < 4 && dy < 4) grid[dy * 4 + dx] = true;
  });
  grid.forEach(filled => {
    const cell = document.createElement("div");
    cell.className = "mini-cell";
    if (filled) cell.style.background = COLORS[nextType];
    nextPreviewEl.appendChild(cell);
  });
}

function randomType() {
  const types = Object.keys(PIECES);
  return types[Math.floor(Math.random() * types.length)];
}

function clearLines() {
  const fullRows = [];
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(cell => cell)) fullRows.push(y);
  }

  if (fullRows.length === 0) {
    spawnPiece();
    return;
  }

  clearing = true;
  fullRows.forEach(y => {
    for (let x = 0; x < COLS; x++) cells[y * COLS + x].classList.add("clearing");
  });
  if (window.CubySfx) CubySfx.match();

  setTimeout(() => {
    fullRows.forEach(y => {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
    });
    score += LINE_SCORES[fullRows.length] || fullRows.length * 200;
    document.getElementById("scoreVal").textContent = score;
    clearing = false;
    scheduleTick();
    spawnPiece();
  }, 260);
}

function spawnPiece() {
  const type = nextType || randomType();
  nextType = randomType();
  renderNextPreview();

  current = { type, rot: 0, x: Math.floor(COLS / 2) - 1, y: 0 };
  if (collides(current, 0, 0)) {
    endGame();
    return;
  }
  render();
}

function lockPiece() {
  shapeCells(current).forEach(c => {
    if (c.y >= 0) board[c.y][c.x] = COLORS[current.type];
  });
  if (window.CubySfx) CubySfx.place();
  render();
  clearLines();
}

function tick() {
  if (over || clearing) return;
  if (!collides(current, 0, 1)) {
    current.y++;
  } else {
    lockPiece();
    return;
  }
  render();
}

function speedForScore() {
  return Math.max(700 - score * 3, 200);
}

function scheduleTick() {
  clearInterval(tickHandle);
  tickHandle = setInterval(tick, speedForScore());
}

function move(dx) {
  if (over || clearing) return;
  if (!collides(current, dx, 0)) {
    current.x += dx;
    render();
    if (window.CubySfx) CubySfx.tap();
  }
}

function rotate() {
  if (over || clearing) return;
  const states = PIECES[current.type].length;
  const newRot = (current.rot + 1) % states;
  if (!collides(current, 0, 0, newRot)) {
    current.rot = newRot;
    render();
    if (window.CubySfx) CubySfx.tap();
  }
}

function softDrop() {
  if (over || clearing) return;
  if (!collides(current, 0, 1)) {
    current.y++;
    render();
  } else {
    lockPiece();
  }
}

function hardDrop() {
  if (over || clearing) return;
  let dist = 0;
  while (!collides(current, 0, dist + 1)) dist++;
  current.y += dist;
  score += dist;
  document.getElementById("scoreVal").textContent = score;
  render();
  if (window.CubySfx) CubySfx.tap();
  lockPiece();
}

async function endGame() {
  over = true;
  clearInterval(tickHandle);
  if (window.CubySfx) CubySfx.lose();

  best = Math.max(score, best);
  localStorage.setItem("bestMiniTetris", best);

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-tetris", score);
}

function startGame(level) {
  const settings = DIFFICULTY_SETTINGS[level];
  COLS = settings.cols;
  ROWS = settings.rows;
  PIECES = settings.pieces;

  buildGrid();
  board = emptyBoard();
  score = 0;
  best = Number(localStorage.getItem("bestMiniTetris") || 0);
  over = false;
  clearing = false;
  nextType = randomType();
  document.getElementById("scoreVal").textContent = 0;
  document.getElementById("bestVal").textContent = best;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  spawnPiece();
  scheduleTick();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("btnLeft").onclick = () => move(-1);
document.getElementById("btnRight").onclick = () => move(1);
document.getElementById("btnRotate").onclick = () => rotate();
document.getElementById("btnDown").onclick = () => softDrop();
document.getElementById("btnDrop").onclick = () => hardDrop();

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
  if (e.key === "ArrowUp") { e.preventDefault(); rotate(); }
  if (e.key === "ArrowDown") { e.preventDefault(); softDrop(); }
  if (e.code === "Space") { e.preventDefault(); hardDrop(); }
});

document.getElementById("replayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__tetrisDebug = { tick, move, rotate, softDrop, hardDrop, getBoard: () => board, getCurrent: () => current, getState: () => ({ score, over, COLS, ROWS, clearing }) };

applyLang();
