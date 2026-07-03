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
  if (checkWin(player)) return endGame(true);

  botPlay();
  if (checkWin(bot)) return endGame(false);

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

async function endGame(win) {
  alert(win ? "Tu as gagné !" : "Tu as perdu !");
  await saveScore("CW-BLK-1-0001", "tictactoe", win ? 10 : 0);
  window.location.href = "../index.html";
}

render();
