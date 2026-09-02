import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Touche un tube pour verser sa couleur du dessus dans un autre",
    moves: "Coups", best: "Meilleur (coups)",
    win: "🎉 Résolu !", newGame: "Nouvelle grille",
    finalMoves: "Nombre de coups", loading: "Préparation de la grille"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Tap a tube to pour its top color into another",
    moves: "Moves", best: "Best (moves)",
    win: "🎉 Solved!", newGame: "New puzzle",
    finalMoves: "Number of moves", loading: "Preparing the grid"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const CAPACITY = 4;
const PALETTE = ["#e74c3c", "#5AC8FA", "#2ecc71", "#E8AA42", "#9B59B6", "#F5D30F", "#FF6FA5", "#1F4690", "#7ED957", "#B0BEC5"];

const DIFFICULTIES = {
  facile: { colors: 4, empty: 2, shuffles: 35 },
  moyen: { colors: 6, empty: 2, shuffles: 55 },
  difficile: { colors: 8, empty: 2, shuffles: 80 },
  impossible: { colors: 10, empty: 2, shuffles: 110 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
let tubes = [];
let selected = -1;
let moves = 0;
let best = Infinity;
let over = false;

function pourAllowed(from, to) {
  if (from === to) return false;
  const src = tubes[from], dst = tubes[to];
  if (src.length === 0) return false;
  const topColor = src[src.length - 1];
  if (dst.length === 0) return true;
  if (dst.length >= CAPACITY) return false;
  return dst[dst.length - 1] === topColor;
}

function doPour(from, to) {
  const src = tubes[from], dst = tubes[to];
  const topColor = src[src.length - 1];
  let count = 0;
  while (count < src.length && src[src.length - 1 - count] === topColor) count++;
  const space = CAPACITY - dst.length;
  const moveCount = Math.min(count, space);
  for (let i = 0; i < moveCount; i++) {
    dst.push(src.pop());
  }
}

function dealRandom() {
  const units = [];
  for (let c = 0; c < cfg.colors; c++) {
    for (let u = 0; u < CAPACITY; u++) units.push(PALETTE[c]);
  }
  for (let i = units.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [units[i], units[j]] = [units[j], units[i]];
  }
  const dealt = [];
  for (let c = 0; c < cfg.colors; c++) {
    dealt.push(units.slice(c * CAPACITY, c * CAPACITY + CAPACITY));
  }
  for (let e = 0; e < cfg.empty; e++) dealt.push([]);
  return dealt;
}

function serialize(state) {
  return state.map(t => t.join(",")).join("|");
}

function isSolvedState(state) {
  return state.every(t => t.length === 0 || (t.length === CAPACITY && t.every(c => c === t[0])));
}

// Vérifie la solvabilité par recherche en largeur bornée (état = configuration des tubes).
function isSolvable(initialState, maxStates = 9000) {
  const startKey = serialize(initialState);
  if (isSolvedState(initialState)) return true;
  const visited = new Set([startKey]);
  let queue = [initialState];
  let explored = 0;

  while (queue.length > 0 && explored < maxStates) {
    const next = [];
    for (const state of queue) {
      explored++;
      if (explored > maxStates) break;
      for (let i = 0; i < state.length; i++) {
        if (state[i].length === 0) continue;
        for (let j = 0; j < state.length; j++) {
          if (i === j) continue;
          const src = state[i], dst = state[j];
          const topColor = src[src.length - 1];
          if (dst.length > 0 && dst[dst.length - 1] !== topColor) continue;
          if (dst.length >= CAPACITY) continue;
          const cloned = state.map(t => [...t]);
          const csrc = cloned[i], cdst = cloned[j];
          const ctop = csrc[csrc.length - 1];
          let count = 0;
          while (count < csrc.length && csrc[csrc.length - 1 - count] === ctop) count++;
          const moveCount = Math.min(count, CAPACITY - cdst.length);
          for (let m = 0; m < moveCount; m++) cdst.push(csrc.pop());

          const key = serialize(cloned);
          if (visited.has(key)) continue;
          if (isSolvedState(cloned)) return true;
          visited.add(key);
          next.push(cloned);
        }
      }
    }
    queue = next;
  }
  return false;
}

function generatePuzzle() {
  let attempt = 0;
  let candidate = dealRandom();
  while (attempt < 8 && !isSolvable(candidate)) {
    attempt++;
    candidate = dealRandom();
  }
  tubes = candidate;
}

function isSolved() {
  return tubes.every(t => t.length === 0 || (t.length === CAPACITY && t.every(c => c === t[0])));
}

function updateHud() {
  document.getElementById("movesVal").textContent = moves;
  document.getElementById("bestVal").textContent = best === Infinity ? "–" : best;
}

function render() {
  const wrap = document.getElementById("tubesWrap");
  wrap.innerHTML = "";
  tubes.forEach((tube, i) => {
    const tubeEl = document.createElement("div");
    tubeEl.className = "tube";
    if (i === selected) tubeEl.classList.add("selected");
    for (let s = CAPACITY - 1; s >= 0; s--) {
      const slot = document.createElement("div");
      slot.className = "tube-slot";
      if (tube[s]) slot.style.background = tube[s];
      tubeEl.appendChild(slot);
    }
    tubeEl.onclick = () => handleTubeClick(i);
    wrap.appendChild(tubeEl);
  });
}

function handleTubeClick(i) {
  if (over) return;
  if (selected === -1) {
    if (tubes[i].length === 0) return;
    selected = i;
    render();
    return;
  }
  if (selected === i) {
    selected = -1;
    render();
    return;
  }
  if (pourAllowed(selected, i)) {
    doPour(selected, i);
    moves++;
    selected = -1;
    updateHud();
    render();
    if (window.CubySfx) CubySfx.place();
    if (isSolved()) {
      endGame();
    }
  } else {
    if (window.CubySfx) CubySfx.fail();
    selected = tubes[i].length > 0 ? i : -1;
    render();
  }
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  best = Math.min(moves, best);
  localStorage.setItem(`bestWaterSort_${diffKey}`, best);

  document.getElementById("statMoves").textContent = moves;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "water-sort", Math.max(500 - moves * 5, 10));
}

function startGame(level) {
  diffKey = level;
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  best = Number(localStorage.getItem(`bestWaterSort_${diffKey}`)) || Infinity;
  moves = 0;
  selected = -1;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  document.getElementById("resultModal").hidden = true;

  // La génération (avec vérification de solvabilité) peut prendre jusqu'à
  // ~0.5s sur les grandes grilles : on affiche un indicateur pour que ça ne
  // paraisse pas figé, et on laisse le temps au navigateur de l'afficher
  // avant de lancer le calcul bloquant.
  const wrap = document.getElementById("tubesWrap");
  wrap.innerHTML = `<p class="loading-text">${T[lang].loading}</p>`;

  setTimeout(() => {
    generatePuzzle();
    updateHud();
    render();
  }, 30);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("newGameBtn").onclick = () => startGame(diffKey);
document.getElementById("replayBtn").onclick = () => {
  document.getElementById("resultModal").hidden = true;
  startGame(diffKey);
};

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

// Hook de test/debug (aucun impact en jeu normal).
window.__waterSortDebug = {
  handleTubeClick, startGame, isSolved,
  getState: () => ({ tubes: tubes.map(t => [...t]), moves, over, selected, diffKey })
};

applyLang();
