import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    winTitle: "🎉 Bravo, tu as trouvé !", loseTitle: "😕 Perdu !",
    wordWas: w => `Le mot était : ${w}`,
    tries: (n, total) => `${n}/${total}`
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    winTitle: "🎉 You found it!", loseTitle: "😕 Lost!",
    wordWas: w => `The word was: ${w}`,
    tries: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const WORDS_FR = {
  4: ["CHAT", "VELO", "LOUP", "MIEL", "FOUR", "JOUR", "BLEU", "ROSE", "MAIN", "PAIN", "VENT", "MURS", "RIRE", "LAIT", "TOIT", "NOIX", "FEUX", "BOIS", "MERS", "PORC"],
  5: ["TABLE", "CHIEN", "PORTE", "LIVRE", "PLAGE", "VERRE", "ARBRE", "FLEUR", "POMME", "GLACE", "MONDE", "DANSE", "FORCE", "CHAMP", "PLUME", "TIGRE", "SOEUR", "COEUR", "JAUNE", "ROUGE"],
  6: ["GATEAU", "BATEAU", "OISEAU", "CADEAU", "BUREAU", "RIDEAU", "POULET", "MOUTON", "ORANGE", "BANANE", "VOYAGE", "MARCHE", "PLANTE", "VOISIN", "ANIMAL"]
};

const WORDS_EN = {
  4: ["WOLF", "CAKE", "DAWN", "BLUE", "ROSE", "HAND", "RAIN", "MILK", "ROOF", "NOSE", "FIRE", "WOOD", "PORK", "DUCK", "BOAT", "LAMP", "DESK", "BOOK", "FISH", "GOLD"],
  5: ["TABLE", "CHAIR", "GLASS", "TIGER", "HEART", "WORLD", "DANCE", "FORCE", "FIELD", "FLOOR", "BREAD", "HOUSE", "MOUSE", "STONE", "CLOUD", "SMILE", "BEACH", "RIVER"],
  6: ["GARDEN", "BASKET", "ORANGE", "BANANA", "PLANET", "ANIMAL", "MARKET", "BRIDGE", "CASTLE", "FLOWER", "SILVER", "WINTER", "SUMMER", "YELLOW", "PURPLE"]
};

const KEYBOARD_FR = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];
const KEYBOARD_EN = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const DIFFICULTIES = {
  facile:     { length: 4, tries: 6 },
  moyen:      { length: 4, tries: 5 },
  difficile:  { length: 5, tries: 6 },
  impossible: { length: 6, tries: 6 }
};

let cfg = DIFFICULTIES.moyen;
let difficulty = "moyen";

const gridEl = document.getElementById("grid");
const keyboardEl = document.getElementById("keyboard");

let secret = "";
let tries = 0;
let over = false;
let currentGuess = "";
let rowCells = [];
const keyButtons = {};

function buildGrid() {
  gridEl.innerHTML = "";
  gridEl.style.gridTemplateColumns = `repeat(${cfg.length}, 1fr)`;
  rowCells = [];
  for (let r = 0; r < cfg.tries; r++) {
    const row = [];
    for (let c = 0; c < cfg.length; c++) {
      const cell = document.createElement("div");
      cell.className = "wordle-cell";
      gridEl.appendChild(cell);
      row.push(cell);
    }
    rowCells.push(row);
  }
}

function buildKeyboard() {
  keyboardEl.innerHTML = "";
  for (const key in keyButtons) delete keyButtons[key];

  const rows = lang === "en" ? KEYBOARD_EN : KEYBOARD_FR;
  rows.forEach(rowLetters => {
    [...rowLetters].forEach(letter => {
      const btn = document.createElement("button");
      btn.className = "key";
      btn.textContent = letter;
      btn.onclick = () => typeLetter(letter);
      keyboardEl.appendChild(btn);
      keyButtons[letter] = btn;
    });
  });

  const enterBtn = document.createElement("button");
  enterBtn.className = "key wide";
  enterBtn.textContent = "OK";
  enterBtn.onclick = submitGuess;
  keyboardEl.appendChild(enterBtn);

  const backBtn = document.createElement("button");
  backBtn.className = "key wide";
  backBtn.textContent = "⌫";
  backBtn.onclick = backspace;
  keyboardEl.appendChild(backBtn);
}

function updateHud() {
  document.getElementById("triesVal").textContent = T[lang].tries(tries + 1, cfg.tries);
}

function renderCurrentRow() {
  const row = rowCells[tries];
  for (let i = 0; i < cfg.length; i++) {
    const wasEmpty = row[i].textContent === "";
    row[i].textContent = currentGuess[i] || "";
    if (currentGuess[i] && wasEmpty) row[i].classList.add("pop");
  }
}

function typeLetter(letter) {
  if (over || currentGuess.length >= cfg.length) return;
  currentGuess += letter;
  renderCurrentRow();
  if (window.CubySfx) CubySfx.tap();
}

function backspace() {
  if (over) return;
  currentGuess = currentGuess.slice(0, -1);
  renderCurrentRow();
}

function computeFeedback(guess) {
  const secretArr = [...secret];
  const result = new Array(cfg.length).fill(null);

  for (let i = 0; i < cfg.length; i++) {
    if (guess[i] === secretArr[i]) {
      result[i] = "correct";
      secretArr[i] = null;
    }
  }
  for (let i = 0; i < cfg.length; i++) {
    if (result[i] !== null) continue;
    const found = secretArr.indexOf(guess[i]);
    if (found !== -1) {
      result[i] = "present";
      secretArr[found] = null;
    } else {
      result[i] = "absent";
    }
  }
  return result;
}

const STATUS_RANK = { absent: 0, present: 1, correct: 2 };

function updateKeyboard(guess, feedback) {
  guess.split("").forEach((letter, i) => {
    const btn = keyButtons[letter];
    if (!btn) return;
    const currentStatus = btn.dataset.status || "absent";
    if (!btn.dataset.status || STATUS_RANK[feedback[i]] > STATUS_RANK[currentStatus]) {
      btn.dataset.status = feedback[i];
      btn.classList.remove("correct", "present", "absent");
      btn.classList.add(feedback[i]);
    }
  });
}

function submitGuess() {
  if (over || currentGuess.length !== cfg.length) {
    gridEl.classList.add("shake");
    setTimeout(() => gridEl.classList.remove("shake"), 300);
    return;
  }

  const feedback = computeFeedback(currentGuess);
  const row = rowCells[tries];
  feedback.forEach((status, i) => {
    setTimeout(() => {
      row[i].classList.add("flip");
      setTimeout(() => row[i].classList.add(status), 200);
    }, i * 80);
  });
  updateKeyboard(currentGuess, feedback);
  if (window.CubySfx) CubySfx.place();

  const won = feedback.every(f => f === "correct");
  tries++;

  if (won) {
    setTimeout(() => endGame("win"), cfg.length * 80 + 300);
    return;
  }
  if (tries >= cfg.tries) {
    setTimeout(() => endGame("lose"), cfg.length * 80 + 300);
    return;
  }

  currentGuess = "";
  updateHud();
}

async function endGame(result) {
  over = true;
  if (window.CubySfx) (result === "win" ? CubySfx.win() : CubySfx.lose());

  if (result === "win") {
    const bestKey = `bestWordle_${difficulty}`;
    const prevBest = Number(localStorage.getItem(bestKey) || 0);
    if (!prevBest || tries < prevBest) {
      localStorage.setItem(bestKey, tries);
      document.getElementById("bestVal").textContent = tries;
    }
  }

  document.getElementById("resultTitle").textContent =
    result === "win" ? T[lang].winTitle : T[lang].loseTitle;
  document.getElementById("resultWord").textContent = T[lang].wordWas(secret);
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-wordle", result === "win" ? Math.max(30 - tries * 5, 5) : 0);
}

function startGame(diff) {
  difficulty = diff;
  cfg = DIFFICULTIES[diff];
  const bank = lang === "en" ? WORDS_EN : WORDS_FR;
  const pool = bank[cfg.length];
  secret = pool[Math.floor(Math.random() * pool.length)];
  tries = 0;
  over = false;
  currentGuess = "";

  const best = localStorage.getItem(`bestWordle_${diff}`);
  document.getElementById("bestVal").textContent = best || "–";

  buildGrid();
  buildKeyboard();
  updateHud();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();

window.addEventListener("keydown", e => {
  if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toUpperCase());
  if (e.key === "Enter") submitGuess();
  if (e.key === "Backspace") backspace();
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
  if (!document.getElementById("difficultySelect").hidden) return;
  startGame(difficulty);
});

// Hook de test/debug (aucun impact en jeu normal).
window.__miniWordleDebug = {
  typeLetter, submitGuess, backspace,
  getState: () => ({ tries, over, currentGuess, secret })
};

applyLang();
