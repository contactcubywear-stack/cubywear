import { saveScore } from "../api.js";

const SIZE = 4;
const EMPTY = 0, BLACK = 1, WHITE = 2;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

const boardEl = document.getElementById("board");
const hudEl = document.getElementById("hud");
const statusEl = document.getElementById("status");

let board;
let currentPlayer = BLACK;
let over = false;

function opponent(p) {
  return p === BLACK ? WHITE : BLACK;
}

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  board[1][1] = WHITE;
  board[1][2] = BLACK;
  board[2][1] = BLACK;
  board[2][2] = WHITE;
}

function getFlips(r, c, player) {
  if (board[r][c] !== EMPTY) return [];
  const allFlips = [];
  for (const [dr, dc] of DIRS) {
    const lineFlips = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === opponent(player)) {
      lineFlips.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (lineFlips.length > 0 && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc] === player) {
      allFlips.push(...lineFlips);
    }
  }
  return allFlips;
}

function validMoves(player) {
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const flips = getFlips(r, c, player);
      if (flips.length > 0) moves.push({ r, c, flips });
    }
  }
  return moves;
}

function applyMove(move, player) {
  board[move.r][move.c] = player;
  move.flips.forEach(([r, c]) => (board[r][c] = player));
}

function countPieces() {
  let black = 0, white = 0;
  board.forEach(row => row.forEach(v => {
    if (v === BLACK) black++;
    if (v === WHITE) white++;
  }));
  return { black, white };
}

function updateHud() {
  const { black, white } = countPieces();
  hudEl.textContent = `⚫ Toi : ${black} · ⚪ Bot : ${white}`;
}

function render() {
  boardEl.innerHTML = "";
  const moves = currentPlayer === BLACK && !over ? validMoves(BLACK) : [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "othello-cell";

      if (board[r][c] !== EMPTY) {
        const piece = document.createElement("div");
        piece.className = "piece " + (board[r][c] === BLACK ? "black" : "white");
        cell.appendChild(piece);
      } else if (moves.some(m => m.r === r && m.c === c)) {
        cell.classList.add("valid");
        cell.onclick = () => playerMove(r, c);
      }

      boardEl.appendChild(cell);
    }
  }
  updateHud();
}

function playerMove(r, c) {
  if (over || currentPlayer !== BLACK) return;
  const move = validMoves(BLACK).find(m => m.r === r && m.c === c);
  if (!move) return;
  applyMove(move, BLACK);
  afterMove();
}

function botMove() {
  const moves = validMoves(WHITE);
  if (moves.length === 0) {
    afterMove();
    return;
  }
  let best = moves[0];
  moves.forEach(m => {
    if (m.flips.length > best.flips.length) best = m;
  });
  applyMove(best, WHITE);
  afterMove();
}

function afterMove() {
  render();
  currentPlayer = opponent(currentPlayer);
  checkTurn();
}

function checkTurn() {
  if (over) return;

  let moves = validMoves(currentPlayer);
  if (moves.length === 0) {
    currentPlayer = opponent(currentPlayer);
    moves = validMoves(currentPlayer);
    if (moves.length === 0) {
      endGame();
      return;
    }
  }

  if (currentPlayer === WHITE) {
    statusEl.textContent = "Le bot réfléchit...";
    setTimeout(botMove, 500);
  } else {
    statusEl.textContent = "À toi de jouer";
    render();
  }
}

async function endGame() {
  over = true;
  const { black, white } = countPieces();
  const title = black > white ? "🎉 Tu as gagné !" : black < white ? "😕 Tu as perdu !" : "🤝 Match nul !";
  document.getElementById("resultTitle").textContent = title;
  document.getElementById("statPlayer").textContent = black;
  document.getElementById("statBot").textContent = white;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-othello", black > white ? 20 : black === white ? 10 : 0);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__othelloDebug = { playerMove, botMove, getState: () => ({ currentPlayer, over, ...countPieces() }), getBoard: () => board };

initBoard();
render();
checkTurn();
