// --- Traductions ---
const T = {
  fr: {
    levelNames: { facile: "Facile", moyen: "Moyen", difficile: "Difficile", impossible: "Impossible" },
    changeLevel: "Changer niveau",
    home: "Accueil",
    winTitle: "🎉 Bravo, tu as gagné !",
    level: "Niveau",
    moves: "Coups joués",
    timeLeft: "Temps restant",
    score: "Score",
    replay: "Rejouer",
    mainMenu: "Menu principal",
    timeUp: "⏱️ Temps écoulé !",
    outOfTries: "😕 Plus d'essais !",
    triesLeft: n => `Essais : ${n}`,
    combo: n => `Combo x${n} !`
  },
  en: {
    levelNames: { facile: "Easy", moyen: "Medium", difficile: "Hard", impossible: "Impossible" },
    changeLevel: "Change level",
    home: "Home",
    winTitle: "🎉 You won!",
    level: "Level",
    moves: "Moves",
    timeLeft: "Time left",
    score: "Score",
    replay: "Replay",
    mainMenu: "Main menu",
    timeUp: "⏱️ Time's up!",
    outOfTries: "😕 Out of tries!",
    triesLeft: n => `Tries: ${n}`,
    combo: n => `Combo x${n}!`
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
  updateTriesDisplay();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// --- Paramètres ---
const settings = JSON.parse(localStorage.getItem("memorySettings"));

if (!settings) {
  location.href = "memory-select.html";
}

const gridSize = settings.grid;
const maxTries = settings.tries;
const totalTime = settings.time;
let timeLeft = settings.time;

let tries = 0;
let matched = 0;
let score = 0;
let combo = 0;

const baseIcons = [
  "🎮","⭐","🔥","💀","⚡","🎲","🎹","🎧","🎯","🎁",
  "🚀","🧩","🎈","🪄","🔮","🍀","🦄","🍩","🍕","🍔",
  "🍟","🌮","🍎","🍇","🍉","🥑","🐶","🐱","🐵","🦊",
  "🐸","🐧","🦁","🐢","🌟","🌈","☀️","🌙","⚽","🏀",
  "🎾","🏈","🎳","🎱","🚗","✈️","🚁","🛸","⚓","🎸"
];
const needed = (gridSize * gridSize) / 2;
const icons = [...baseIcons].sort(() => Math.random() - 0.5).slice(0, needed);

let cards = [...icons, ...icons];
cards.sort(() => Math.random() - 0.5);

const board = document.getElementById("gameBoard");
board.style.setProperty("--cols", gridSize);

let cardFontSize = "26px";
if (gridSize >= 6) cardFontSize = "20px";
if (gridSize >= 10) cardFontSize = "16px";
if (gridSize >= 15) cardFontSize = "11px";

cards.forEach((icon, index) => {
  const card = document.createElement("div");
  card.classList.add("card");
  card.dataset.icon = icon;
  card.style.animationDelay = `${Math.min(index * 0.02, 0.6)}s`;

  const inner = document.createElement("div");
  inner.className = "card-inner";

  const back = document.createElement("div");
  back.className = "card-face card-back";
  back.textContent = "?";
  back.style.fontSize = cardFontSize;

  const front = document.createElement("div");
  front.className = "card-face card-front";
  front.textContent = icon;
  front.style.fontSize = cardFontSize;

  inner.appendChild(back);
  inner.appendChild(front);
  card.appendChild(inner);

  card.addEventListener("click", () => flipCard(card));
  board.appendChild(card);
});

// --- Timer ---
const timerFillEl = document.getElementById("timerFill");

function renderTimer() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");
  document.getElementById("timer").textContent = `${min}:${sec}`;

  const ratio = Math.max(timeLeft / totalTime, 0);
  timerFillEl.style.width = `${ratio * 100}%`;
  timerFillEl.classList.toggle("warn", ratio <= 0.5 && ratio > 0.2);
  timerFillEl.classList.toggle("danger", ratio <= 0.2);
}

renderTimer();

const timerInterval = setInterval(() => {
  timeLeft--;
  renderTimer();

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    if (window.CubySfx) CubySfx.lose();
    showLoseModal(T[lang].timeUp);
  }
}, 1000);

// --- Essais (coeurs ou texte selon le total) ---
function updateTriesDisplay() {
  const el = document.getElementById("triesHearts");
  const left = maxTries - tries;
  if (maxTries <= 12) {
    el.innerHTML = Array.from({ length: maxTries }, (_, i) =>
      i < left ? "❤️" : "🤍"
    ).join("");
  } else {
    el.textContent = T[lang].triesLeft(left);
  }
}

updateTriesDisplay();

let flipped = [];
let boardLocked = false;

function flipCard(card) {
  if (boardLocked) return;
  if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
  if (flipped.length === 2) return;

  card.classList.add("flipped");
  if (window.CubySfx) CubySfx.flip();
  flipped.push(card);

  if (flipped.length === 2) {
    boardLocked = true;
    setTimeout(checkMatch, 550);
  }
}

function spawnComboPopup(text) {
  const el = document.getElementById("comboPopup");
  el.textContent = text;
  el.hidden = false;
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
  setTimeout(() => { el.hidden = true; }, 900);
}

function spawnConfetti() {
  const colors = ["#E8AA42", "#1F4690", "#FFE5B4", "#3CCF4E", "#FF8B13"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3500);
  }
}

function checkMatch() {
  const [c1, c2] = flipped;

  tries++;
  document.getElementById("info").textContent = tries;
  updateTriesDisplay();

  if (c1.dataset.icon === c2.dataset.icon) {
    c1.classList.add("matched");
    c2.classList.add("matched");
    matched++;
    combo++;

    const bonus = combo >= 2 ? 50 * (combo - 1) : 0;
    score += 100 + bonus;
    document.getElementById("scoreVal").textContent = score;

    if (window.CubySfx) CubySfx.match();
    if (combo >= 2) spawnComboPopup(T[lang].combo(combo));

    if (matched === icons.length) {
      clearInterval(timerInterval);
      if (window.CubySfx) CubySfx.win();
      spawnConfetti();
      showWinModal();
      return;
    }
  } else {
    combo = 0;
    c1.classList.remove("flipped");
    c2.classList.remove("flipped");
    c1.classList.add("wrong");
    c2.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
    setTimeout(() => {
      c1.classList.remove("wrong");
      c2.classList.remove("wrong");
    }, 400);
  }

  flipped = [];
  boardLocked = false;

  if (tries >= maxTries) {
    clearInterval(timerInterval);
    if (window.CubySfx) CubySfx.lose();
    showLoseModal(T[lang].outOfTries);
  }
}

function computeStars() {
  const triesRatio = tries / maxTries;
  const timeRatio = timeLeft / totalTime;
  if (triesRatio <= 0.6 && timeRatio >= 0.4) return 3;
  if (triesRatio <= 0.85) return 2;
  return 1;
}

function showWinModal() {
  const min = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const sec = String(timeLeft % 60).padStart(2, "0");

  document.getElementById("statLevel").textContent = T[lang].levelNames[settings.level] || settings.level;
  document.getElementById("statMoves").textContent = tries;
  document.getElementById("statTime").textContent = `${min}:${sec}`;
  document.getElementById("statScore").textContent = score;

  const stars = computeStars();
  document.getElementById("starsRow").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);

  document.getElementById("winModal").hidden = false;
}

function showLoseModal(reason) {
  document.getElementById("loseTitle").textContent = reason;
  document.getElementById("loseStatLevel").textContent = T[lang].levelNames[settings.level] || settings.level;
  document.getElementById("loseStatMoves").textContent = tries;

  document.getElementById("loseModal").hidden = false;
}

document.getElementById("replayBtn").onclick = () => location.reload();
document.getElementById("loseReplayBtn").onclick = () => location.reload();

applyLang();
