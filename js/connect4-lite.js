import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer", changeLevel: "Changer niveau",
    yourTurn: "À toi de jouer", botThinking: "Le bot réfléchit...",
    win: "🎉 Tu as gagné !", lose: "😕 Tu as perdu !", draw: "🤝 Match nul !",
    you: "Toi", bot: "Bot", draws: "Nuls"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay", changeLevel: "Change level",
    yourTurn: "Your turn", botThinking: "Bot is thinking...",
    win: "🎉 You won!", lose: "😕 You lost!", draw: "🤝 Draw!",
    you: "You", bot: "Bot", draws: "Draws"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { depth: 0 },
  moyen:      { depth: 1 },
  difficile:  { depth: 3 },
  impossible: { depth: 5 }
};

let cfg = DIFFICULTIES.moyen;
let difficulty = "moyen";

const COLS = 6;
const ROWS = 5;
const EMPTY = 0, PLAYER = 1, BOT = 2;
const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let board;
let over = false;
let lastDrop = null;
let winCells = [];
const score = { player: 0, bot: 0, draw: 0 };

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function lowestEmptyRow(col, b) {
  const bd = b || board;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (bd[r][col] === EMPTY) return r;
  }
  return -1;
}

function findWinLine(player, b) {
  const bd = b || board;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (bd[r][c] !== player) continue;
      for (const [dr, dc] of DIRS) {
        const cells = [[r, c]];
        for (let k = 1; k < 4; k++) {
          const nr = r + dr * k, nc = c + dc * k;
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || bd[nr][nc] !== player) break;
          cells.push([nr, nc]);
        }
        if (cells.length >= 4) return cells.slice(0, 4);
      }
    }
  }
  return null;
}

function checkWin(player, b) {
  return findWinLine(player, b) !== null;
}

function isFull(b) {
  const bd = b || board;
  return bd[0].every(cell => cell !== EMPTY);
}

function renderScoreboard() {
  const sb = document.getElementById("scoreboard");
  sb.innerHTML = `
    <div class="score-chip">${T[lang].you}<span class="val">${score.player}</span></div>
    <div class="score-chip">${T[lang].draws}<span class="val">${score.draw}</span></div>
    <div class="score-chip">${T[lang].bot}<span class="val">${score.bot}</span></div>
  `;
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
        if (lastDrop && lastDrop[0] === r && lastDrop[1] === c) piece.classList.add("new-drop");
        if (winCells.some(([wr, wc]) => wr === r && wc === c)) piece.classList.add("win");
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

// --- IA : heuristique + minimax avec alpha-beta selon la difficulté ---
function cloneBoard(b) {
  return b.map(row => [...row]);
}

function evaluateWindow(cells, player) {
  const opp = player === BOT ? PLAYER : BOT;
  const playerCount = cells.filter(v => v === player).length;
  const emptyCount = cells.filter(v => v === EMPTY).length;
  const oppCount = cells.filter(v => v === opp).length;
  let score = 0;
  if (playerCount === 4) score += 100;
  else if (playerCount === 3 && emptyCount === 1) score += 5;
  else if (playerCount === 2 && emptyCount === 2) score += 2;
  if (oppCount === 3 && emptyCount === 1) score -= 4;
  return score;
}

function scorePosition(b, player) {
  let score = 0;
  const centerCol = Math.floor(COLS / 2);
  score += b.map(row => row[centerCol]).filter(v => v === player).length * 3;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([0, 1, 2, 3].map(i => b[r][c + i]), player);
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 4; r++) {
      score += evaluateWindow([0, 1, 2, 3].map(i => b[r + i][c]), player);
    }
  }
  for (let r = 0; r <= ROWS - 4; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([0, 1, 2, 3].map(i => b[r + i][c + i]), player);
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 4; c++) {
      score += evaluateWindow([0, 1, 2, 3].map(i => b[r - i][c + i]), player);
    }
  }
  return score;
}

function validCols(b) {
  const bd = b || board;
  const cols = [];
  for (let c = 0; c < COLS; c++) if (lowestEmptyRow(c, bd) !== -1) cols.push(c);
  return cols;
}

function minimax(b, depth, alpha, beta, maximizing) {
  const cols = validCols(b);
  const botWins = checkWin(BOT, b);
  const playerWins = checkWin(PLAYER, b);
  const terminal = botWins || playerWins || cols.length === 0;

  if (depth === 0 || terminal) {
    if (terminal) {
      if (botWins) return { score: 1000000 - (5 - depth) };
      if (playerWins) return { score: -1000000 + (5 - depth) };
      return { score: 0 };
    }
    return { score: scorePosition(b, BOT) };
  }

  if (maximizing) {
    let value = -Infinity, bestCol = cols[0];
    for (const col of cols) {
      const r = lowestEmptyRow(col, b);
      const nb = cloneBoard(b);
      nb[r][col] = BOT;
      const result = minimax(nb, depth - 1, alpha, beta, false);
      if (result.score > value) { value = result.score; bestCol = col; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  } else {
    let value = Infinity, bestCol = cols[0];
    for (const col of cols) {
      const r = lowestEmptyRow(col, b);
      const nb = cloneBoard(b);
      nb[r][col] = PLAYER;
      const result = minimax(nb, depth - 1, alpha, beta, true);
      if (result.score < value) { value = result.score; bestCol = col; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return { score: value, col: bestCol };
  }
}

function botChooseCol() {
  if (cfg.depth === 0) {
    // Facile : gagne si possible, sinon souvent aléatoire (battable).
    let col = findWinningCol(BOT);
    if (col === null && Math.random() < 0.3) col = findWinningCol(PLAYER);
    if (col === null) {
      const cols = validCols();
      col = cols[Math.floor(Math.random() * cols.length)];
    }
    return col;
  }
  if (cfg.depth === 1) {
    let col = findWinningCol(BOT);
    if (col === null) col = findWinningCol(PLAYER);
    if (col === null) {
      const prefs = [2, 3, 1, 4, 0, 5];
      col = prefs.find(c => lowestEmptyRow(c) !== -1);
    }
    return col;
  }
  const result = minimax(board, cfg.depth, -Infinity, Infinity, true);
  return result.col !== undefined ? result.col : validCols()[0];
}

function botMove() {
  const col = botChooseCol();
  if (col === undefined || col === null) return;

  const r = lowestEmptyRow(col);
  board[r][col] = BOT;
  lastDrop = [r, col];
  if (window.CubySfx) CubySfx.place();
  render();

  const line = findWinLine(BOT);
  if (line) { winCells = line; return endGame("lose"); }
  if (isFull()) return endGame("draw");

  statusEl.textContent = T[lang].yourTurn;
}

function playerMove(col) {
  if (over) return;
  const r = lowestEmptyRow(col);
  if (r === -1) return;

  board[r][col] = PLAYER;
  lastDrop = [r, col];
  if (window.CubySfx) CubySfx.place();
  render();

  const line = findWinLine(PLAYER);
  if (line) { winCells = line; return endGame("win"); }
  if (isFull()) return endGame("draw");

  statusEl.textContent = T[lang].botThinking;
  setTimeout(botMove, 450);
}

async function endGame(result) {
  over = true;
  render();
  statusEl.textContent = "";

  const titles = { win: T[lang].win, lose: T[lang].lose, draw: T[lang].draw };
  const scores = { win: 20, lose: 0, draw: 10 };

  if (result === "win") score.player++;
  else if (result === "lose") score.bot++;
  else score.draw++;
  renderScoreboard();

  if (window.CubySfx) (result === "win" ? CubySfx.win() : result === "lose" ? CubySfx.lose() : CubySfx.draw());

  document.getElementById("resultTitle").textContent = titles[result];
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "connect4-lite", scores[result]);
}

function startRound() {
  initBoard();
  over = false;
  lastDrop = null;
  winCells = [];
  document.getElementById("resultModal").hidden = true;
  renderScoreboard();
  statusEl.textContent = T[lang].yourTurn;
  render();
}

function startGame(diff) {
  difficulty = diff;
  cfg = DIFFICULTIES[diff];
  score.player = 0;
  score.bot = 0;
  score.draw = 0;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => startRound();
document.getElementById("changeDiffBtn").onclick = () => {
  document.getElementById("gameArea").hidden = true;
  document.getElementById("difficultySelect").hidden = false;
};

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  if (!document.getElementById("gameArea").hidden) {
    renderScoreboard();
    if (!over) statusEl.textContent = T[lang].yourTurn;
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__connect4Debug = { playerMove, botMove, getBoard: () => board, getState: () => ({ over, score }) };

applyLang();
