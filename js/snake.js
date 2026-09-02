import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", changeLevel: "Changer niveau", replay: "Rejouer",
    lost: "💥 Perdu !", finalScore: "Score final", best: "Meilleur score"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", changeLevel: "Change level", replay: "Replay",
    lost: "💥 Lost!", finalScore: "Final score", best: "Best score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { grid: 12, base: 200, min: 100, decay: 3 },
  moyen:      { grid: 15, base: 180, min: 70,  decay: 4 },
  difficile:  { grid: 18, base: 150, min: 55,  decay: 4 },
  impossible: { grid: 20, base: 120, min: 45,  decay: 5 }
};

let GRID = 15;
let cfg = DIFFICULTIES.moyen;

const boardEl = document.getElementById("board");

const foodEl = document.createElement("div");
foodEl.className = "food";
boardEl.appendChild(foodEl);

let segmentEls = [];

function cellPct(v) {
  return (v / GRID) * 100;
}

function syncSegments() {
  while (segmentEls.length < snake.length) {
    const div = document.createElement("div");
    div.className = "segment";
    boardEl.insertBefore(div, foodEl);
    segmentEls.push(div);
  }
  while (segmentEls.length > snake.length) {
    segmentEls.pop().remove();
  }
}

let snake, dir, nextDir, food, score, best, over, tickHandle, tickDuration, pendingGrowth;

function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  const golden = Math.random() < 0.2;
  food = { ...pos, golden };
  foodEl.classList.toggle("golden", golden);
}

function render() {
  syncSegments();
  snake.forEach((s, i) => {
    const el = segmentEls[i];
    el.className = "segment " + (i === 0 ? "head" : "body");
    el.style.transitionDuration = `${tickDuration}ms`;
    el.style.left = `${cellPct(s.x)}%`;
    el.style.top = `${cellPct(s.y)}%`;
  });
  foodEl.style.left = `${cellPct(food.x)}%`;
  foodEl.style.top = `${cellPct(food.y)}%`;
}

function speedForScore() {
  return Math.max(cfg.base - score * cfg.decay, cfg.min);
}

function scheduleTick() {
  clearInterval(tickHandle);
  tickDuration = speedForScore();
  tickHandle = setInterval(tick, tickDuration);
}

function updateHud() {
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("bestVal").textContent = best;
}

function tick() {
  if (over) return;
  dir = nextDir;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  const hitsWall = head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID;
  const hitsSelf = snake.some(s => s.x === head.x && s.y === head.y);
  if (hitsWall || hitsSelf) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += food.golden ? 3 : 1;
    if (food.golden) pendingGrowth += 1;
    if (window.CubySfx) (food.golden ? CubySfx.coin() : CubySfx.match());
    updateHud();
    placeFood();
    scheduleTick();
  } else if (pendingGrowth > 0) {
    pendingGrowth--;
  } else {
    snake.pop();
  }

  render();
}

function setDir(x, y) {
  if (over) return;
  if (dir.x === -x && dir.y === -y) return;
  nextDir = { x, y };
}

async function endGame() {
  over = true;
  clearInterval(tickHandle);
  if (window.CubySfx) CubySfx.hit();

  if (score > best) {
    best = score;
    localStorage.setItem("bestSnake", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statBest").textContent = best;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "snake", score);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  GRID = cfg.grid;
  boardEl.style.setProperty("--grid", GRID);

  const mid = Math.floor(GRID / 2);
  snake = [{ x: mid, y: mid }, { x: mid - 1, y: mid }, { x: mid - 2, y: mid }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  best = Number(localStorage.getItem("bestSnake") || 0);
  pendingGrowth = 0;
  over = false;
  updateHud();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  placeFood();
  tickDuration = speedForScore();
  render();
  segmentEls.forEach(el => { el.style.transitionDuration = "0ms"; });
  requestAnimationFrame(() => scheduleTick());
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("btnUp").onclick = () => setDir(0, -1);
document.getElementById("btnDown").onclick = () => setDir(0, 1);
document.getElementById("btnLeft").onclick = () => setDir(-1, 0);
document.getElementById("btnRight").onclick = () => setDir(1, 0);

const KEY_DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
window.addEventListener("keydown", e => {
  const d = KEY_DIRS[e.key];
  if (!d) return;
  e.preventDefault();
  setDir(d[0], d[1]);
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
    setDir(dx > 0 ? 1 : -1, 0);
  } else {
    setDir(0, dy > 0 ? 1 : -1);
  }
}, { passive: true });

document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("changeDiffBtn").onclick = () => location.reload();

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
window.__snakeDebug = { tick, setDir, getSnake: () => snake, getFood: () => food };

applyLang();
