import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    yourTurn: "À toi de jouer", botThinking: "Le bot réfléchit...",
    hint: "🔴 Toi : relie le haut et le bas · 🔵 Bot : relie la gauche et la droite",
    youWin: "🎉 Tu as relié le haut et le bas !", youLose: "😕 Le bot a relié la gauche et la droite !"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    yourTurn: "Your turn", botThinking: "Bot is thinking...",
    hint: "🔴 You: connect top and bottom · 🔵 Bot: connect left and right",
    youWin: "🎉 You connected top and bottom!", youLose: "😕 The bot connected left and right!"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { size: 4, bot: "random" },
  moyen:      { size: 5, bot: "greedy" },
  difficile:  { size: 6, bot: "path" },
  impossible: { size: 7, bot: "path" }
};

let cfg = DIFFICULTIES.moyen;
let SIZE = 5;
const EMPTY = 0, PLAYER = 1, BOT = 2;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");

let board;
let over = false;
let currentPlayer = PLAYER;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY));
}

function neighbors(r, c) {
  return [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c + 1], [r + 1, c - 1], [r + 1, c]]
    .filter(([nr, nc]) => nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE);
}

function findConnectedPath(player) {
  const visited = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
  const parent = {};
  const queue = [];

  if (player === PLAYER) {
    for (let c = 0; c < SIZE; c++) {
      if (board[0][c] === player) { queue.push([0, c]); visited[0][c] = true; }
    }
  } else {
    for (let r = 0; r < SIZE; r++) {
      if (board[r][0] === player) { queue.push([r, 0]); visited[r][0] = true; }
    }
  }

  while (queue.length) {
    const [r, c] = queue.shift();
    if (player === PLAYER && r === SIZE - 1) return reconstructPath(parent, [r, c]);
    if (player === BOT && c === SIZE - 1) return reconstructPath(parent, [r, c]);
    for (const [nr, nc] of neighbors(r, c)) {
      if (!visited[nr][nc] && board[nr][nc] === player) {
        visited[nr][nc] = true;
        parent[`${nr},${nc}`] = [r, c];
        queue.push([nr, nc]);
      }
    }
  }
  return null;
}

function reconstructPath(parent, end) {
  const path = [end];
  let key = `${end[0]},${end[1]}`;
  while (parent[key]) {
    const prev = parent[key];
    path.push(prev);
    key = `${prev[0]},${prev[1]}`;
  }
  return path;
}

function checkConnected(player) {
  return findConnectedPath(player) !== null;
}

function render(winPath) {
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
      if (winPath && winPath.some(([wr, wc]) => wr === r && wc === c)) cell.classList.add("win-path");
      if (board[r][c] === EMPTY && !over) {
        cell.onclick = () => playerMove(r, c);
      }
      rowEl.appendChild(cell);
    }
    boardEl.appendChild(rowEl);
  }
}

function setCellSize() {
  const maxWidth = Math.min(window.innerWidth * 0.85, 420);
  const w = Math.max(Math.min(Math.floor(maxWidth / (SIZE + SIZE * 0.5)), 44), 22);
  document.getElementById("board").parentElement.style.setProperty("--cell-w", `${w}px`);
  document.getElementById("board").parentElement.style.setProperty("--cell-h", `${Math.round(w * 1.15)}px`);
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

// --- IA "path" : Dijkstra pour estimer la distance restante de chacun ---
function shortestPathCost(color) {
  const dist = Array.from({ length: SIZE }, () => Array(SIZE).fill(Infinity));
  let frontier = [];

  if (color === PLAYER) {
    for (let c = 0; c < SIZE; c++) {
      if (board[0][c] === BOT) continue;
      const cost = board[0][c] === PLAYER ? 0 : 1;
      if (cost < dist[0][c]) { dist[0][c] = cost; frontier.push([cost, 0, c]); }
    }
  } else {
    for (let r = 0; r < SIZE; r++) {
      if (board[r][0] === PLAYER) continue;
      const cost = board[r][0] === BOT ? 0 : 1;
      if (cost < dist[r][0]) { dist[r][0] = cost; frontier.push([cost, r, 0]); }
    }
  }

  while (frontier.length) {
    frontier.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = frontier.shift();
    if (d > dist[r][c]) continue;
    for (const [nr, nc] of neighbors(r, c)) {
      const cellVal = board[nr][nc];
      const blocked = color === PLAYER ? cellVal === BOT : cellVal === PLAYER;
      if (blocked) continue;
      const stepCost = cellVal === color ? 0 : 1;
      const nd = d + stepCost;
      if (nd < dist[nr][nc]) {
        dist[nr][nc] = nd;
        frontier.push([nd, nr, nc]);
      }
    }
  }

  let best = Infinity;
  if (color === PLAYER) {
    for (let c = 0; c < SIZE; c++) best = Math.min(best, dist[SIZE - 1][c]);
  } else {
    for (let r = 0; r < SIZE; r++) best = Math.min(best, dist[r][SIZE - 1]);
  }
  return best;
}

function pathBotMove() {
  let bestCell = null, bestScore = -Infinity;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] !== EMPTY) continue;

      board[r][c] = BOT;
      const botDist = shortestPathCost(BOT);
      board[r][c] = EMPTY;

      board[r][c] = PLAYER;
      const playerDistIfTaken = shortestPathCost(PLAYER);
      board[r][c] = EMPTY;

      const score = playerDistIfTaken - botDist * 1.5;
      if (score > bestScore) { bestScore = score; bestCell = [r, c]; }
    }
  }
  return bestCell;
}

function botChooseCell() {
  if (cfg.bot === "random") {
    let cell = findWinningCell(BOT);
    if (!cell && Math.random() < 0.35) cell = findWinningCell(PLAYER);
    if (!cell) {
      const empties = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === EMPTY) empties.push([r, c]);
      cell = empties[Math.floor(Math.random() * empties.length)];
    }
    return cell;
  }

  if (cfg.bot === "greedy") {
    let cell = findWinningCell(BOT);
    if (!cell) cell = findWinningCell(PLAYER);
    if (!cell) {
      const empties = [];
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (board[r][c] === EMPTY) empties.push([r, c]);
      const adjacentToSelf = empties.filter(([r, c]) => neighbors(r, c).some(([nr, nc]) => board[nr][nc] === BOT));
      const pool = adjacentToSelf.length ? adjacentToSelf : empties;
      cell = pool[Math.floor(Math.random() * pool.length)];
    }
    return cell;
  }

  // "path" : cherche d'abord un coup gagnant/bloquant immédiat, sinon heuristique de distance.
  let cell = findWinningCell(BOT);
  if (!cell) cell = findWinningCell(PLAYER);
  if (!cell) cell = pathBotMove();
  return cell;
}

function botMove() {
  const cell = botChooseCell();
  if (!cell) return;

  const [r, c] = cell;
  board[r][c] = BOT;
  if (window.CubySfx) CubySfx.place();
  render();

  const path = findConnectedPath(BOT);
  if (path) {
    endGame("lose", path);
    return;
  }

  currentPlayer = PLAYER;
  statusEl.textContent = T[lang].yourTurn;
}

function playerMove(r, c) {
  if (over || currentPlayer !== PLAYER || board[r][c] !== EMPTY) return;

  board[r][c] = PLAYER;
  if (window.CubySfx) CubySfx.place();
  render();

  const path = findConnectedPath(PLAYER);
  if (path) {
    endGame("win", path);
    return;
  }

  currentPlayer = BOT;
  statusEl.textContent = T[lang].botThinking;
  setTimeout(botMove, cfg.bot === "path" ? 550 : 400);
}

async function endGame(result, path) {
  over = true;
  render(path);
  statusEl.textContent = "";
  document.getElementById("resultTitle").textContent = result === "win" ? T[lang].youWin : T[lang].youLose;
  document.getElementById("resultModal").hidden = false;
  if (window.CubySfx) (result === "win" ? CubySfx.win() : CubySfx.lose());
  await saveScore("CW-BLK-1-0001", "hexa-path", result === "win" ? 20 : 0);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  SIZE = cfg.size;
  currentPlayer = PLAYER;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  initBoard();
  setCellSize();
  statusEl.textContent = T[lang].yourTurn;
  render();
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
    statusEl.textContent = currentPlayer === PLAYER ? T[lang].yourTurn : T[lang].botThinking;
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__hexaPathDebug = {
  playerMove, botMove,
  getBoard: () => board,
  getState: () => ({ currentPlayer, over, SIZE })
};

applyLang();
