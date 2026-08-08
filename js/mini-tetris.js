import { saveScore } from "../api.js";

const COLS = 8;
const ROWS = 14;

const PIECES = {
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

const COLORS = { O: "#F5D30F", I: "#5AC8FA", L: "#F2811D", T: "#9B59B6" };

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");

const cells = [];
for (let i = 0; i < COLS * ROWS; i++) {
  const div = document.createElement("div");
  div.className = "cell";
  boardEl.appendChild(div);
  cells.push(div);
}

let board, current, score, over, tickHandle;

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

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared++;
      y++;
    }
  }
  if (cleared > 0) {
    score += cleared * 100;
    scoreEl.textContent = `Score : ${score}`;
    scheduleTick();
  }
}

function spawnPiece() {
  const types = Object.keys(PIECES);
  const type = types[Math.floor(Math.random() * types.length)];
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
  clearLines();
  spawnPiece();
}

function tick() {
  if (over) return;
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
  if (over) return;
  if (!collides(current, dx, 0)) {
    current.x += dx;
    render();
  }
}

function rotate() {
  if (over) return;
  const states = PIECES[current.type].length;
  const newRot = (current.rot + 1) % states;
  if (!collides(current, 0, 0, newRot)) {
    current.rot = newRot;
    render();
  }
}

function softDrop() {
  if (over) return;
  if (!collides(current, 0, 1)) {
    current.y++;
    render();
  } else {
    lockPiece();
  }
}

async function endGame() {
  over = true;
  clearInterval(tickHandle);
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-tetris", score);
}

function startGame() {
  board = emptyBoard();
  score = 0;
  over = false;
  scoreEl.textContent = "Score : 0";
  spawnPiece();
  scheduleTick();
}

document.getElementById("btnLeft").onclick = () => move(-1);
document.getElementById("btnRight").onclick = () => move(1);
document.getElementById("btnRotate").onclick = () => rotate();
document.getElementById("btnDown").onclick = () => softDrop();

window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
  if (e.key === "ArrowUp") { e.preventDefault(); rotate(); }
  if (e.key === "ArrowDown") { e.preventDefault(); softDrop(); }
});

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__tetrisDebug = { tick, move, rotate, softDrop, getBoard: () => board, getCurrent: () => current, getState: () => ({ score, over }) };

startGame();
