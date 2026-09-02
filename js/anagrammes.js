import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer", clear: "Effacer",
    done: "🔤 Terminé !", wordsFound: "Mots trouvés", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay", clear: "Clear",
    done: "🔤 Done!", wordsFound: "Words found", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const WORD_BANKS = {
  fr: {
    facile: ["chat", "velo", "lune", "jupe", "robe", "sofa", "gare", "table", "lampe", "radio", "stylo", "disco", "pomme", "poire", "melon", "sucre", "ecole", "porte", "route", "fleur", "livre", "tapis"],
    moyen: ["jardin", "cahier", "crayon", "gateau", "cinema", "etoile", "riviere", "fromage", "voiture", "musique", "cuisine", "fenetre", "chapeau", "guitare", "docteur"],
    difficile: ["montagne", "peinture", "bouteille", "chocolat", "parapluie", "telephone", "elephant", "escalier", "aeroport", "tournesol", "dinosaure", "programme", "poussiere"],
    impossible: ["ordinateur", "dictionnaire", "anniversaire", "refrigerateur", "bibliotheque", "tremblement", "gouvernement", "appartement", "parachutiste", "informatique", "thermometre"]
  },
  en: {
    facile: ["lamp", "sofa", "moon", "robe", "gate", "book", "road", "cake", "milk", "bread", "chair", "plate", "shirt", "mouse", "house"],
    moyen: ["guitar", "camera", "garden", "pencil", "window", "bottle", "castle", "wallet", "jacket", "kitchen", "teacher", "rainbow", "diamond", "volcano", "dolphin"],
    difficile: ["elephant", "mountain", "umbrella", "treasure", "triangle", "vacation", "sandwich", "butterfly", "chocolate", "telephone", "newspaper", "spaceship", "wonderful"],
    impossible: ["dictionary", "restaurant", "helicopter", "caterpillar", "refrigerator", "extraordinary", "thermometer", "encyclopedia", "neighborhood", "grandmother", "watermelon"]
  }
};

const DIFFICULTIES = {
  facile:     { rounds: 10, time: 25 },
  moyen:      { rounds: 10, time: 20 },
  difficile:  { rounds: 8,  time: 15 },
  impossible: { rounds: 6,  time: 12 }
};

let cfg = DIFFICULTIES.moyen;
let difficulty = "moyen";

const answerRow = document.getElementById("answerRow");
const lettersRow = document.getElementById("lettersRow");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let word = "";
let letters = [];
let answer = [];
let timeLeft = 0;
let timerInterval = null;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, cfg.rounds);
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = `${timeLeft}s`;
}

function renderAnswer() {
  answerRow.className = "answer-row";
  answerRow.innerHTML = "";
  for (let i = 0; i < word.length; i++) {
    const tile = document.createElement("div");
    tile.className = "tile" + (answer[i] ? " pop" : " empty");
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
  if (window.CubySfx) CubySfx.tap();

  if (answer.length === word.length) {
    const guess = answer.map(a => a.char).join("");
    if (guess === word) {
      handleCorrect();
    } else {
      answerRow.classList.add("wrong");
      if (window.CubySfx) CubySfx.fail();
      streak = 0;
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
  answerRow.classList.add("correct");
  if (window.CubySfx) CubySfx.match();
  score++;
  streak++;
  bestStreak = Math.max(bestStreak, streak);
  round++;
  setTimeout(startRound, 400);
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  const pool = WORD_BANKS[lang][difficulty];
  word = pool[Math.floor(Math.random() * pool.length)];
  letters = shuffle([...word].map(char => ({ char, used: false })));
  answer = [];
  timeLeft = cfg.time;
  updateHud();
  renderLetters();
  renderAnswer();

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

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "anagrammes", score * 10);
}

function startGame(diff) {
  difficulty = diff;
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

document.getElementById("clearBtn").onclick = resetAttempt;
document.getElementById("replayBtn").onclick = () => location.reload();

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
window.__anagrammesDebug = { handleCorrect, resetAttempt, getState: () => ({ round, score, over, word, streak }) };

applyLang();
