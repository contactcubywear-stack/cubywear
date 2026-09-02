import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil",
    fillGrid: "Remplis la grille avec les chiffres de 1 à 9",
    erase: "Effacer", replay: "Rejouer",
    winTitle: "🎉 Bravo, grille résolue !",
    time: "Temps", mistakesLabel: "Erreurs"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home",
    fillGrid: "Fill the grid with digits from 1 to 9",
    erase: "Erase", replay: "Replay",
    winTitle: "🎉 Grid solved!",
    time: "Time", mistakesLabel: "Mistakes"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

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

const CLUES_BY_DIFFICULTY = { facile: 45, moyen: 36, difficile: 30, impossible: 24 };

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

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

let solution, puzzle, values;
let selected = null;
let mistakes = 0;
let seconds = 0;
let timerInterval = null;
let over = false;

const gridEl = document.getElementById("grid");
const numpadEl = document.getElementById("numpad");

function cellEl(r, c) {
  return gridEl.children[r * 9 + c];
}

function buildGrid() {
  gridEl.innerHTML = "";
  puzzle.forEach((row, r) => {
    row.forEach((value, c) => {
      const cell = document.createElement("div");
      cell.className = "sudoku-cell";
      cell.dataset.r = r;
      cell.dataset.c = c;

      if ((Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 1) cell.classList.add("box-shade");
      if (c % 3 === 2 && c !== 8) cell.classList.add("box-right");
      if (r % 3 === 2 && r !== 8) cell.classList.add("box-bottom");

      if (value !== 0) {
        cell.classList.add("fixed");
        cell.textContent = value;
      }

      cell.addEventListener("click", () => selectCell(r, c));
      gridEl.appendChild(cell);
    });
  });
}

function buildNumpad() {
  numpadEl.innerHTML = "";
  for (let n = 1; n <= 9; n++) {
    const btn = document.createElement("button");
    btn.className = "num-btn";
    btn.textContent = n;
    btn.onclick = () => placeValue(n);
    numpadEl.appendChild(btn);
  }
  const eraseKey = document.createElement("button");
  eraseKey.className = "num-btn";
  eraseKey.textContent = "⌫";
  eraseKey.onclick = () => placeValue(0);
  numpadEl.appendChild(eraseKey);
}

function selectCell(r, c) {
  if (over) return;
  if (puzzle[r][c] !== 0) { selected = null; highlight(); return; }
  selected = { r, c };
  highlight();
}

function highlight() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const el = cellEl(r, c);
      el.classList.remove("selected", "peer", "same-value");
    }
  }
  if (!selected) return;

  const { r, c } = selected;
  const boxR = Math.floor(r / 3) * 3, boxC = Math.floor(c / 3) * 3;
  const val = values[r][c];

  for (let rr = 0; rr < 9; rr++) {
    for (let cc = 0; cc < 9; cc++) {
      const sameRow = rr === r, sameCol = cc === c;
      const sameBox = rr >= boxR && rr < boxR + 3 && cc >= boxC && cc < boxC + 3;
      if (sameRow || sameCol || sameBox) cellEl(rr, cc).classList.add("peer");
      if (val !== 0 && values[rr][cc] === val) cellEl(rr, cc).classList.add("same-value");
    }
  }
  cellEl(r, c).classList.add("selected");
}

function placeValue(n) {
  if (over || !selected) return;
  const { r, c } = selected;
  if (puzzle[r][c] !== 0) return;

  values[r][c] = n;
  const el = cellEl(r, c);
  el.textContent = n === 0 ? "" : n;
  el.classList.remove("error");

  if (window.CubySfx) CubySfx.tap();

  if (n !== 0 && n !== solution[r][c]) {
    mistakes++;
    document.getElementById("mistakes").textContent = mistakes;
    el.classList.add("error");
    if (window.CubySfx) CubySfx.fail();
  }

  highlight();
  checkWin();
}

function checkWin() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (values[r][c] !== solution[r][c]) return;
    }
  }
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) CubySfx.win();

  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  document.getElementById("statTime").textContent = `${min}:${sec}`;
  document.getElementById("statMistakes").textContent = mistakes;
  document.getElementById("resultModal").hidden = false;

  saveScore("CW-BLK-1-0001", "sudoku", Math.max(30 - mistakes * 2, 5));
}

function tickTimer() {
  seconds++;
  const min = String(Math.floor(seconds / 60)).padStart(2, "0");
  const sec = String(seconds % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${min}:${sec}`;
}

function startGame(difficulty) {
  solution = randomizeSolution(BASE_SOLUTION);
  puzzle = makePuzzle(solution, CLUES_BY_DIFFICULTY[difficulty]);
  values = puzzle.map(row => [...row]);
  selected = null;
  mistakes = 0;
  seconds = 0;
  over = false;

  document.getElementById("mistakes").textContent = 0;
  document.getElementById("timer").textContent = "00:00";

  buildGrid();
  buildNumpad();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("eraseBtn").onclick = () => placeValue(0);

window.addEventListener("keydown", e => {
  if (!selected || over) return;
  if (e.key >= "1" && e.key <= "9") placeValue(Number(e.key));
  if (e.key === "Backspace" || e.key === "Delete") placeValue(0);
});

document.getElementById("replayBtn").onclick = () => location.reload();

applyLang();
