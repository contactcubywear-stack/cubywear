import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseMode: "Choisis un mode", vsBot: "Contre le bot", vs2p: "2 joueurs",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile",
    back: "Retour", mainMenu: "Menu principal", home: "Accueil", changeMode: "Changer mode",
    replay: "Rejouer",
    turnX: "À toi de jouer (X)", turnO: "Au tour de O",
    botThinking: "Le bot réfléchit...",
    xWins: "🎉 X a gagné !", oWins: "🎉 O a gagné !",
    youWin: "🎉 Tu as gagné !", youLose: "😕 Tu as perdu !", draw: "🤝 Match nul !",
    player: "Toi", bot: "Bot", draws: "Nuls"
  },
  en: {
    chooseMode: "Choose a mode", vsBot: "Vs bot", vs2p: "2 players",
    chooseDifficulty: "Choose difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard",
    back: "Back", mainMenu: "Main menu", home: "Home", changeMode: "Change mode",
    replay: "Replay",
    turnX: "Your turn (X)", turnO: "O's turn",
    botThinking: "Bot is thinking...",
    xWins: "🎉 X wins!", oWins: "🎉 O wins!",
    youWin: "🎉 You won!", youLose: "😕 You lost!", draw: "🤝 Draw!",
    player: "You", bot: "Bot", draws: "Draws"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const winLineEl = document.getElementById("winLine");

let board = ["", "", "", "", "", "", "", "", ""];
let current = "X";
let winningLine = [];
let mode = "bot"; // "bot" | "2p"
let difficulty = "moyen";
let gameOver = false;

const score = { p1: 0, p2: 0, draw: 0 }; // p1 = X / player, p2 = O / bot

function cellCenter(i) {
  const row = Math.floor(i / 3), col = i % 3;
  return { x: 16.67 + col * 33.33, y: 16.67 + row * 33.33 };
}

function render() {
  grid.innerHTML = "";
  board.forEach((cell, i) => {
    const div = document.createElement("div");
    div.className = "cell";
    if (cell === "X") div.classList.add("filled", "x");
    if (cell === "O") div.classList.add("filled", "o");
    if (winningLine.includes(i)) div.classList.add("win");
    div.textContent = cell;
    div.onclick = () => playerClick(i);
    grid.appendChild(div);
  });
}

function renderScoreboard() {
  const sb = document.getElementById("scoreboard");
  const p1Label = mode === "bot" ? T[lang].player : "X";
  const p2Label = mode === "bot" ? T[lang].bot : "O";
  sb.innerHTML = `
    <div class="score-chip">${p1Label}<span class="val">${score.p1}</span></div>
    <div class="score-chip">${T[lang].draws}<span class="val">${score.draw}</span></div>
    <div class="score-chip">${p2Label}<span class="val">${score.p2}</span></div>
  `;
}

function updateStatus() {
  if (mode === "2p") {
    statusEl.textContent = current === "X" ? T[lang].turnX : T[lang].turnO;
  } else {
    statusEl.textContent = current === "X" ? T[lang].turnX : T[lang].botThinking;
  }
}

function checkWin(bd, mark) {
  const line = WINS.find(w => w.every(i => bd[i] === mark));
  return line || null;
}

function isDraw(bd) {
  return bd.every(cell => cell !== "");
}

function randomEmpty(bd) {
  const empty = bd.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  return empty[Math.floor(Math.random() * empty.length)];
}

function findWinningMove(bd, mark) {
  for (const line of WINS) {
    const marks = line.filter(i => bd[i] === mark);
    const empties = line.filter(i => bd[i] === "");
    if (marks.length === 2 && empties.length === 1) return empties[0];
  }
  return null;
}

// --- Minimax (imbattable en "Difficile") ---
function minimax(bd, depth, isMaximizing) {
  const winO = checkWin(bd, "O");
  const winX = checkWin(bd, "X");
  if (winO) return 10 - depth;
  if (winX) return depth - 10;
  if (isDraw(bd)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (bd[i] !== "") continue;
      bd[i] = "O";
      best = Math.max(best, minimax(bd, depth + 1, false));
      bd[i] = "";
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (bd[i] !== "") continue;
      bd[i] = "X";
      best = Math.min(best, minimax(bd, depth + 1, true));
      bd[i] = "";
    }
    return best;
  }
}

function bestMove(bd) {
  let bestVal = -Infinity, move = null;
  for (let i = 0; i < 9; i++) {
    if (bd[i] !== "") continue;
    bd[i] = "O";
    const val = minimax(bd, 0, false);
    bd[i] = "";
    if (val > bestVal) { bestVal = val; move = i; }
  }
  return move;
}

function botMove() {
  let move;
  if (difficulty === "difficile") {
    move = bestMove(board);
  } else if (difficulty === "moyen") {
    move = findWinningMove(board, "O");
    if (move === null) move = findWinningMove(board, "X");
    if (move === null && Math.random() > 0.2) {
      const preferences = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      move = preferences.find(i => board[i] === "");
    }
    if (move === null || move === undefined) move = randomEmpty(board);
  } else {
    move = randomEmpty(board);
  }
  return move;
}

function playerClick(i) {
  if (gameOver || board[i] !== "") return;
  if (mode === "bot" && current !== "X") return;

  placeMark(i, current);
}

function placeMark(i, mark) {
  board[i] = mark;
  if (window.CubySfx) CubySfx.place();
  render();

  const winLine = checkWin(board, mark);
  if (winLine) {
    endGame(mark, winLine);
    return;
  }
  if (isDraw(board)) {
    endGame("draw", null);
    return;
  }

  current = current === "X" ? "O" : "X";

  if (mode === "bot" && current === "O") {
    updateStatus();
    setTimeout(() => {
      if (gameOver) return;
      const move = botMove();
      placeMark(move, "O");
    }, 450);
  } else {
    updateStatus();
  }
}

async function endGame(result, winLine) {
  gameOver = true;
  winningLine = winLine || [];
  statusEl.textContent = "";
  render();

  if (winLine) {
    const { x: x1, y: y1 } = cellCenter(winLine[0]);
    const { x: x2, y: y2 } = cellCenter(winLine[2]);
    winLineEl.setAttribute("x1", x1);
    winLineEl.setAttribute("y1", y1);
    winLineEl.setAttribute("x2", x2);
    winLineEl.setAttribute("y2", y2);
    winLineEl.classList.add("show");
  }

  let title, apiScore;
  if (result === "draw") {
    score.draw++;
    title = T[lang].draw;
    apiScore = 5;
    if (window.CubySfx) CubySfx.draw();
  } else if (mode === "bot") {
    const playerWon = result === "X";
    if (playerWon) score.p1++; else score.p2++;
    title = playerWon ? T[lang].youWin : T[lang].youLose;
    apiScore = playerWon ? 10 : 0;
    if (window.CubySfx) (playerWon ? CubySfx.win() : CubySfx.lose());
  } else {
    if (result === "X") score.p1++; else score.p2++;
    title = result === "X" ? T[lang].xWins : T[lang].oWins;
    apiScore = 10;
    if (window.CubySfx) CubySfx.win();
  }

  renderScoreboard();
  document.getElementById("resultTitle").textContent = title;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "tictactoe", apiScore);
}

function startRound() {
  board = ["", "", "", "", "", "", "", "", ""];
  winningLine = [];
  current = "X";
  gameOver = false;
  winLineEl.classList.remove("show");
  document.getElementById("resultModal").hidden = true;

  document.getElementById("modeSelect").hidden = true;
  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  renderScoreboard();
  updateStatus();
  render();
}

document.querySelectorAll(".mode-btn").forEach(btn => {
  btn.onclick = () => {
    mode = btn.dataset.mode;
    if (mode === "bot") {
      document.getElementById("modeSelect").hidden = true;
      document.getElementById("difficultySelect").hidden = false;
    } else {
      score.p1 = 0; score.p2 = 0; score.draw = 0;
      startRound();
    }
  };
});

document.getElementById("backToModeBtn").onclick = () => {
  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("modeSelect").hidden = false;
};

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => {
    difficulty = btn.dataset.difficulty;
    score.p1 = 0; score.p2 = 0; score.draw = 0;
    startRound();
  };
});

document.getElementById("changeModeBtn").onclick = () => {
  document.getElementById("gameArea").hidden = true;
  document.getElementById("modeSelect").hidden = false;
};

document.getElementById("replayBtn").onclick = () => startRound();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  if (!document.getElementById("gameArea").hidden) {
    renderScoreboard();
    updateStatus();
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

applyLang();
