import { saveScore } from "../api.js";

const SIZE = 5;
const EMPTY = 0, PLAYER = 1, BOT = 2;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let board;
let over = false;
let currentPlayer = PLAYER;

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function neighbors(r, c) {
  return [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c]]
    .filter(([nr, nc]) => nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE);
}

function checkConnected(player) {
  const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const queue = [];

  if (player === PLAYER) {
    for (let c = 0; c < SIZE; c++) {
      if (board[0][c] === player) {
        queue.push([0, c]);
        visited[0][c] = true;
      }
    }
  } else {
    for (let r = 0; r < SIZE; r++) {
      if (board[r][0] === player) {
        queue.push([r, 0]);
        visited[r][0] = true;
      }
    }
  }

  while (queue.length) {
    const [r, c] = queue.shift();
    if (player === PLAYER && r === SIZE - 1) return true;
    if (player === BOT && c === SIZE - 1) return true;
    for (const [nr, nc] of neighbors(r, c)) {
      if (!visited[nr][nc] && board[nr][nc] === player) {
        visited[nr][nc] = true;
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < SIZE; r++) {
    const rowEl = document.createElement("div");
    rowEl.className = "hexa-row";
    rowEl.style.marginLeft = `${r * 20}px`;
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "hexa-cell";
      if (board[r][c] === PLAYER) cell.classList.add("player");
      if (board[r][c] === BOT) cell.classList.add("bot");
      if (board[r][c] === EMPTY && !over) {
        cell.onclick = () => playerMove(r, c);
      }
      rowEl.appendChild(cell);
    }
    boardEl.appendChild(rowEl);
  }
}

function findWinningCell(player) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;
      board[r][c] = player;
      const win = checkConnected(player);
      board[r][c] = EMPTY;
      if (win) return [r, c];
    }
  }
  return null;
}

function botMove() {
  let cell = findWinningCell(BOT);
  if (!cell) cell = findWinningCell(PLAYER);
  if (!cell) {
    const empties = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (board[r][c] === EMPTY) empties.push([r, c]);
      }
    }
    const adjacentToSelf = empties.filter(([r, c]) => neighbors(r, c).some(([nr, nc]) => board[nr][nc] === BOT));
    const pool = adjacentToSelf.length ? adjacentToSelf : empties;
    cell = pool[Math.floor(Math.random() * pool.length)];
  }

  const [r, c] = cell;
  board[r][c] = BOT;
  render();

  if (checkConnected(BOT)) {
    endGame("lose");
    return;
  }

  currentPlayer = PLAYER;
  statusEl.textContent = "À toi de jouer";
}

function playerMove(r, c) {
  if (over || currentPlayer !== PLAYER || board[r][c] !== EMPTY) return;

  board[r][c] = PLAYER;
  render();

  if (checkConnected(PLAYER)) {
    endGame("win");
    return;
  }

  currentPlayer = BOT;
  statusEl.textContent = "Le bot réfléchit...";
  setTimeout(botMove, 500);
}

async function endGame(result) {
  over = true;
  render();
  statusEl.textContent = "";
  document.getElementById("resultTitle").textContent =
    result === "win" ? "🎉 Tu as relié le haut et le bas !" : "😕 Le bot a relié la gauche et la droite !";
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "hexa-path", result === "win" ? 20 : 0);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__hexaPathDebug = { playerMove, botMove, getBoard: () => board, getState: () => ({ currentPlayer, over }) };

initBoard();
render();
