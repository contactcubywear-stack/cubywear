import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    done: "🔍 Terminé !", finalScore: "Score final", loading: "Chargement"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    done: "🔍 Done!", finalScore: "Final score", loading: "Loading"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Titres Wikipédia (anglais) vérifiés à l'avance pour garantir une vraie photo.
const ANIMALS = [
  { title: "Dog", fr: "Chien", en: "Dog" },
  { title: "Cat", fr: "Chat", en: "Cat" },
  { title: "Lion", fr: "Lion", en: "Lion" },
  { title: "Tiger", fr: "Tigre", en: "Tiger" },
  { title: "African elephant", fr: "Éléphant", en: "Elephant" },
  { title: "Giraffe", fr: "Girafe", en: "Giraffe" },
  { title: "Chimpanzee", fr: "Singe", en: "Monkey" },
  { title: "Red fox", fr: "Renard", en: "Fox" },
  { title: "Giant panda", fr: "Panda", en: "Panda" },
  { title: "Koala", fr: "Koala", en: "Koala" },
  { title: "King penguin", fr: "Pingouin", en: "Penguin" },
  { title: "Owl", fr: "Hibou", en: "Owl" },
  { title: "Wolf", fr: "Loup", en: "Wolf" },
  { title: "Rabbit", fr: "Lapin", en: "Rabbit" },
  { title: "Horse", fr: "Cheval", en: "Horse" },
  { title: "Cattle", fr: "Vache", en: "Cow" },
  { title: "Domestic pig", fr: "Cochon", en: "Pig" },
  { title: "Sheep", fr: "Mouton", en: "Sheep" },
  { title: "Sea turtle", fr: "Tortue", en: "Turtle" },
  { title: "Common bottlenose dolphin", fr: "Dauphin", en: "Dolphin" },
  { title: "Great white shark", fr: "Requin", en: "Shark" },
  { title: "Bald eagle", fr: "Aigle", en: "Eagle" },
  { title: "Plains zebra", fr: "Zèbre", en: "Zebra" },
  { title: "Nile crocodile", fr: "Crocodile", en: "Crocodile" },
  { title: "Hedgehog", fr: "Hérisson", en: "Hedgehog" },
  { title: "Frog", fr: "Grenouille", en: "Frog" }
];

const TOTAL_ROUNDS = 8;
const ZOOM_STEPS = [0.1, 0.16, 0.25, 0.4, 0.6, 1.0];
const STEP_INTERVAL = 2200;
const RENDER_SIZE = 400;

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
let loadedImg = null;
let stepIndex = 0;
let stepTimer = null;

const imgCache = new Map();

async function fetchWikiImage(title, size = 500) {
  if (imgCache.has(title)) return imgCache.get(title);
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${size}&origin=*&redirects=1`;
    const res = await fetch(url);
    const data = await res.json();
    const page = Object.values(data.query.pages)[0];
    const src = page?.thumbnail?.source || null;
    imgCache.set(title, src);
    return src;
  } catch (e) {
    return null;
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function updateHud() {
  document.getElementById("roundVal").textContent = `${round + 1}/${TOTAL_ROUNDS}`;
  document.getElementById("scoreVal").textContent = score;
  document.getElementById("bestVal").textContent = best;
}

function renderZoom(img, cropFraction) {
  offCtx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE);
  const scale = Math.max(RENDER_SIZE / img.width, RENDER_SIZE / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  offCtx.drawImage(img, (RENDER_SIZE - dw) / 2, (RENDER_SIZE - dh) / 2, dw, dh);

  const cropSize = RENDER_SIZE * cropFraction;
  const cropX = (RENDER_SIZE - cropSize) / 2;
  const cropY = (RENDER_SIZE - cropSize) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(offCanvas, cropX, cropY, cropSize, cropSize, 0, 0, canvas.width, canvas.height);
}

function pickChoices(correct) {
  const others = ANIMALS.filter(a => a.title !== correct.title).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function showLoading(show) {
  canvas.hidden = show;
  let loadingEl = document.getElementById("quizLoading");
  if (show) {
    if (!loadingEl) {
      loadingEl = document.createElement("p");
      loadingEl.id = "quizLoading";
      loadingEl.className = "quiz-loading";
      stimulusEl.appendChild(loadingEl);
    }
    loadingEl.textContent = T[lang].loading;
    loadingEl.hidden = false;
  } else if (loadingEl) {
    loadingEl.hidden = true;
  }
}

function nextStep() {
  if (over) return;
  if (stepIndex < ZOOM_STEPS.length - 1) {
    stepIndex++;
    renderZoom(loadedImg, ZOOM_STEPS[stepIndex]);
    stepTimer = setTimeout(nextStep, STEP_INTERVAL);
  }
}

async function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();
  choicesEl.innerHTML = "";
  showLoading(true);

  let attempts = 0;
  let src = null;
  let animal = null;
  while (attempts < 4 && !src) {
    animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    src = await fetchWikiImage(animal.title);
    attempts++;
  }

  if (!src) {
    // Réseau indisponible : on arrête proprement plutôt que de bloquer.
    showLoading(false);
    stimulusEl.innerHTML = `<canvas id="zoomCanvas" width="200" height="200"></canvas>`;
    return;
  }

  try {
    loadedImg = await loadImage(src);
  } catch (e) {
    round++;
    startRound();
    return;
  }

  current = animal;
  showLoading(false);
  stepIndex = 0;
  renderZoom(loadedImg, ZOOM_STEPS[0]);
  clearTimeout(stepTimer);
  stepTimer = setTimeout(nextStep, STEP_INTERVAL);

  const choices = pickChoices(current);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handleGuess(choice.title === current.title, btn);
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

  renderZoom(loadedImg, 1.0);
  round++;
  setTimeout(startRound, 1000);
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
