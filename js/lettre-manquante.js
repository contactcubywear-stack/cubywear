import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    done: "🔡 Terminé !", finalScore: "Score final", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    done: "🔡 Done!", finalScore: "Final score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const WORD_BANKS = {
  fr: {
    facile: ["chat", "velo", "jupe", "robe", "gare", "table", "lampe", "radio", "stylo", "pomme", "poire", "melon", "sucre", "ecole", "porte", "route", "fleur", "livre", "tapis",
      "souris", "ballon", "montre", "bureau", "cheval", "poulet", "camion", "avion", "bateau", "maison", "moulin", "piscine", "plage", "foret", "neige", "pluie", "soleil", "nuage", "vague", "sable"],
    moyen: ["jardin", "cahier", "crayon", "gateau", "cinema", "etoile", "riviere", "fromage", "voiture", "musique", "cuisine", "fenetre", "chapeau", "guitare", "docteur",
      "dauphin", "papillon", "tortue", "corbeau", "hibou", "renard", "ecureuil", "poisson", "chateau", "bouquet", "pyramide", "planete", "univers", "silence", "courage", "sourire", "cadeau", "orchestre"],
    difficile: ["montagne", "peinture", "bouteille", "chocolat", "parapluie", "telephone", "elephant", "escalier", "aeroport",
      "aquarium", "dinosaure", "tournesol", "kangourou", "chirurgien", "astronaute", "laboratoire", "temperature", "atmosphere", "revolution", "decoration", "escalator"],
    impossible: ["ordinateur", "dictionnaire", "anniversaire", "bibliotheque", "gouvernement", "appartement", "informatique", "thermometre",
      "architecture", "environnement", "developpement", "independance", "caracteristique", "responsabilite", "investissement", "administration", "transformation", "reconnaissance"]
  },
  en: {
    facile: ["lamp", "sofa", "moon", "robe", "gate", "book", "road", "cake", "milk", "bread", "chair", "plate", "shirt", "mouse", "house",
      "mirror", "basket", "pillow", "blanket", "candle", "ladder", "hammer", "bucket", "engine", "rocket", "planet", "forest", "desert", "island", "valley", "meadow", "cherry", "orange", "sunset", "sunrise"],
    moyen: ["guitar", "camera", "garden", "pencil", "window", "bottle", "castle", "wallet", "jacket", "kitchen", "teacher", "rainbow", "diamond", "volcano", "dolphin",
      "penguin", "hamster", "leopard", "panther", "gorilla", "buffalo", "peacock", "seagull", "sparrow", "mustang", "biscuit", "pumpkin", "avocado", "popcorn", "cabinet", "curtain", "mailbox", "journey"],
    difficile: ["elephant", "mountain", "umbrella", "treasure", "triangle", "vacation", "sandwich", "butterfly", "chocolate",
      "telescope", "chimpanzee", "waterfall", "dinosaur", "hurricane", "adventure", "chemistry", "geography", "astronomy", "orchestra", "laboratory", "aquarium"],
    impossible: ["dictionary", "restaurant", "helicopter", "caterpillar", "refrigerator", "thermometer", "encyclopedia", "grandmother",
      "architecture", "environment", "development", "independence", "characteristic", "responsibility", "investment", "administration", "transformation", "government"]
  }
};

const DIFFICULTIES = {
  facile:     { rounds: 10, choices: 4, timer: 0 },
  moyen:      { rounds: 10, choices: 4, timer: 0 },
  difficile:  { rounds: 10, choices: 5, timer: 6 },
  impossible: { rounds: 12, choices: 6, timer: 4 }
};

let cfg = DIFFICULTIES.moyen;
let difficulty = "moyen";

const ALPHABET_FR = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const wordDisplayEl = document.getElementById("wordDisplay");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let word = "";
let missingIndex = 0;
let timeLeft = 0;
let timerInterval = null;

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, cfg.rounds);
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("streakVal").textContent = streak;
}

function renderWord() {
  wordDisplayEl.textContent = [...word]
    .map((c, i) => (i === missingIndex ? "_" : c.toUpperCase()))
    .join(" ");
}

function pickDistractors(correct, count) {
  const alphabet = lang === "en" ? ALPHABET_EN : ALPHABET_FR;
  const pool = alphabet.split("").filter(l => l !== correct);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function updateTimerBar() {
  const fill = document.getElementById("timerFill");
  const ratio = Math.max(timeLeft / cfg.timer, 0);
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle("warn", ratio <= 0.5 && ratio > 0.2);
  fill.classList.toggle("danger", ratio <= 0.2);
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  updateHud();

  const pool = WORD_BANKS[lang][difficulty];
  word = pool[Math.floor(Math.random() * pool.length)];
  missingIndex = 1 + Math.floor(Math.random() * (word.length - 1));
  const correctLetter = word[missingIndex].toUpperCase();

  renderWord();

  const choices = [...pickDistractors(correctLetter, cfg.choices - 1), correctLetter].sort(() => Math.random() - 0.5);
  choicesEl.innerHTML = "";
  choices.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "btn-small";
    btn.textContent = letter;
    btn.onclick = () => handlePick(letter === correctLetter, btn);
    choicesEl.appendChild(btn);
  });

  clearInterval(timerInterval);
  const timerWrap = document.getElementById("timerBarWrap");
  if (cfg.timer > 0) {
    timerWrap.hidden = false;
    timeLeft = cfg.timer;
    updateTimerBar();
    timerInterval = setInterval(() => {
      timeLeft -= 0.1;
      updateTimerBar();
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handlePick(false, null);
      }
    }, 100);
  } else {
    timerWrap.hidden = true;
  }
}

function handlePick(correct, btn) {
  if (over) return;
  clearInterval(timerInterval);
  document.querySelectorAll(".letter-choices button").forEach(b => (b.onclick = null));

  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    if (btn) btn.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    if (btn) btn.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 350);
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "lettre-manquante", score * 10);
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
window.__lettreManquanteDebug = { handlePick, getState: () => ({ round, score, over, word, missingIndex, streak }) };

applyLang();
