import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    clear: "Effacer", submit: "Valider",
    legendGreen: "bonne couleur, bonne place",
    legendGold: "bonne couleur, mauvaise place",
    legendRed: "couleur absente",
    legendNote: "(chaque point correspond à la pastille du même rang dans ta tentative)",
    triesLeft: n => `Essais restants : ${n}`,
    winTitle: "🎉 Bravo, tu as trouvé !", loseTitle: "😕 Perdu !"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    clear: "Clear", submit: "Submit",
    legendGreen: "right color, right spot",
    legendGold: "right color, wrong spot",
    legendRed: "color not in the code",
    legendNote: "(each dot matches the peg at the same rank in your guess)",
    triesLeft: n => `Tries left: ${n}`,
    winTitle: "🎉 You found it!", loseTitle: "😕 You lost!"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Jaune, Bleu pâle, Rose, Violet, Orange, Vert, Rouge, Blanc
const ALL_COLORS = ["#F5D30F", "#5AC8FA", "#FF6FA5", "#9B59B6", "#F2811D", "#2ECC71", "#E74C3C", "#ECF0F1"];

const DIFFICULTIES = {
  facile:     { length: 4, colors: 4, tries: 12 },
  moyen:      { length: 4, colors: 5, tries: 10 },
  difficile:  { length: 5, colors: 6, tries: 10 },
  impossible: { length: 5, colors: 8, tries: 8 }
};

let CODE_LENGTH = 4;
let COLORS = ALL_COLORS.slice(0, 5);
let MAX_TRIES = 10;

let secret = [];
let guess = [];
let triesLeft = MAX_TRIES;
let over = false;

const paletteEl = document.getElementById("palette");
const guessEl = document.getElementById("currentGuess");
const historyEl = document.getElementById("history");
const triesEl = document.getElementById("triesLeft");

function buildPalette() {
  paletteEl.innerHTML = "";
  COLORS.forEach((color, i) => {
    const peg = document.createElement("div");
    peg.className = "peg";
    peg.style.background = color;
    peg.onclick = () => fillNextSlot(i);
    paletteEl.appendChild(peg);
  });
}

function renderGuess() {
  guessEl.innerHTML = "";
  guess.forEach((colorIndex, i) => {
    const slot = document.createElement("div");
    slot.className = "slot" + (colorIndex !== null ? " filled" : "");
    if (colorIndex !== null) {
      slot.style.background = COLORS[colorIndex];
      slot.classList.add("pop-in");
      slot.onclick = () => {
        guess[i] = null;
        renderGuess();
      };
    }
    guessEl.appendChild(slot);
  });
}

function fillNextSlot(colorIndex) {
  if (over) return;
  const emptyIndex = guess.indexOf(null);
  if (emptyIndex === -1) return;
  guess[emptyIndex] = colorIndex;
  renderGuess();
  if (window.CubySfx) CubySfx.tap();
}

function computeFeedback(attempt) {
  const secretCopy = [...secret];
  const result = new Array(CODE_LENGTH).fill(null);

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (attempt[i] === secretCopy[i]) {
      result[i] = "green";
      secretCopy[i] = null;
    }
  }

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (result[i] !== null) continue;
    const found = secretCopy.indexOf(attempt[i]);
    if (found !== -1) {
      result[i] = "gold";
      secretCopy[found] = null;
    } else {
      result[i] = "red";
    }
  }

  return result;
}

function addHistoryRow(attempt, feedback) {
  document.querySelectorAll(".history-row.latest").forEach(el => el.classList.remove("latest"));

  const row = document.createElement("div");
  row.className = "history-row latest";

  const pegs = document.createElement("div");
  pegs.className = "history-pegs";
  attempt.forEach(colorIndex => {
    const peg = document.createElement("div");
    peg.className = "peg";
    peg.style.background = COLORS[colorIndex];
    pegs.appendChild(peg);
  });

  const fb = document.createElement("div");
  fb.className = "feedback";
  feedback.forEach(status => {
    const dot = document.createElement("span");
    dot.className = status;
    fb.appendChild(dot);
  });

  row.appendChild(pegs);
  row.appendChild(fb);
  historyEl.appendChild(row);
  row.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function submitGuess() {
  if (over || guess.includes(null)) return;

  const feedback = computeFeedback(guess);
  addHistoryRow(guess, feedback);
  triesLeft--;
  triesEl.textContent = T[lang].triesLeft(triesLeft);

  const allGreen = feedback.every(status => status === "green");
  if (window.CubySfx) CubySfx.tap();

  if (allGreen) {
    over = true;
    endGame("win");
    await saveScore("CW-BLK-1-0001", "mastermind", (triesLeft + 1) * 10);
    return;
  }

  if (triesLeft === 0) {
    over = true;
    endGame("lose");
    await saveScore("CW-BLK-1-0001", "mastermind", 0);
    return;
  }

  guess = Array(CODE_LENGTH).fill(null);
  renderGuess();
}

function endGame(result) {
  if (window.CubySfx) (result === "win" ? CubySfx.win() : CubySfx.lose());

  document.getElementById("resultTitle").textContent =
    result === "win" ? T[lang].winTitle : T[lang].loseTitle;

  const revealEl = document.getElementById("revealCombo");
  if (result === "lose") {
    revealEl.innerHTML = "";
    secret.forEach(colorIndex => {
      const peg = document.createElement("div");
      peg.className = "peg";
      peg.style.background = COLORS[colorIndex];
      revealEl.appendChild(peg);
    });
    revealEl.hidden = false;
  } else {
    revealEl.hidden = true;
  }

  document.getElementById("resultModal").hidden = false;
}

function startGame(difficulty) {
  const cfg = DIFFICULTIES[difficulty];
  CODE_LENGTH = cfg.length;
  COLORS = ALL_COLORS.slice(0, cfg.colors);
  MAX_TRIES = cfg.tries;

  secret = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
  guess = Array(CODE_LENGTH).fill(null);
  triesLeft = MAX_TRIES;
  over = false;

  triesEl.textContent = T[lang].triesLeft(triesLeft);
  historyEl.innerHTML = "";

  buildPalette();
  renderGuess();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

document.getElementById("clearBtn").onclick = () => {
  guess = Array(CODE_LENGTH).fill(null);
  renderGuess();
};

document.getElementById("submitBtn").onclick = submitGuess;

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  document.getElementById("langToggle").textContent = lang.toUpperCase();
  if (!document.getElementById("gameArea").hidden) {
    triesEl.textContent = T[lang].triesLeft(triesLeft);
  }
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

applyLang();
