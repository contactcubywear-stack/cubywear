import { saveScore } from "../api.js";

const WORDS = [
  "chat", "chien", "table", "lampe", "soleil", "montagne", "riviere", "fromage",
  "voiture", "avion", "musique", "peinture", "jardin", "cuisine", "fenetre",
  "cahier", "crayon", "bouteille", "chapeau", "gateau"
];

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 20;

const hudEl = document.getElementById("hud");
const answerRow = document.getElementById("answerRow");
const lettersRow = document.getElementById("lettersRow");

let round = 0;
let score = 0;
let over = false;
let word = "";
let letters = [];
let answer = [];
let timeLeft = TIME_LIMIT;
let timerInterval = null;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function updateHud() {
  hudEl.textContent = `Mot ${round + 1}/${TOTAL_ROUNDS} · Temps : ${timeLeft}s`;
}

function renderAnswer() {
  answerRow.innerHTML = "";
  for (let i = 0; i < word.length; i++) {
    const tile = document.createElement("div");
    tile.className = "tile" + (answer[i] ? "" : " empty");
    tile.textContent = answer[i] ? answer[i].char.toUpperCase() : "";
    answerRow.appendChild(tile);
  }
}

function renderLetters() {
  lettersRow.innerHTML = "";
  letters.forEach((entry, i) => {
    const tile = document.createElement("div");
    tile.className = "tile" + (entry.used ? " used" : "");
    tile.textContent = entry.char.toUpperCase();
    tile.onclick = () => pickLetter(i);
    lettersRow.appendChild(tile);
  });
}

function pickLetter(index) {
  if (over) return;
  const entry = letters[index];
  if (entry.used) return;
  entry.used = true;
  answer.push({ char: entry.char, from: index });
  renderLetters();
  renderAnswer();

  if (answer.length === word.length) {
    const guess = answer.map(a => a.char).join("");
    if (guess === word) {
      handleCorrect();
    } else {
      setTimeout(resetAttempt, 500);
    }
  }
}

function resetAttempt() {
  letters.forEach(l => (l.used = false));
  answer = [];
  renderLetters();
  renderAnswer();
}

function handleCorrect() {
  if (over) return;
  clearInterval(timerInterval);
  score++;
  round++;
  startRound();
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  word = WORDS[Math.floor(Math.random() * WORDS.length)];
  letters = shuffle([...word].map(char => ({ char, used: false })));
  answer = [];
  timeLeft = TIME_LIMIT;
  updateHud();
  renderLetters();
  renderAnswer();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHud();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      round++;
      startRound();
    }
  }, 1000);
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "anagrammes", score * 10);
}

document.getElementById("clearBtn").onclick = resetAttempt;
document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__anagrammesDebug = { handleCorrect, resetAttempt, getState: () => ({ round, score, over, word }) };

startRound();
