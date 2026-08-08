import { saveScore } from "../api.js";

const WORDS = [
  "CHAT", "VELO", "LOUP", "MIEL", "FOUR", "JOUR", "BLEU", "ROSE", "MAIN", "PAIN",
  "VENT", "MURS", "RIRE", "LAIT", "TOIT", "NOIX", "FEUX", "BOIS", "MERS", "PORC"
];
const MAX_TRIES = 5;
const WORD_LENGTH = 4;
const KEYBOARD_ROWS = ["AZERTYUIOP", "QSDFGHJKLM", "WXCVBN"];

const gridEl = document.getElementById("grid");
const keyboardEl = document.getElementById("keyboard");
const hudEl = document.getElementById("hud");

const secret = WORDS[Math.floor(Math.random() * WORDS.length)];
let tries = 0;
let over = false;
let currentGuess = "";
let rowCells = [];
const keyButtons = {};

for (let r = 0; r < MAX_TRIES; r++) {
  const row = [];
  for (let c = 0; c < WORD_LENGTH; c++) {
    const cell = document.createElement("div");
    cell.className = "wordle-cell";
    gridEl.appendChild(cell);
    row.push(cell);
  }
  rowCells.push(row);
}

KEYBOARD_ROWS.forEach(rowLetters => {
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

function updateHud() {
  hudEl.textContent = `Essai ${tries + 1}/${MAX_TRIES}`;
}

function renderCurrentRow() {
  const row = rowCells[tries];
  for (let i = 0; i < WORD_LENGTH; i++) {
    row[i].textContent = currentGuess[i] || "";
  }
}

function typeLetter(letter) {
  if (over || currentGuess.length >= WORD_LENGTH) return;
  currentGuess += letter;
  renderCurrentRow();
}

function backspace() {
  if (over) return;
  currentGuess = currentGuess.slice(0, -1);
  renderCurrentRow();
}

function computeFeedback(guess) {
  const secretArr = [...secret];
  const result = new Array(WORD_LENGTH).fill(null);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === secretArr[i]) {
      result[i] = "correct";
      secretArr[i] = null;
    }
  }
  for (let i = 0; i < WORD_LENGTH; i++) {
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
  if (over || currentGuess.length !== WORD_LENGTH) return;

  const feedback = computeFeedback(currentGuess);
  const row = rowCells[tries];
  feedback.forEach((status, i) => {
    row[i].classList.add(status);
  });
  updateKeyboard(currentGuess, feedback);

  const won = feedback.every(f => f === "correct");
  tries++;

  if (won) {
    endGame("win");
    return;
  }
  if (tries >= MAX_TRIES) {
    endGame("lose");
    return;
  }

  currentGuess = "";
  updateHud();
}

async function endGame(result) {
  over = true;
  document.getElementById("resultTitle").textContent =
    result === "win" ? "🎉 Bravo, tu as trouvé !" : "😕 Perdu !";
  document.getElementById("resultWord").textContent = `Le mot était : ${secret}`;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mini-wordle", result === "win" ? Math.max(30 - tries * 5, 5) : 0);
}

document.getElementById("replayBtn").onclick = () => location.reload();

window.addEventListener("keydown", e => {
  if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toUpperCase());
  if (e.key === "Enter") submitGuess();
  if (e.key === "Backspace") backspace();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__miniWordleDebug = {
  typeLetter, submitGuess, backspace,
  getState: () => ({ tries, over, currentGuess, secret })
};

updateHud();
