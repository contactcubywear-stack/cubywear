import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    you: "Toi", bot: "Bot", yourTurn: "À toi de jouer", botThinking: "Le bot réfléchit...",
    youWin: "🎉 Tu as gagné !", youLose: "😕 Tu as perdu !", draw: "🤝 Match nul !"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    you: "You", bot: "Bot", yourTurn: "Your turn", botThinking: "Bot is thinking...",
    youWin: "🎉 You won!", youLose: "😕 You lost!", draw: "🤝 Draw!"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { size: 4, botDepth: 0 },
  moyen:      { size: 4, botDepth: 1 },
  difficile:  { size: 6, botDepth: 2 },
  impossible: { size: 6, botDepth: 3 }
};

let cfg = DIFFICULTIES.moyen;
let SIZE = 4;
const EMPTY = 0, BLACK = 1, WHITE = 2;
const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let board;
let currentPlayer = BLACK;
let over = false;
let lastPlaced = null;
let lastFlips = [];

function opponent(p) {
  return p === BLACK ? WHITE : BLACK;
}

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
  const mid = SIZE / 2;
  board[mid - 1][mid - 1] = WHITE;
  board[mid - 1][mid] = BLACK;
  board[mid][mid - 1] = BLACK;
  board[mid][mid] = WHITE;
}

function getFlips(r, c, player, b) {
  const bd = b || board;
  if (bd[r][c] !== EMPTY) return [];
  const allFlips = [];
  for (const [dr, dc] of DIRS) {
    const lineFlips = [];
    let nr = r + dr, nc = c + dc;
    while (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && bd[nr][nc] === opponent(player)) {
      lineFlips.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (lineFlips.length > 0 && nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && bd[nr][nc] === player) {
      allFlips.push(...lineFlips);
    }
  }
  return allFlips;
}

function validMoves(player, b) {
  const bd = b || board;
  const moves = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const flips = getFlips(r, c, player, bd);
      if (flips.length > 0) moves.push({ r, c, flips });
    }
  }
  return moves;
}

function applyMove(move, player, b) {
  const bd = b || board;
  bd[move.r][move.c] = player;
  move.flips.forEach(([r, c]) => (bd[r][c] = player));
}

function countPieces(b) {
  const bd = b || board;
  let black = 0, white = 0;
  bd.forEach(row => row.forEach(v => {
    if (v === BLACK) black++;
    if (v === WHITE) white++;
  }));
  return { black, white };
}

function updateHud() {
  const { black, white } = countPieces();
  document.getElementById("hud").innerHTML =
    `⚫ ${T[lang].you} : ${black} · ⚪ ${T[lang].bot} : ${white}`;
}

function render() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${SIZE}, minmax(0, 1fr))`;
  const moves = currentPlayer === BLACK && !over ? validMoves(BLACK) : [];

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement("div");
      cell.className = "othello-cell";

      if (board[r][c] !== EMPTY) {
        const piece = document.createElement("div");
        piece.className = "piece " + (board[r][c] === BLACK ? "black" : "white");
        if (lastPlaced && lastPlaced[0] === r && lastPlaced[1] === c) piece.classList.add("piece-new");
        if (lastFlips.some(([fr, fc]) => fr === r && fc === c)) piece.classList.add("flipped");
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
  lastPlaced = [r, c];
  lastFlips = move.flips;
  applyMove(move, BLACK);
  if (window.CubySfx) CubySfx.place();
  afterMove();
}

// --- IA : évaluation + minimax peu profond selon la difficulté ---
function evalBoard(b, player) {
  const { black, white } = countPieces(b);
  const mine = player === BLACK ? black : white;
  const theirs = player === BLACK ? white : black;
  let score = mine - theirs;

  const corners = [[0, 0], [0, SIZE - 1], [SIZE - 1, 0], [SIZE - 1, SIZE - 1]];
  corners.forEach(([r, c]) => {
    if (b[r][c] === player) score += 8;
    else if (b[r][c] === opponent(player)) score -= 8;
  });

  score += validMoves(player, b).length * 0.5;
  return score;
}

function cloneBoard(b) {
  return b.map(row => [...row]);
}

function minimax(b, depth, player, maximizingPlayer, alpha, beta) {
  const moves = validMoves(player, b);
  if (depth === 0 || moves.length === 0) {
    return { score: evalBoard(b, maximizingPlayer) };
  }

  let best = null;
  if (player === maximizingPlayer) {
    let value = -Infinity;
    for (const move of moves) {
      const nb = cloneBoard(b);
      applyMove(move, player, nb);
      const result = minimax(nb, depth - 1, opponent(player), maximizingPlayer, alpha, beta);
      if (result.score > value) { value = result.score; best = move; }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return { score: value, move: best };
  } else {
    let value = Infinity;
    for (const move of moves) {
      const nb = cloneBoard(b);
      applyMove(move, player, nb);
      const result = minimax(nb, depth - 1, opponent(player), maximizingPlayer, alpha, beta);
      if (result.score < value) { value = result.score; best = move; }
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return { score: value, move: best };
  }
}

function botMove() {
  const moves = validMoves(WHITE);
  if (moves.length === 0) {
    afterMove();
    return;
  }

  let chosen;
  if (cfg.botDepth === 0) {
    chosen = moves[Math.floor(Math.random() * moves.length)];
  } else {
    const result = minimax(board, cfg.botDepth, WHITE, WHITE, -Infinity, Infinity);
    chosen = result.move || moves[0];
  }

  lastPlaced = [chosen.r, chosen.c];
  lastFlips = chosen.flips;
  applyMove(chosen, WHITE);
  if (window.CubySfx) CubySfx.place();
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
    statusEl.textContent = T[lang].botThinking;
    setTimeout(botMove, 450);
  } else {
    statusEl.textContent = T[lang].yourTurn;
    render();
  }
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  const { black, white } = countPieces();
  const title = black > white ? T[lang].youWin : black < white ? T[lang].youLose : T[lang].draw;
  statusEl.textContent = "";
  document.getElementById("resultTitle").textContent = title;
  document.getElementById("statPlayer").textContent = black;
  document.getElementById("statBot").textContent = white;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-othello", black > white ? 20 : black === white ? 10 : 0);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  SIZE = cfg.size;
  currentPlayer = BLACK;
  over = false;
  lastPlaced = null;
  lastFlips = [];

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  initBoard();
  render();
  checkTurn();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  if (!document.getElementById("gameArea").hidden && !over) {
    updateHud();
    statusEl.textContent = currentPlayer === WHITE ? T[lang].botThinking : T[lang].yourTurn;
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__othelloDebug = { playerMove, botMove, getState: () => ({ currentPlayer, over, ...countPieces() }), getBoard: () => board };

applyLang();
