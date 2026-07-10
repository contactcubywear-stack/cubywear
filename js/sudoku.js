import { saveScore } from "../api.js";

const BASE_SOLUTION = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9]
];

const CLUES = 36;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Applique des transformations qui préservent la validité d'un Sudoku
// (permutation des chiffres, des lignes/colonnes dans leurs bandes,
// des bandes elles-mêmes, et transposition) pour varier la grille à
// chaque partie sans avoir à écrire un générateur complet.
function randomizeSolution(base) {
  let g = base.map(row => [...row]);

  const digits = shuffle([1,2,3,4,5,6,7,8,9]);
  g = g.map(row => row.map(v => digits[v - 1]));

  const bandOrder = shuffle([0, 1, 2]);
  const rowOrder = bandOrder.flatMap(b => shuffle([0, 1, 2]).map(i => b * 3 + i));
  g = rowOrder.map(r => g[r]);

  const stackOrder = shuffle([0, 1, 2]);
  const colOrder = stackOrder.flatMap(s => shuffle([0, 1, 2]).map(i => s * 3 + i));
  g = g.map(row => colOrder.map(c => row[c]));

  if (Math.random() < 0.5) {
    g = g[0].map((_, c) => g.map(row => row[c]));
  }

  return g;
}

function makePuzzle(solution, clues) {
  const puzzle = solution.map(row => [...row]);
  const cells = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);

  const toRemove = 81 - clues;
  shuffle(cells).slice(0, toRemove).forEach(([r, c]) => (puzzle[r][c] = 0));

  return puzzle;
}

const solution = randomizeSolution(BASE_SOLUTION);
const puzzle = makePuzzle(solution, CLUES);

const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");

puzzle.forEach((row, r) => {
  row.forEach((value, c) => {
    const input = document.createElement("input");
    input.className = "sudoku-cell";
    input.maxLength = 1;
    input.inputMode = "numeric";

    if ((Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1) input.classList.add("box-shade");
    if (c % 3 === 2 && c !== 8) input.classList.add("box-right");
    if (r % 3 === 2 && r !== 8) input.classList.add("box-bottom");

    if (value !== 0) {
      input.value = value;
      input.disabled = true;
    } else {
      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^1-9]/g, "").slice(0, 1);
      });
    }

    gridEl.appendChild(input);
  });
});

function isValidGroup(values) {
  const filtered = values.filter(v => v !== "");
  if (filtered.length !== 9) return false;
  return new Set(filtered).size === 9;
}

function readGrid() {
  const cells = [...gridEl.querySelectorAll(".sudoku-cell")];
  const rows = [];
  for (let r = 0; r < 9; r++) {
    rows.push(cells.slice(r * 9, r * 9 + 9).map(input => input.value));
  }
  return rows;
}

function isGridValid(rows) {
  for (let r = 0; r < 9; r++) {
    if (!isValidGroup(rows[r])) return false;
  }
  for (let c = 0; c < 9; c++) {
    if (!isValidGroup(rows.map(row => row[c]))) return false;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const box = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          box.push(rows[br * 3 + r][bc * 3 + c]);
        }
      }
      if (!isValidGroup(box)) return false;
    }
  }
  return true;
}

document.getElementById("validate").onclick = async () => {
  const rows = readGrid();
  const correct = isGridValid(rows);

  if (correct) {
    document.getElementById("resultModal").hidden = false;
    await saveScore("CW-BLK-1-0001", "sudoku", 20);
  } else {
    statusEl.textContent = "Il y a des erreurs ou des cases vides, continue !";
  }
};

document.getElementById("replayBtn").onclick = () => location.reload();
