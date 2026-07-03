import { saveScore } from "../api.js";

const boardEl = document.getElementById("board");
const movesEl = document.getElementById("moves");
const sizeButtons = document.querySelectorAll(".size-btn");

const PUZZLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1F4690"/>
      <stop offset="100%" stop-color="#E8AA42"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g)"/>
  <circle cx="200" cy="160" r="90" fill="#130D33" opacity="0.25"/>
  <text x="200" y="175" font-size="46" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">CUBI</text>
  <text x="200" y="225" font-size="46" font-family="Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">WEAR</text>
  <text x="200" y="320" font-size="90" text-anchor="middle">🧠</text>
</svg>
`)}`;

let size = 3;
let tiles = [];
let emptyIndex = size * size - 1;
let moves = 0;
let over = false;

function solvedTiles() {
  return Array.from({ length: size * size }, (_, i) => i);
}

function shuffle() {
  tiles = solvedTiles();
  emptyIndex = tiles.length - 1;
  over = false;
  moves = 0;
  movesEl.textContent = "0 coups";

  // Perform random valid slides to guarantee a solvable state.
  for (let i = 0; i < size * size * 40; i++) {
    const neighbors = getAdjacentIndexes(emptyIndex);
    const target = neighbors[Math.floor(Math.random() * neighbors.length)];
    swap(target, emptyIndex);
    emptyIndex = target;
  }

  render();
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

function render() {
  boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  boardEl.style.gridTemplateRows = `repeat(${size}, minmax(0, 1fr))`;
  boardEl.innerHTML = "";

  tiles.forEach((originalIndex, slotIndex) => {
    const tile = document.createElement("div");
    tile.className = "puzzle-tile";

    if (originalIndex === size * size - 1) {
      tile.classList.add("empty");
    } else {
      const origRow = Math.floor(originalIndex / size);
      const origCol = originalIndex % size;
      tile.style.backgroundImage = `url("${PUZZLE_IMAGE}")`;
      tile.style.backgroundSize = `${size * 100}% ${size * 100}%`;
      tile.style.backgroundPosition = `${(origCol / (size - 1)) * 100}% ${(origRow / (size - 1)) * 100}%`;
      tile.onclick = () => tryMove(slotIndex);
    }

    boardEl.appendChild(tile);
  });
}

async function tryMove(slotIndex) {
  if (over) return;
  const adjacent = getAdjacentIndexes(emptyIndex);
  if (!adjacent.includes(slotIndex)) return;

  swap(slotIndex, emptyIndex);
  emptyIndex = slotIndex;
  moves++;
  movesEl.textContent = `${moves} coups`;
  render();

  if (tiles.every((v, i) => v === i)) {
    over = true;
    alert(`Bravo, résolu en ${moves} coups !`);
    await saveScore("CW-BLK-1-0001", "puzzle-glissant", Math.max(50 - moves, 5));
    window.location.href = "../index.html";
  }
}

sizeButtons.forEach(btn => {
  btn.onclick = () => {
    sizeButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    size = Number(btn.dataset.size);
    shuffle();
  };
});

document.getElementById("shuffleBtn").onclick = shuffle;

shuffle();
