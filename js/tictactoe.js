import { saveScore } from "../api.js";

const grid = document.getElementById("grid");
let board = ["", "", "", "", "", "", "", "", ""];
let player = "X";
let bot = "O";

function render() {
  grid.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    div.innerText = cell;
    div.onclick = () => play(i);
    grid.appendChild(div);
  });
}

function play(i) {
  if (board[i] !== "") return;
  board[i] = player;

  if (checkWin(player)) return endGame("win");
  if (isDraw()) return endGame("draw");

  botPlay();

  if (checkWin(bot)) return endGame("lose");
  if (isDraw()) return endGame("draw");

  render();
}

function botPlay() {
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  const move = empty[Math.floor(Math.random() * empty.length)];
  board[move] = bot;
}

function checkWin(p) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(w => w.every(i => board[i] === p));
}

function isDraw() {
  return board.every(cell => cell !== "");
}

async function endGame(result) {
  render();
  const messages = { win: "Tu as gagné !", lose: "Tu as perdu !", draw: "Match nul !" };
  const scores = { win: 10, lose: 0, draw: 5 };
  alert(messages[result]);
  await saveScore("CW-BLK-1-0001", "tictactoe", scores[result]);
  window.location.href = "../index.html";
}

render();
