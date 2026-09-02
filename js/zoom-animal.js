import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    done: "🔍 Terminé !", finalScore: "Score final"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    done: "🔍 Done!", finalScore: "Final score"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const ANIMALS = [
  { emoji: "🐶", fr: "Chien", en: "Dog" },
  { emoji: "🐱", fr: "Chat", en: "Cat" },
  { emoji: "🦁", fr: "Lion", en: "Lion" },
  { emoji: "🐯", fr: "Tigre", en: "Tiger" },
  { emoji: "🐘", fr: "Éléphant", en: "Elephant" },
  { emoji: "🦒", fr: "Girafe", en: "Giraffe" },
  { emoji: "🐵", fr: "Singe", en: "Monkey" },
  { emoji: "🦊", fr: "Renard", en: "Fox" },
  { emoji: "🐼", fr: "Panda", en: "Panda" },
  { emoji: "🐨", fr: "Koala", en: "Koala" },
  { emoji: "🐧", fr: "Pingouin", en: "Penguin" },
  { emoji: "🦉", fr: "Hibou", en: "Owl" },
  { emoji: "🐺", fr: "Loup", en: "Wolf" },
  { emoji: "🐰", fr: "Lapin", en: "Rabbit" },
  { emoji: "🐴", fr: "Cheval", en: "Horse" },
  { emoji: "🐄", fr: "Vache", en: "Cow" },
  { emoji: "🐷", fr: "Cochon", en: "Pig" },
  { emoji: "🐑", fr: "Mouton", en: "Sheep" },
  { emoji: "🐢", fr: "Tortue", en: "Turtle" },
  { emoji: "🐬", fr: "Dauphin", en: "Dolphin" },
  { emoji: "🦈", fr: "Requin", en: "Shark" },
  { emoji: "🦅", fr: "Aigle", en: "Eagle" },
  { emoji: "🦓", fr: "Zèbre", en: "Zebra" },
  { emoji: "🐊", fr: "Crocodile", en: "Crocodile" },
  { emoji: "🦔", fr: "Hérisson", en: "Hedgehog" },
  { emoji: "🐸", fr: "Grenouille", en: "Frog" }
];

const TOTAL_ROUNDS = 8;
const ZOOM_STEPS = [0.12, 0.18, 0.28, 0.42, 0.6, 1.0];
const STEP_INTERVAL = 2200;
const RENDER_SIZE = 320;

const canvas = document.getElementById("zoomCanvas");
const ctx = canvas.getContext("2d");
const offCanvas = document.createElement("canvas");
offCanvas.width = RENDER_SIZE;
offCanvas.height = RENDER_SIZE;
const offCtx = offCanvas.getContext("2d");
const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let best = 0;
let over = false;
let current = null;
let stepIndex = 0;
let stepTimer = null;

function updateHud() {
  document.getElementById("roundVal").textContent = `${round + 1}/${TOTAL_ROUNDS}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("bestVal").textContent = best;
}

function renderZoom(emoji, cropFraction) {
  offCtx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  offCtx.font = `${RENDER_SIZE * 0.8}px Arial`;
  offCtx.textAlign = "center";
  offCtx.textBaseline = "middle";
  offCtx.fillText(emoji, RENDER_SIZE / 2, RENDER_SIZE / 2 + RENDER_SIZE * 0.05);

  const cropSize = RENDER_SIZE * cropFraction;
  const cropX = (RENDER_SIZE - cropSize) / 2;
  const cropY = (RENDER_SIZE - cropSize) / 2;

  ctx.imageSmoothingEnabled = cropFraction > 0.3;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offCanvas, cropX, cropY, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
}

function pickChoices(correct) {
  const others = ANIMALS.filter(a => a.fr !== correct.fr).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function nextStep() {
  if (over) return;
  if (stepIndex < ZOOM_STEPS.length - 1) {
    stepIndex++;
    renderZoom(current.emoji, ZOOM_STEPS[stepIndex]);
    stepTimer = setTimeout(nextStep, STEP_INTERVAL);
  }
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();

  current = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  stepIndex = 0;
  renderZoom(current.emoji, ZOOM_STEPS[0]);
  clearTimeout(stepTimer);
  stepTimer = setTimeout(nextStep, STEP_INTERVAL);

  const choices = pickChoices(current);
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handleGuess(choice.fr === current.fr, btn);
    choicesEl.appendChild(btn);
  });
}

function handleGuess(correct, btn) {
  if (over) return;
  clearTimeout(stepTimer);
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));

  if (correct) {
    const points = Math.max(60 - stepIndex * 10, 10);
    score += points;
    stimulusEl.classList.add("correct");
    if (btn) btn.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    stimulusEl.classList.add("wrong");
    if (btn) btn.classList.add("wrong");
    document.querySelectorAll(".choice-btn").forEach(b => {
      if (b.textContent === current[lang]) b.classList.add("correct");
    });
    if (window.CubySfx) CubySfx.fail();
  }

  renderZoom(current.emoji, 1.0);
  round++;
  setTimeout(startRound, 900);
}

async function endGame() {
  over = true;
  clearTimeout(stepTimer);
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestZoomAnimal", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "zoom-animal", score);
}

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

// Hook de test/debug (aucun impact en jeu normal).
window.__zoomAnimalDebug = { handleGuess, getState: () => ({ round, score, over, stepIndex, current }) };

best = Number(localStorage.getItem("bestZoomAnimal") || 0);
applyLang();
startRound();
