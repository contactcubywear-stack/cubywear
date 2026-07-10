import { saveScore } from "../api.js";

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
let board = ["", "", "", "", "", "", "", "", ""];
let player = "X";
let bot = "O";
let winningLine = [];
let difficulty = "moyen";

function render() {
  grid.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    if (cell === "X") div.classList.add("filled", "x");
    if (cell === "O") div.classList.add("filled", "o");
    if (winningLine.includes(i)) div.classList.add("win");
    div.textContent = cell;
    div.onclick = () => play(i);
    grid.appendChild(div);
  });
}

function play(i) {
  if (board[i] !== "") return;
  board[i] = player;

  if (checkWin(player)) return endGame("win");
  if (isDraw()) return endGame("draw");

  statusEl.textContent = "Le bot réfléchit...";
  botPlay();

  if (checkWin(bot)) return endGame("lose");
  if (isDraw()) return endGame("draw");

  statusEl.textContent = "À toi de jouer (X)";
  render();
}

function findWinningMove(mark) {
  for (const line of WINS) {
    const marks = line.filter(i => board[i] === mark);
    const empties = line.filter(i => board[i] === "");
    if (marks.length === 2 && empties.length === 1) return empties[0];
  }
  return null;
}

function randomEmpty() {
  const empty = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function botPlay() {
  let move;

  if (difficulty === "difficile") {
    // Gagne si possible, bloque sinon, avec une petite part d'aléatoire
    // pour rester battable ("souvent égalité, possible à battre").
    move = findWinningMove(bot);
    if (move === null) move = findWinningMove(player);
    if (move === null && Math.random() > 0.15) {
      const preferences = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      move = preferences.find(i => board[i] === "");
    }
    if (move === null || move === undefined) move = randomEmpty();
  } else {
    // Facile et Moyen : bot totalement aléatoire, facile à battre.
    move = randomEmpty();
  }

  board[move] = bot;
}

function checkWin(p) {
  const line = WINS.find(w => w.every(i => board[i] === p));
  if (line) winningLine = line;
  return Boolean(line);
}

function isDraw() {
  return board.every(cell => cell !== "");
}

async function endGame(result) {
  render();
  const titles = { win: "🎉 Tu as gagné !", lose: "😕 Tu as perdu !", draw: "🤝 Match nul !" };
  const scores = { win: 10, lose: 0, draw: 5 };

  document.getElementById("resultTitle").textContent = titles[result];
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "tictactoe", scores[result]);
}

function startGame(level) {
  difficulty = level;
  board = ["", "", "", "", "", "", "", "", ""];
  winningLine = [];

  if (difficulty === "facile") {
    // Le joueur commence avec une croix bonus déjà sur le plateau.
    board[randomEmpty()] = player;
  }

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  statusEl.textContent = "À toi de jouer (X)";
  render();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();
