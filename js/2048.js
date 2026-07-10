import { saveScore } from "../api.js";

const SIZE = 4;
const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");

let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
let score = 0;
let won = false;
let over = false;

function addRandomTile() {
  const empty = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push([r, c]); }));
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function render() {
  boardEl.innerHTML = "";
  board.forEach(row => {
    row.forEach(value => {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (value !== 0) {
        tile.dataset.value = value;
        tile.textContent = value;
      }
      boardEl.appendChild(tile);
    });
  });
  scoreEl.textContent = `Score : ${score}`;
}

function transpose(b) {
  return b[0].map((_, c) => b.map(row => row[c]));
}

function reverseRows(b) {
  return b.map(row => [...row].reverse());
}

function moveRowLeft(row) {
  const filtered = row.filter(v => v !== 0);
  const merged = [];
  let gain = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i] === filtered[i + 1]) {
      merged.push(filtered[i] * 2);
      gain += filtered[i] * 2;
      i++;
    } else {
      merged.push(filtered[i]);
    }
  }

  while (merged.length < SIZE) merged.push(0);
  return { row: merged, gain };
}

function isGameOver() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return false;
      if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
      if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
    }
  }
  return true;
}

async function endGame() {
  over = true;
  alert(`Plus aucun mouvement possible ! Score final : ${score}`);
  await saveScore("CW-BLK-1-0001", "2048", score);
  window.location.href = "../index.html";
}

function move(direction) {
  if (over) return;

  let working = board.map(row => [...row]);
  if (direction === "up") working = transpose(working);
  if (direction === "down") working = reverseRows(transpose(working));
  if (direction === "right") working = reverseRows(working);

  let gainTotal = 0;
  working = working.map(row => {
    const { row: newRow, gain } = moveRowLeft(row);
    gainTotal += gain;
    return newRow;
  });

  if (direction === "right") working = reverseRows(working);
  if (direction === "up") working = transpose(working);
  if (direction === "down") working = transpose(reverseRows(working));

  if (JSON.stringify(working) === JSON.stringify(board)) return;

  board = working;
  score += gainTotal;
  addRandomTile();
  render();

  if (!won && board.some(row => row.includes(2048))) {
    won = true;
    alert("2048 atteint, bravo ! Continue pour un meilleur score.");
  }

  if (isGameOver()) endGame();
}

document.getElementById("btnUp").onclick = () => move("up");
document.getElementById("btnDown").onclick = () => move("down");
document.getElementById("btnLeft").onclick = () => move("left");
document.getElementById("btnRight").onclick = () => move("right");

addRandomTile();
addRandomTile();
render();
