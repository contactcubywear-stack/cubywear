import { saveScore } from "../api.js";

const T = {
  fr: {
    hint: "Glisse, utilise les flèches ou les boutons pour déplacer les pièces",
    shuffle: "Mélanger", home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    winTitle: "🎉 Résolu !", movesLabel: "Coups",
    movesText: n => `${n} coups`
  },
  en: {
    hint: "Swipe, use the arrow keys, or the buttons to move the pieces",
    shuffle: "Shuffle", home: "Home", mainMenu: "Main menu", replay: "Replay",
    winTitle: "🎉 Solved!", movesLabel: "Moves",
    movesText: n => `${n} moves`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const sizeButtons = document.querySelectorAll(".size-btn");

const EMOJI_POOL = [
  "🎮","⭐","🔥","💀","⚡","🎲","🎹","🎧","🎯","🎁",
  "🚀","🧩","🎈","🪄","🔮","🍀","🦄","🍩","🍕","🍔",
  "🍟","🌮","🍎","🍇","🍉","🥑","🐶","🐱","🐵","🦊",
  "🐸","🐧","🦁","🐢","🌟","🌈","☀️","🌙","⚽","🏀",
  "🎾","🏈","🎳","🎱","🚗","✈️","🚁","🛸","⚓","🎸"
];

const GRADIENT_PAIRS = [
  ["#1F4690", "#E8AA42"],
  ["#9B59B6", "#F2811D"],
  ["#2ECC71", "#1F4690"],
  ["#E74C3C", "#E8AA42"],
  ["#5AC8FA", "#FF6FA5"]
];

function buildPuzzleImage() {
  const emoji = EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)];
  const [c1, c2] = GRADIENT_PAIRS[Math.floor(Math.random() * GRADIENT_PAIRS.length)];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <text x="200" y="290" font-size="300" text-anchor="middle">${emoji}</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

let PUZZLE_IMAGE = buildPuzzleImage();

let size = 4;
let tiles = [];
let emptyIndex = size * size - 1;
let moves = 0;
let over = false;
let tileEls = {};

function solvedTiles() {
  return Array.from({ length: size * size }, (_, i) => i);
}

function getAdjacentIndexes(index) {
  const row = Math.floor(index / size);
  const col = index % size;
  const result = [];
  if (row > 0) result.push(index - size);
  if (row < size - 1) result.push(index + size);
  if (col > 0) result.push(index - 1);
  if (col < size - 1) result.push(index + 1);
  return result;
}

function swap(a, b) {
  [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
}

function buildTiles() {
  boardEl.innerHTML = "";
  boardEl.style.setProperty("--size", size);
  tileEls = {};

  tiles.forEach((originalIndex) => {
    const tile = document.createElement("div");
    tile.className = "puzzle-tile";
    tile.dataset.original = originalIndex;

    const inner = document.createElement("div");
    inner.className = "tile-inner";

    if (originalIndex === size * size - 1) {
      tile.classList.add("empty");
    } else {
      const origRow = Math.floor(originalIndex / size);
      const origCol = originalIndex % size;
      inner.style.backgroundImage = `url("${PUZZLE_IMAGE}")`;
      inner.style.backgroundSize = `${size * 100}% ${size * 100}%`;
      inner.style.backgroundPosition = `${(origCol / (size - 1)) * 100}% ${(origRow / (size - 1)) * 100}%`;
      inner.onclick = () => {
        const slotIndex = tiles.indexOf(originalIndex);
        tryMove(slotIndex);
      };
    }

    tile.appendChild(inner);
    boardEl.appendChild(tile);
    tileEls[originalIndex] = tile;
  });

  positionTiles();
}

function positionTiles() {
  tiles.forEach((originalIndex, slotIndex) => {
    const row = Math.floor(slotIndex / size);
    const col = slotIndex % size;
    const el = tileEls[originalIndex];
    el.style.left = `${(col / size) * 100}%`;
    el.style.top = `${(row / size) * 100}%`;
  });
}

function shuffleBoard() {
  tiles = solvedTiles();
  emptyIndex = tiles.length - 1;
  over = false;
  moves = 0;
  movesEl.textContent = T[lang].movesText(0);
  PUZZLE_IMAGE = buildPuzzleImage();

  for (let i = 0; i < size * size * 40; i++) {
    const neighbors = getAdjacentIndexes(emptyIndex);
    const target = neighbors[Math.floor(Math.random() * neighbors.length)];
    swap(target, emptyIndex);
    emptyIndex = target;
  }

  buildTiles();
}

async function tryMove(slotIndex) {
  if (over) return;
  const adjacent = getAdjacentIndexes(emptyIndex);
  if (!adjacent.includes(slotIndex)) {
    if (window.CubySfx) CubySfx.fail();
    return;
  }

  swap(slotIndex, emptyIndex);
  emptyIndex = slotIndex;
  moves++;
  movesEl.textContent = T[lang].movesText(moves);
  positionTiles();
  if (window.CubySfx) CubySfx.tap();

  if (tiles.every((v, i) => v === i)) {
    over = true;
    if (window.CubySfx) CubySfx.win();

    const par = size * size * 3;
    const stars = moves <= par * 0.6 ? 3 : moves <= par ? 2 : 1;
    document.getElementById("starsRow").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
    document.getElementById("statMoves").textContent = moves;
    document.getElementById("resultModal").hidden = false;

    await saveScore("CW-BLK-1-0001", "puzzle-glissant", Math.max(50 - moves, 5));
  }
}

function moveBlank(dir) {
  if (over) return;
  const row = Math.floor(emptyIndex / size);
  const col = emptyIndex % size;
  let target = null;

  if (dir === "up" && row < size - 1) target = emptyIndex + size;
  if (dir === "down" && row > 0) target = emptyIndex - size;
  if (dir === "left" && col < size - 1) target = emptyIndex + 1;
  if (dir === "right" && col > 0) target = emptyIndex - 1;

  if (target !== null) tryMove(target);
}

document.getElementById("btnUp").onclick = () => moveBlank("up");
document.getElementById("btnDown").onclick = () => moveBlank("down");
document.getElementById("btnLeft").onclick = () => moveBlank("left");
document.getElementById("btnRight").onclick = () => moveBlank("right");

window.addEventListener("keydown", e => {
  const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (map[e.key]) {
    e.preventDefault();
    moveBlank(map[e.key]);
  }
});

let touchStartX = 0, touchStartY = 0;
boardEl.addEventListener("touchstart", e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

boardEl.addEventListener("touchend", e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) {
    moveBlank(dx > 0 ? "right" : "left");
  } else {
    moveBlank(dy > 0 ? "down" : "up");
  }
}, { passive: true });

sizeButtons.forEach(btn => {
  btn.onclick = () => {
    sizeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    size = Number(btn.dataset.size);
    shuffleBoard();
  };
});

document.getElementById("shuffleBtn").onclick = shuffleBoard;
document.getElementById("replayBtn").onclick = () => {
  document.getElementById("resultModal").hidden = true;
  shuffleBoard();
};

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  movesEl.textContent = T[lang].movesText(moves);
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

applyLang();
shuffleBoard();
