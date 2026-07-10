import { saveScore } from "../api.js";

// Jaune, Bleu pâle, Rose, Violet, Orange
const COLORS = ["#F5D30F", "#5AC8FA", "#FF6FA5", "#9B59B6", "#F2811D"];
const CODE_LENGTH = 4;
const MAX_TRIES = 10;

const secret = Array.from({ length: CODE_LENGTH }, () => Math.floor(Math.random() * COLORS.length));
let guess = Array(CODE_LENGTH).fill(null);
let triesLeft = MAX_TRIES;
let over = false;

const paletteEl = document.getElementById("palette");
const guessEl = document.getElementById("currentGuess");
const historyEl = document.getElementById("history");
const triesEl = document.getElementById("triesLeft");

COLORS.forEach((color, i) => {
  const peg = document.createElement("div");
  peg.className = "peg";
  peg.style.background = color;
  peg.onclick = () => fillNextSlot(i);
  paletteEl.appendChild(peg);
});

function renderGuess() {
  guessEl.innerHTML = "";
  guess.forEach((colorIndex, i) => {
    const slot = document.createElement("div");
    slot.className = "slot" + (colorIndex !== null ? " filled" : "");
    if (colorIndex !== null) {
      slot.style.background = COLORS[colorIndex];
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
}

function computeFeedback(attempt) {
  const secretCopy = [...secret];
  const guessCopy = [...attempt];
  let black = 0;

  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      black++;
      secretCopy[i] = guessCopy[i] = null;
    }
  }

  let white = 0;
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessCopy[i] === null) continue;
    const found = secretCopy.indexOf(guessCopy[i]);
    if (found !== -1) {
      white++;
      secretCopy[found] = null;
    }
  }

  return { black, white };
}

function addHistoryRow(attempt, feedback) {
  const row = document.createElement("div");
  row.className = "history-row";

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
  const wrong = CODE_LENGTH - feedback.black - feedback.white;
  for (let i = 0; i < feedback.black; i++) {
    const dot = document.createElement("span");
    dot.className = "green";
    fb.appendChild(dot);
  }
  for (let i = 0; i < feedback.white; i++) {
    const dot = document.createElement("span");
    dot.className = "gold";
    fb.appendChild(dot);
  }
  for (let i = 0; i < wrong; i++) {
    const dot = document.createElement("span");
    dot.className = "red";
    fb.appendChild(dot);
  }

  row.appendChild(pegs);
  row.appendChild(fb);
  historyEl.appendChild(row);
}

async function submitGuess() {
  if (over || guess.includes(null)) return;

  const feedback = computeFeedback(guess);
  addHistoryRow(guess, feedback);
  triesLeft--;
  triesEl.textContent = `Essais restants : ${triesLeft}`;

  if (feedback.black === CODE_LENGTH) {
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
  document.getElementById("resultTitle").textContent =
    result === "win" ? "🎉 Bravo, tu as trouvé !" : "😕 Perdu !";

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
  }

  document.getElementById("resultModal").hidden = false;
}

document.getElementById("replayBtn").onclick = () => location.reload();

document.getElementById("clearBtn").onclick = () => {
  guess = Array(CODE_LENGTH).fill(null);
  renderGuess();
};

document.getElementById("submitBtn").onclick = submitGuess;

renderGuess();
