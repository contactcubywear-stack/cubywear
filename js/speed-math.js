import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    timeUp: "🧮 Temps écoulé !", correct: "Bonnes réponses", wrong: "Erreurs", bestStreak: "Meilleure série"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    timeUp: "🧮 Time's up!", correct: "Correct answers", wrong: "Mistakes", bestStreak: "Best streak"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const DIFFICULTIES = {
  facile:     { ops: ["+", "-"], time: 60, range: [1, 20], multRange: [1, 10], divRange: [1, 10] },
  moyen:      { ops: ["+", "-", "×"], time: 60, range: [1, 40], multRange: [1, 12], divRange: [1, 12] },
  difficile:  { ops: ["+", "-", "×", "÷"], time: 50, range: [10, 99], multRange: [2, 15], divRange: [2, 15] },
  impossible: { ops: ["+", "-", "×", "÷"], time: 40, range: [50, 200], multRange: [5, 20], divRange: [5, 20] }
};

let difficulty = "moyen";

const problemEl = document.getElementById("problem");
const answerDisplayEl = document.getElementById("answerDisplay");
const mathBox = document.getElementById("mathBox");

let correct = 0;
let wrong = 0;
let streak = 0;
let bestStreak = 0;
let timeLeft = 60;
let currentAnswer = 0;
let currentInput = "";
let over = true;
let timerInterval = null;

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function newProblem() {
  const cfg = DIFFICULTIES[difficulty];
  const op = cfg.ops[rand(0, cfg.ops.length - 1)];
  let a, b;

  if (op === "+") {
    a = rand(cfg.range[0], cfg.range[1]);
    b = rand(cfg.range[0], cfg.range[1]);
    currentAnswer = a + b;
  } else if (op === "-") {
    a = rand(cfg.range[0], cfg.range[1]);
    b = rand(cfg.range[0], a);
    currentAnswer = a - b;
  } else if (op === "×") {
    a = rand(cfg.multRange[0], cfg.multRange[1]);
    b = rand(cfg.multRange[0], cfg.multRange[1]);
    currentAnswer = a * b;
  } else {
    b = rand(cfg.divRange[0], cfg.divRange[1]);
    currentAnswer = rand(cfg.divRange[0], cfg.divRange[1]);
    a = b * currentAnswer;
  }

  problemEl.textContent = `${a} ${op} ${b} = ?`;
  currentInput = "";
  answerDisplayEl.innerHTML = "&nbsp;";
}

function flash(isCorrect) {
  mathBox.classList.remove("feedback-flash", "wrong");
  void mathBox.offsetWidth;
  mathBox.classList.add("feedback-flash");
  if (!isCorrect) mathBox.classList.add("wrong");
}

function updateHud() {
  document.getElementById("scoreVal").textContent = correct;
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = timeLeft;
}

function submitAnswer() {
  if (over || currentInput === "") return;
  const value = Number(currentInput);

  if (value === currentAnswer) {
    correct++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    flash(true);
    if (window.CubySfx) CubySfx.match();
  } else {
    wrong++;
    streak = 0;
    flash(false);
    if (window.CubySfx) CubySfx.fail();
  }

  updateHud();
  newProblem();
}

function pressDigit(d) {
  if (over) return;
  if (currentInput.length >= 6) return;
  currentInput += d;
  answerDisplayEl.textContent = currentInput;
}

function pressErase() {
  if (over) return;
  currentInput = currentInput.slice(0, -1);
  answerDisplayEl.innerHTML = currentInput === "" ? "&nbsp;" : currentInput;
}

function buildNumpad() {
  const numpadEl = document.getElementById("numpad");
  numpadEl.innerHTML = "";
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
  keys.forEach(key => {
    const btn = document.createElement("button");
    btn.className = "num-btn" + (key === "✓" ? " submit" : "");
    btn.textContent = key;
    btn.onclick = () => {
      if (key === "⌫") pressErase();
      else if (key === "✓") submitAnswer();
      else pressDigit(key);
    };
    numpadEl.appendChild(btn);
  });
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);

  if (window.CubySfx) CubySfx.win();

  document.getElementById("statCorrect").textContent = correct;
  document.getElementById("statWrong").textContent = wrong;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "speed-math", correct);
}

function startGame(diff) {
  difficulty = diff;
  const cfg = DIFFICULTIES[diff];

  correct = 0;
  wrong = 0;
  streak = 0;
  bestStreak = 0;
  timeLeft = cfg.time;
  over = false;

  updateHud();
  buildNumpad();
  newProblem();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHud();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

window.addEventListener("keydown", e => {
  if (over) return;
  if (e.key >= "0" && e.key <= "9") pressDigit(e.key);
  if (e.key === "Backspace") pressErase();
  if (e.key === "Enter") submitAnswer();
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
});

applyLang();
