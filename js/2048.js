import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", easyDesc: "5×5 · objectif 512",
    medium: "Moyen", mediumDesc: "4×4 · objectif 1024",
    hard: "Difficile", hardDesc: "4×4 · objectif 2048",
    impossible: "Impossible", impossibleDesc: "3×3 · objectif 2048",
    mainMenu: "Menu principal", home: "Accueil", changeLevel: "Changer niveau",
    hint: "Glisse, utilise les flèches ou les boutons pour bouger les tuiles",
    continueGame: "Continuer",
    gameOver: "💥 Plus aucun mouvement possible !",
    finalScore: "Score final", replay: "Rejouer",
    targetReached: t => `🎉 ${t} atteint, continue pour un meilleur score !`
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", easyDesc: "5×5 · target 512",
    medium: "Medium", mediumDesc: "4×4 · target 1024",
    hard: "Hard", hardDesc: "4×4 · target 2048",
    impossible: "Impossible", impossibleDesc: "3×3 · target 2048",
    mainMenu: "Main menu", home: "Home", changeLevel: "Change level",
    hint: "Swipe, use the arrow keys, or the buttons to move tiles",
    continueGame: "Continue",
    gameOver: "💥 No more moves possible!",
    finalScore: "Final score", replay: "Replay",
    targetReached: t => `🎉 ${t} reached, keep going for a better score!`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { size: 5, target: 512 },
  moyen:      { size: 4, target: 1024 },
  difficile:  { size: 4, target: 2048 },
  impossible: { size: 3, target: 2048 }
};

let SIZE = 4;
let TARGET = 2048;
let difficulty = "moyen";

const boardEl = document.getElementById("board");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

let board = [];
let score = 0;
let best = Number(localStorage.getItem("best2048") || 0);
let won = false;
let over = false;
let lastMerged = [];
let lastNew = null;

function addRandomTile() {
  const empty = [];
  board.forEach((row, r) => row.forEach((v, c) => { if (v === 0) empty.push([r, c]); }));
  if (empty.length === 0) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  board[r][c] = Math.random() < 0.9 ? 2 : 4;
  lastNew = [r, c];
}

function render() {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${SIZE}, minmax(0, 1fr))`;

  board.forEach((row, r) => {
    row.forEach((value, c) => {
      const tile = document.createElement("div");
      tile.className = "tile";
      if (value !== 0) {
        tile.dataset.value = value;
        tile.textContent = value;
        if (lastMerged[r] && lastMerged[r][c]) tile.classList.add("merged");
        if (lastNew && lastNew[0] === r && lastNew[1] === c) tile.classList.add("pop");
      }
      boardEl.appendChild(tile);
    });
  });
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function transpose(b) {
  return b[0].map((_, c) => b.map(row => row[c]));
}

function reverseRows(b) {
  return b.map(row => [...row].reverse());
}

function moveRowLeft(row) {
  const filtered = row.map((v, i) => ({ v, i })).filter(x => x.v !== 0);
  const merged = [];
  const mergedFlags = [];
  let gain = 0;

  for (let i = 0; i < filtered.length; i++) {
    if (filtered[i].v === filtered[i + 1]?.v) {
      merged.push(filtered[i].v * 2);
      mergedFlags.push(true);
      gain += filtered[i].v * 2;
      i++;
    } else {
      merged.push(filtered[i].v);
      mergedFlags.push(false);
    }
  }

  while (merged.length < SIZE) { merged.push(0); mergedFlags.push(false); }
  return { row: merged, gain, mergedFlags };
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
  if (window.CubySfx) CubySfx.lose();
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "2048", score);
}

function move(direction) {
  if (over) return;

  let working = board.map(row => [...row]);
  let mergeGrid = working.map(row => row.map(() => false));

  if (direction === "up") working = transpose(working);
  if (direction === "down") working = reverseRows(transpose(working));
  if (direction === "right") working = reverseRows(working);

  let gainTotal = 0;
  const mergeRows = [];
  working = working.map(row => {
    const { row: newRow, gain, mergedFlags } = moveRowLeft(row);
    gainTotal += gain;
    mergeRows.push(mergedFlags);
    return newRow;
  });
  let mergedOriented = mergeRows;

  if (direction === "right") { working = reverseRows(working); mergedOriented = reverseRows(mergedOriented); }
  if (direction === "up") { working = transpose(working); mergedOriented = transpose(mergedOriented); }
  if (direction === "down") {
    working = transpose(reverseRows(working));
    mergedOriented = transpose(reverseRows(mergedOriented));
  }

  if (JSON.stringify(working) === JSON.stringify(board)) return;

  board = working;
  lastMerged = mergedOriented;
  score += gainTotal;
  if (score > best) { best = score; localStorage.setItem("best2048", best); }
  if (gainTotal > 0 && window.CubySfx) CubySfx.match();
  else if (window.CubySfx) CubySfx.tap();

  addRandomTile();
  render();

  if (!won && board.some(row => row.includes(TARGET))) {
    won = true;
    showWinBanner();
  }

  if (isGameOver()) endGame();
}

function showWinBanner() {
  document.getElementById("winBannerText").textContent = T[lang].targetReached(TARGET);
  document.getElementById("winBanner").hidden = false;
  if (window.CubySfx) CubySfx.win();
}

document.getElementById("winBannerClose").onclick = () => {
  document.getElementById("winBanner").hidden = true;
};

document.getElementById("btnUp").onclick = () => move("up");
document.getElementById("btnDown").onclick = () => move("down");
document.getElementById("btnLeft").onclick = () => move("left");
document.getElementById("btnRight").onclick = () => move("right");
document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("changeDiffBtn").onclick = () => location.reload();

window.addEventListener("keydown", e => {
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (map[e.key] && !document.getElementById("gameArea").hidden) {
    e.preventDefault();
    move(map[e.key]);
  }
});

// Support tactile (swipe) sur le plateau
let touchStartX = 0, touchStartY = 0;
boardEl.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

boardEl.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 25) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? "right" : "left");
  } else {
    move(dy > 0 ? "down" : "up");
  }
}, { passive: true });

function startGame(diff) {
  difficulty = diff;
  const cfg = DIFFICULTIES[diff];
  SIZE = cfg.size;
  TARGET = cfg.target;

  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  lastMerged = board.map(row => row.map(() => false));
  lastNew = null;
  score = 0;
  won = false;
  over = false;

  document.getElementById("target").textContent = TARGET;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  addRandomTile();
  addRandomTile();
  render();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

applyLang();
