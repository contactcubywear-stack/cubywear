import { saveScore } from "../api.js";

const WORDS = [
  "chat", "chien", "table", "lampe", "soleil", "montagne", "riviere", "fromage",
  "voiture", "avion", "musique", "peinture", "jardin", "cuisine", "fenetre",
  "cahier", "crayon", "bouteille", "chapeau", "gateau", "pizza", "guitare",
  "ordinateur", "telephone", "parapluie"
];

const TOTAL_ROUNDS = 10;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const hudEl = document.getElementById("hud");
const wordDisplayEl = document.getElementById("wordDisplay");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let over = false;
let word = "";
let missingIndex = 0;

function updateHud() {
  hudEl.textContent = `Mot ${round + 1}/${TOTAL_ROUNDS} · Score : ${score}`;
}

function renderWord() {
  wordDisplayEl.textContent = [...word]
    .map((c, i) => (i === missingIndex ? "_" : c.toUpperCase()))
    .join(" ");
}

function pickDistractors(correct, count) {
  const pool = ALPHABET.split("").filter(l => l !== correct);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  updateHud();

  word = WORDS[Math.floor(Math.random() * WORDS.length)];
  missingIndex = 1 + Math.floor(Math.random() * (word.length - 1));
  const correctLetter = word[missingIndex].toUpperCase();

  renderWord();

  const choices = [...pickDistractors(correctLetter, 3), correctLetter].sort(() => Math.random() - 0.5);
  choicesEl.innerHTML = "";
  choices.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "btn-small";
    btn.textContent = letter;
    btn.onclick = () => handlePick(letter === correctLetter);
    choicesEl.appendChild(btn);
  });
}

function handlePick(correct) {
  if (over) return;
  if (correct) score++;
  round++;
  startRound();
}

async function endGame() {
  over = true;
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "lettre-manquante", score * 10);
}

document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__lettreManquanteDebug = { handlePick, getState: () => ({ round, score, over, word, missingIndex }) };

startRound();
