import { saveScore } from "../api.js";

const COLS = 6;
const ROWS = 5;
const EMPTY = 0, PLAYER = 1, BOT = 2;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let board;
let over = false;

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function lowestEmptyRow(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === EMPTY) return r;
  }
  return -1;
}

function checkWin(player) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] !== player) continue;
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== player) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

function isFull() {
  return board[0].every(cell => cell !== EMPTY);
}

function render() {
  boardEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "c4-cell";
      if (board[r][c] === EMPTY && !over) {
        cell.classList.add("col-hover");
        cell.onclick = () => playerMove(c);
      }
      if (board[r][c] !== EMPTY) {
        const piece = document.createElement("div");
        piece.className = "c4-piece " + (board[r][c] === PLAYER ? "player" : "bot");
        cell.appendChild(piece);
      }
      boardEl.appendChild(cell);
    }
  }
}

function findWinningCol(player) {
  for (let c = 0; c < COLS; c++) {
    const r = lowestEmptyRow(c);
    if (r === -1) continue;
    board[r][c] = player;
    const win = checkWin(player);
    board[r][c] = EMPTY;
    if (win) return c;
  }
  return null;
}

function botMove() {
  let col = findWinningCol(BOT);
  if (col === null) col = findWinningCol(PLAYER);
  if (col === null) {
    const prefs = [2, 3, 1, 4, 0, 5];
    col = prefs.find(c => lowestEmptyRow(c) !== -1);
  }
  if (col === undefined || col === null) return;

  const r = lowestEmptyRow(col);
  board[r][col] = BOT;
  render();

  if (checkWin(BOT)) return endGame("lose");
  if (isFull()) return endGame("draw");

  statusEl.textContent = "À toi de jouer";
}

function playerMove(col) {
  if (over) return;
  const r = lowestEmptyRow(col);
  if (r === -1) return;

  board[r][col] = PLAYER;
  render();

  if (checkWin(PLAYER)) return endGame("win");
  if (isFull()) return endGame("draw");

  statusEl.textContent = "Le bot réfléchit...";
  setTimeout(botMove, 500);
}

async function endGame(result) {
  over = true;
  render();
  const titles = { win: "🎉 Tu as gagné !", lose: "😕 Tu as perdu !", draw: "🤝 Match nul !" };
  const scores = { win: 20, lose: 0, draw: 10 };
  statusEl.textContent = "";
  document.getElementById("resultTitle").textContent = titles[result];
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "connect4-lite", scores[result]);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__connect4Debug = { playerMove, botMove, getBoard: () => board, getState: () => ({ over }) };

initBoard();
render();
