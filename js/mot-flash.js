import { saveScore } from "../api.js";

const ENTRIES = [
  { word: "soleil", clue: "Étoile au centre de notre système" },
  { word: "chat", clue: "Animal domestique qui miaule" },
  { word: "pizza", clue: "Plat italien rond avec du fromage" },
  { word: "avion", clue: "Vole dans le ciel avec des passagers" },
  { word: "livre", clue: "On le lit page par page" },
  { word: "montagne", clue: "Relief très élevé" },
  { word: "ocean", clue: "Grande étendue d'eau salée" },
  { word: "guitare", clue: "Instrument à cordes qu'on gratte" },
  { word: "fromage", clue: "Fait à partir de lait" },
  { word: "parapluie", clue: "Protège de la pluie" },
  { word: "velo", clue: "Deux roues, on pédale" },
  { word: "neige", clue: "Blanche et froide en hiver" },
  { word: "cinema", clue: "Endroit pour regarder des films" },
  { word: "docteur", clue: "Soigne les malades" },
  { word: "jardin", clue: "Endroit où poussent des fleurs" },
  { word: "musique", clue: "On l'écoute avec ses oreilles" },
  { word: "voiture", clue: "Roule sur la route avec un moteur" },
  { word: "fenetre", clue: "On regarde dehors à travers elle" },
  { word: "chocolat", clue: "Sucré, souvent brun" },
  { word: "etoile", clue: "Brille dans le ciel la nuit" }
];

const TOTAL_ROUNDS = 10;
const TIME_LIMIT = 10;

const hudEl = document.getElementById("hud");
const clueEl = document.getElementById("clue");
const inputEl = document.getElementById("answerInput");

let round = 0;
let score = 0;
let over = false;
let current = null;
let timeLeft = TIME_LIMIT;
let timerInterval = null;

function normalize(s) {
  return s.trim().toLowerCase();
}

function updateHud() {
  hudEl.textContent = `Indice ${round + 1}/${TOTAL_ROUNDS} · Temps : ${timeLeft}s`;
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  current = ENTRIES[Math.floor(Math.random() * ENTRIES.length)];
  clueEl.textContent = current.clue;
  inputEl.value = "";
  inputEl.disabled = false;
  timeLeft = TIME_LIMIT;
  updateHud();

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

function submit() {
  if (over) return;
  if (normalize(inputEl.value) === current.word) {
    score++;
  }
  clearInterval(timerInterval);
  round++;
  startRound();
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  inputEl.disabled = true;
  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mot-flash", score * 10);
}

document.getElementById("submitBtn").onclick = submit;
inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submit();
});
document.getElementById("replayBtn").onclick = () => location.reload();

// Hook de test/debug (aucun impact en jeu normal).
window.__motFlashDebug = { submit, setAnswer: v => (inputEl.value = v), getState: () => ({ round, score, over, current }) };

startRound();
