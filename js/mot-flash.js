import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer", submit: "Valider",
    done: "⚡ Terminé !", correctAnswers: "Bonnes réponses", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`, placeholder: "Ta réponse"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay", submit: "Submit",
    done: "⚡ Done!", correctAnswers: "Correct answers", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`, placeholder: "Your answer"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const ENTRIES = {
  fr: [
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
  ],
  en: [
    { word: "sun", clue: "Star at the center of our solar system" },
    { word: "cat", clue: "Pet animal that meows" },
    { word: "pizza", clue: "Round Italian dish with cheese" },
    { word: "plane", clue: "Flies in the sky with passengers" },
    { word: "book", clue: "You read it page by page" },
    { word: "mountain", clue: "Very high landform" },
    { word: "ocean", clue: "Large body of salt water" },
    { word: "guitar", clue: "String instrument you strum" },
    { word: "cheese", clue: "Made from milk" },
    { word: "umbrella", clue: "Protects you from rain" },
    { word: "bike", clue: "Two wheels, you pedal" },
    { word: "snow", clue: "White and cold in winter" },
    { word: "cinema", clue: "Place to watch movies" },
    { word: "doctor", clue: "Treats sick people" },
    { word: "garden", clue: "Place where flowers grow" },
    { word: "music", clue: "You listen to it with your ears" },
    { word: "car", clue: "Drives on the road with an engine" },
    { word: "window", clue: "You look outside through it" },
    { word: "chocolate", clue: "Sweet, often brown" },
    { word: "star", clue: "Shines in the sky at night" }
  ]
};

const DIFFICULTIES = {
  facile:     { rounds: 8,  time: 15 },
  moyen:      { rounds: 10, time: 10 },
  difficile:  { rounds: 12, time: 7 },
  impossible: { rounds: 14, time: 5 }
};

let cfg = DIFFICULTIES.moyen;

const clueEl = document.getElementById("clue");
const clueBox = document.getElementById("clueBox");
const inputEl = document.getElementById("answerInput");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let current = null;
let timeLeft = 0;
let timerInterval = null;

function normalize(s) {
  return s.trim().toLowerCase();
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, cfg.rounds);
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = `${timeLeft}s`;
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  clueBox.className = "clue-box";
  current = ENTRIES[lang][Math.floor(Math.random() * ENTRIES[lang].length)];
  clueEl.textContent = current.clue;
  inputEl.value = "";
  inputEl.disabled = false;
  inputEl.focus();
  timeLeft = cfg.time;
  updateHud();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHud();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      streak = 0;
      if (window.CubySfx) CubySfx.fail();
      round++;
      startRound();
    }
  }, 1000);
}

function submit() {
  if (over) return;
  const correct = normalize(inputEl.value) === current.word;
  clearInterval(timerInterval);

  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    clueBox.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    clueBox.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 350);
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  inputEl.disabled = true;
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mot-flash", score * 10);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
  round = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("submitBtn").onclick = submit;
inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submit();
});
document.getElementById("replayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  inputEl.placeholder = T[lang].placeholder;
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__motFlashDebug = { submit, setAnswer: v => (inputEl.value = v), getState: () => ({ round, score, over, current, streak }) };

applyLang();
