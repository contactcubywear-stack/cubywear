import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    hint: "Glisse ton doigt d'un rond à l'autre de la même couleur, sans croiser les autres tuyaux",
    win: "🎉 Terminé !", newGame: "Nouvelle grille",
    moves: "Tuyaux", time: "Temps", best: "Meilleur temps",
    finalTime: "Temps"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    hint: "Drag from one dot to the matching dot without crossing other pipes",
    win: "🎉 Done!", newGame: "New puzzle",
    moves: "Pipes", time: "Time", best: "Best time",
    finalTime: "Time"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const PALETTE = ["#e74c3c", "#5AC8FA", "#2ecc71", "#E8AA42", "#9B59B6", "#F5D30F", "#FF6FA5", "#1F4690", "#7ED957", "#B0BEC5"];

const DIFFICULTIES = {
  facile: { size: 5, colors: 5 },
  moyen: { size: 6, colors: 6 },
  difficile: { size: 7, colors: 8 },
  impossible: { size: 8, colors: 9 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
let size = 5;
let endpoints = []; // { color, cells: [{r,c}, {r,c}] }
let paths = []; // per color index: array of {r,c}
let occupied = []; // size x size, -1 or color index
let drawing = false;
let activeColor = -1;
let over = false;
let startTime = 0;
let timerInterval = null;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let cellSize = 0;

function neighbors(cell) {
  return [
    { r: cell.r - 1, c: cell.c },
    { r: cell.r + 1, c: cell.c },
    { r: cell.r, c: cell.c - 1 },
    { r: cell.r, c: cell.c + 1 }
  ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size);
}

function isAdjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

function sameCell(a, b) {
  return a.r === b.r && a.c === b.c;
}

function generateLevel() {
  let attempt = 0;
  while (attempt < 15) {
    attempt++;
    const genGrid = Array.from({ length: size }, () => Array(size).fill(-1));
    const eps = [];
    let colorIdx = 0;

    for (let c = 0; c < cfg.colors; c++) {
      let placed = false;
      for (let t = 0; t < 60 && !placed; t++) {
        const start = { r: Math.floor(Math.random() * size), c: Math.floor(Math.random() * size) };
        if (genGrid[start.r][start.c] !== -1) continue;
        const targetLen = 3 + Math.floor(Math.random() * (size));
        const path = [start];
        genGrid[start.r][start.c] = colorIdx;
        let stuck = false;
        while (path.length < targetLen && !stuck) {
          const last = path[path.length - 1];
          const opts = neighbors(last).filter(n => genGrid[n.r][n.c] === -1);
          if (opts.length === 0) { stuck = true; break; }
          const next = opts[Math.floor(Math.random() * opts.length)];
          genGrid[next.r][next.c] = colorIdx;
          path.push(next);
        }
        if (path.length >= 2) {
          eps.push({ color: colorIdx, cells: [path[0], path[path.length - 1]] });
          colorIdx++;
          placed = true;
        } else {
          genGrid[start.r][start.c] = -1;
        }
      }
    }

    if (eps.length >= Math.max(3, cfg.colors - 2)) {
      endpoints = eps;
      return;
    }
  }
  // Filet de sécurité : au moins une grille minimale garantie.
  endpoints = [];
  size = 4;
  endpoints.push({ color: 0, cells: [{ r: 0, c: 0 }, { r: 0, c: 3 }] });
  endpoints.push({ color: 1, cells: [{ r: 3, c: 0 }, { r: 3, c: 3 }] });
}

function resetPaths() {
  paths = endpoints.map(ep => []);
  occupied = Array.from({ length: size }, () => Array(size).fill(-1));
  endpoints.forEach((ep, i) => {
    ep.cells.forEach(cell => (occupied[cell.r][cell.c] = i));
  });
}

function isComplete(colorIdx) {
  const path = paths[colorIdx];
  if (path.length < 2) return false;
  const ep = endpoints[colorIdx];
  const first = path[0], last = path[path.length - 1];
  return (sameCell(first, ep.cells[0]) && sameCell(last, ep.cells[1])) ||
    (sameCell(first, ep.cells[1]) && sameCell(last, ep.cells[0]));
}

function allComplete() {
  return endpoints.every((_, i) => isComplete(i));
}

function cellFromPoint(x, y) {
  const c = Math.floor(x / cellSize);
  const r = Math.floor(y / cellSize);
  if (r < 0 || r >= size || c < 0 || c >= size) return null;
  return { r, c };
}

function clearColorPath(colorIdx) {
  paths[colorIdx].forEach(cell => {
    if (occupied[cell.r][cell.c] === colorIdx) occupied[cell.r][cell.c] = -1;
  });
  paths[colorIdx] = [];
  endpoints[colorIdx].cells.forEach(cell => (occupied[cell.r][cell.c] = colorIdx));
}

function endpointColorAt(cell) {
  for (let i = 0; i < endpoints.length; i++) {
    if (endpoints[i].cells.some(c => sameCell(c, cell))) return i;
  }
  return -1;
}

function handleStart(x, y) {
  if (over) return;
  const cell = cellFromPoint(x, y);
  if (!cell) return;
  const colorIdx = endpointColorAt(cell);
  if (colorIdx === -1) return;

  clearColorPath(colorIdx);
  activeColor = colorIdx;
  drawing = true;
  paths[colorIdx] = [cell];
  render();
}

function handleMove(x, y) {
  if (!drawing || activeColor === -1) return;
  const cell = cellFromPoint(x, y);
  if (!cell) return;
  const path = paths[activeColor];
  const last = path[path.length - 1];
  if (sameCell(cell, last)) return;

  if (path.length >= 2 && sameCell(cell, path[path.length - 2])) {
    occupied[last.r][last.c] = endpointColorAt(last) === activeColor ? activeColor : -1;
    path.pop();
    render();
    return;
  }

  if (!isAdjacent(last, cell)) return;

  const occ = occupied[cell.r][cell.c];
  const epColor = endpointColorAt(cell);

  if (occ !== -1 && occ !== activeColor) return;
  if (epColor !== -1 && epColor !== activeColor) return;

  if (occ === activeColor && !sameCell(cell, endpoints[activeColor].cells[0]) && !sameCell(cell, endpoints[activeColor].cells[1])) {
    return;
  }

  path.push(cell);
  occupied[cell.r][cell.c] = activeColor;
  if (window.CubySfx) CubySfx.tap();
  render();

  if (isComplete(activeColor)) {
    if (window.CubySfx) CubySfx.match();
    drawing = false;
    activeColor = -1;
    if (allComplete()) endGame();
  }
}

function handleEnd() {
  drawing = false;
  activeColor = -1;
}

function render() {
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const theme = getComputedStyle(document.documentElement);
  const gridColor = theme.getPropertyValue("--bg-card").trim() || "#231955";
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1 * dpr;
  for (let i = 0; i <= size; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, size * cellSize);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cellSize);
    ctx.lineTo(size * cellSize, i * cellSize);
    ctx.stroke();
  }

  paths.forEach((path, i) => {
    if (path.length < 2) return;
    ctx.strokeStyle = PALETTE[i];
    ctx.lineWidth = cellSize * 0.34;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    path.forEach((cell, idx) => {
      const x = cell.c * cellSize + cellSize / 2;
      const y = cell.r * cellSize + cellSize / 2;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  endpoints.forEach((ep, i) => {
    ctx.fillStyle = PALETTE[i];
    ep.cells.forEach(cell => {
      const x = cell.c * cellSize + cellSize / 2;
      const y = cell.r * cellSize + cellSize / 2;
      ctx.beginPath();
      ctx.arc(x, y, cellSize * 0.32, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  document.getElementById("movesVal").textContent = `${endpoints.filter((_, i) => isComplete(i)).length}/${endpoints.length}`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.width;
  cellSize = canvas.width / size;
  render();
}

function updateTimer() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const m = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");
  document.getElementById("timeVal").textContent = `${m}:${s}`;
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) CubySfx.win();

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const bestKey = `bestFlowFree_${diffKey}`;
  const best = Math.min(elapsed, Number(localStorage.getItem(bestKey)) || Infinity);
  localStorage.setItem(bestKey, best);

  document.getElementById("statTime").textContent = document.getElementById("timeVal").textContent;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "flow-free", Math.max(600 - elapsed, 10));
}

function startGame(level) {
  diffKey = level;
  cfg = DIFFICULTIES[level] || DIFFICULTIES.moyen;
  size = cfg.size;
  over = false;
  generateLevel();
  resetPaths();
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 500);
  updateTimer();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  requestAnimationFrame(() => {
    resizeCanvas();
  });
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("newGameBtn").onclick = () => startGame(diffKey);
document.getElementById("replayBtn").onclick = () => {
  document.getElementById("resultModal").hidden = true;
  startGame(diffKey);
};

canvas.addEventListener("mousedown", e => {
  const rect = canvas.getBoundingClientRect();
  handleStart(e.clientX - rect.left, e.clientY - rect.top);
});
canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  handleMove(e.clientX - rect.left, e.clientY - rect.top);
});
window.addEventListener("mouseup", handleEnd);

canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  handleStart(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: false });
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const t = e.touches[0];
  handleMove(t.clientX - rect.left, t.clientY - rect.top);
}, { passive: false });
canvas.addEventListener("touchend", e => {
  e.preventDefault();
  handleEnd();
}, { passive: false });

window.addEventListener("resize", () => {
  if (!document.getElementById("gameArea").hidden) resizeCanvas();
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

// Hook de test/debug (aucun impact en jeu normal).
window.__flowFreeDebug = {
  handleStart, handleMove, handleEnd, startGame, allComplete,
  getState: () => ({ size, endpoints, paths, over, diffKey })
};

applyLang();
