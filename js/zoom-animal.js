import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🔍 Terminé !", finalScore: "Score final", loading: "Chargement"
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🔍 Done!", finalScore: "Final score", loading: "Loading"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Titres Wikipédia vérifiés à l'avance pour garantir une vraie photo, groupés par famille.
const ANIMALS = [
  // Grands félins
  { title: "Lion", fr: "Lion", en: "Lion", cat: "big_cats" },
  { title: "Tiger", fr: "Tigre", en: "Tiger", cat: "big_cats" },
  { title: "Leopard", fr: "Léopard", en: "Leopard", cat: "big_cats" },
  { title: "Jaguar", fr: "Jaguar", en: "Jaguar", cat: "big_cats" },
  { title: "Cheetah", fr: "Guépard", en: "Cheetah", cat: "big_cats" },
  { title: "Cougar", fr: "Puma", en: "Cougar", cat: "big_cats" },
  { title: "Lynx", fr: "Lynx", en: "Lynx", cat: "big_cats" },
  { title: "Snow leopard", fr: "Léopard des neiges", en: "Snow leopard", cat: "big_cats" },
  { title: "Caracal", fr: "Caracal", en: "Caracal", cat: "big_cats" },
  { title: "Ocelot", fr: "Ocelot", en: "Ocelot", cat: "big_cats" },
  { title: "Cat", fr: "Chat", en: "Cat", cat: "big_cats" },

  // Canidés
  { title: "Dog", fr: "Chien", en: "Dog", cat: "canids" },
  { title: "Wolf", fr: "Loup", en: "Wolf", cat: "canids" },
  { title: "Red fox", fr: "Renard", en: "Fox", cat: "canids" },
  { title: "Arctic fox", fr: "Renard arctique", en: "Arctic fox", cat: "canids" },
  { title: "Coyote", fr: "Coyote", en: "Coyote", cat: "canids" },
  { title: "Golden jackal", fr: "Chacal doré", en: "Golden jackal", cat: "canids" },
  { title: "Dingo", fr: "Dingo", en: "Dingo", cat: "canids" },
  { title: "African wild dog", fr: "Lycaon", en: "African wild dog", cat: "canids" },

  // Ferme
  { title: "Cattle", fr: "Vache", en: "Cow", cat: "farm" },
  { title: "Domestic pig", fr: "Cochon", en: "Pig", cat: "farm" },
  { title: "Sheep", fr: "Mouton", en: "Sheep", cat: "farm" },
  { title: "Goat", fr: "Chèvre", en: "Goat", cat: "farm" },
  { title: "Horse", fr: "Cheval", en: "Horse", cat: "farm" },
  { title: "Donkey", fr: "Âne", en: "Donkey", cat: "farm" },
  { title: "Chicken", fr: "Poule", en: "Chicken", cat: "farm" },
  { title: "Duck", fr: "Canard", en: "Duck", cat: "farm" },
  { title: "Turkey (bird)", fr: "Dinde", en: "Turkey", cat: "farm" },
  { title: "Rabbit", fr: "Lapin", en: "Rabbit", cat: "farm" },
  { title: "Llama", fr: "Lama", en: "Llama", cat: "farm" },
  { title: "Alpaca", fr: "Alpaga", en: "Alpaca", cat: "farm" },
  { title: "Water buffalo", fr: "Buffle d'eau", en: "Water buffalo", cat: "farm" },

  // Primates
  { title: "Chimpanzee", fr: "Chimpanzé", en: "Chimpanzee", cat: "primates" },
  { title: "Gorilla", fr: "Gorille", en: "Gorilla", cat: "primates" },
  { title: "Orangutan", fr: "Orang-outan", en: "Orangutan", cat: "primates" },
  { title: "Baboon", fr: "Babouin", en: "Baboon", cat: "primates" },
  { title: "Macaque", fr: "Macaque", en: "Macaque", cat: "primates" },
  { title: "Bonobo", fr: "Bonobo", en: "Bonobo", cat: "primates" },
  { title: "Gibbon", fr: "Gibbon", en: "Gibbon", cat: "primates" },
  { title: "Mandrill", fr: "Mandrill", en: "Mandrill", cat: "primates" },
  { title: "Lemur", fr: "Lémurien", en: "Lemur", cat: "primates" },

  // Ours
  { title: "Brown bear", fr: "Ours brun", en: "Brown bear", cat: "bears" },
  { title: "Polar bear", fr: "Ours polaire", en: "Polar bear", cat: "bears" },
  { title: "American black bear", fr: "Ours noir", en: "Black bear", cat: "bears" },
  { title: "Giant panda", fr: "Panda géant", en: "Giant panda", cat: "bears" },
  { title: "Sloth bear", fr: "Ours lippu", en: "Sloth bear", cat: "bears" },

  // Marins
  { title: "Common bottlenose dolphin", fr: "Dauphin", en: "Dolphin", cat: "marine" },
  { title: "Humpback whale", fr: "Baleine à bosse", en: "Humpback whale", cat: "marine" },
  { title: "Orca", fr: "Orque", en: "Orca", cat: "marine" },
  { title: "Harbor seal", fr: "Phoque", en: "Seal", cat: "marine" },
  { title: "Walrus", fr: "Morse", en: "Walrus", cat: "marine" },
  { title: "Sea otter", fr: "Loutre de mer", en: "Sea otter", cat: "marine" },
  { title: "Manatee", fr: "Lamantin", en: "Manatee", cat: "marine" },

  // Oiseaux
  { title: "Bald eagle", fr: "Aigle", en: "Eagle", cat: "birds" },
  { title: "Owl", fr: "Hibou", en: "Owl", cat: "birds" },
  { title: "Common ostrich", fr: "Autruche", en: "Ostrich", cat: "birds" },
  { title: "Peafowl", fr: "Paon", en: "Peacock", cat: "birds" },
  { title: "Flamingo", fr: "Flamant rose", en: "Flamingo", cat: "birds" },
  { title: "King penguin", fr: "Manchot", en: "Penguin", cat: "birds" },
  { title: "Parrot", fr: "Perroquet", en: "Parrot", cat: "birds" },
  { title: "Toco toucan", fr: "Toucan", en: "Toucan", cat: "birds" },
  { title: "Golden pheasant", fr: "Faisan doré", en: "Golden pheasant", cat: "birds" },
  { title: "Great blue heron", fr: "Héron", en: "Heron", cat: "birds" },
  { title: "Pelican", fr: "Pélican", en: "Pelican", cat: "birds" },
  { title: "Vulture", fr: "Vautour", en: "Vulture", cat: "birds" },
  { title: "House sparrow", fr: "Moineau", en: "Sparrow", cat: "birds" },
  { title: "European robin", fr: "Rouge-gorge", en: "Robin", cat: "birds" },
  { title: "Woodpecker", fr: "Pic-vert", en: "Woodpecker", cat: "birds" },
  { title: "Hummingbird", fr: "Colibri", en: "Hummingbird", cat: "birds" },
  { title: "Kingfisher", fr: "Martin-pêcheur", en: "Kingfisher", cat: "birds" },

  // Reptiles
  { title: "Nile crocodile", fr: "Crocodile", en: "Crocodile", cat: "reptiles" },
  { title: "American alligator", fr: "Alligator", en: "Alligator", cat: "reptiles" },
  { title: "Ball python", fr: "Python", en: "Python", cat: "reptiles" },
  { title: "King cobra", fr: "Cobra royal", en: "King cobra", cat: "reptiles" },
  { title: "Green iguana", fr: "Iguane", en: "Iguana", cat: "reptiles" },
  { title: "Komodo dragon", fr: "Dragon de Komodo", en: "Komodo dragon", cat: "reptiles" },
  { title: "Chameleon", fr: "Caméléon", en: "Chameleon", cat: "reptiles" },
  { title: "Sea turtle", fr: "Tortue", en: "Turtle", cat: "reptiles" },
  { title: "Gecko", fr: "Gecko", en: "Gecko", cat: "reptiles" },

  // Rongeurs
  { title: "Squirrel", fr: "Écureuil", en: "Squirrel", cat: "rodents" },
  { title: "Hamster", fr: "Hamster", en: "Hamster", cat: "rodents" },
  { title: "Guinea pig", fr: "Cochon d'Inde", en: "Guinea pig", cat: "rodents" },
  { title: "Beaver", fr: "Castor", en: "Beaver", cat: "rodents" },
  { title: "House mouse", fr: "Souris", en: "Mouse", cat: "rodents" },
  { title: "Brown rat", fr: "Rat", en: "Rat", cat: "rodents" },
  { title: "Chinchilla", fr: "Chinchilla", en: "Chinchilla", cat: "rodents" },
  { title: "Capybara", fr: "Capybara", en: "Capybara", cat: "rodents" },
  { title: "Hedgehog", fr: "Hérisson", en: "Hedgehog", cat: "rodents" },
  { title: "Porcupine", fr: "Porc-épic", en: "Porcupine", cat: "rodents" },

  // Savane
  { title: "African elephant", fr: "Éléphant", en: "Elephant", cat: "savanna" },
  { title: "Giraffe", fr: "Girafe", en: "Giraffe", cat: "savanna" },
  { title: "Plains zebra", fr: "Zèbre", en: "Zebra", cat: "savanna" },
  { title: "White rhinoceros", fr: "Rhinocéros", en: "Rhinoceros", cat: "savanna" },
  { title: "Hippopotamus", fr: "Hippopotame", en: "Hippopotamus", cat: "savanna" },
  { title: "African buffalo", fr: "Buffle d'Afrique", en: "African buffalo", cat: "savanna" },
  { title: "Blue wildebeest", fr: "Gnou", en: "Wildebeest", cat: "savanna" },
  { title: "Thomson's gazelle", fr: "Gazelle", en: "Gazelle", cat: "savanna" },
  { title: "Impala", fr: "Impala", en: "Impala", cat: "savanna" },

  // Insectes
  { title: "Honey bee", fr: "Abeille", en: "Bee", cat: "insects" },
  { title: "Butterfly", fr: "Papillon", en: "Butterfly", cat: "insects" },
  { title: "Ant", fr: "Fourmi", en: "Ant", cat: "insects" },
  { title: "Ladybird", fr: "Coccinelle", en: "Ladybug", cat: "insects" },
  { title: "Dragonfly", fr: "Libellule", en: "Dragonfly", cat: "insects" },
  { title: "Grasshopper", fr: "Sauterelle", en: "Grasshopper", cat: "insects" },
  { title: "Praying mantis", fr: "Mante religieuse", en: "Praying mantis", cat: "insects" },
  { title: "Cicada", fr: "Cigale", en: "Cicada", cat: "insects" },

  // Amphibiens
  { title: "Frog", fr: "Grenouille", en: "Frog", cat: "amphibians" },
  { title: "Common toad", fr: "Crapaud", en: "Toad", cat: "amphibians" },
  { title: "Salamander", fr: "Salamandre", en: "Salamander", cat: "amphibians" },
  { title: "Axolotl", fr: "Axolotl", en: "Axolotl", cat: "amphibians" },

  // Marsupiaux
  { title: "Kangaroo", fr: "Kangourou", en: "Kangaroo", cat: "marsupials" },
  { title: "Koala", fr: "Koala", en: "Koala", cat: "marsupials" },
  { title: "Wallaby", fr: "Wallaby", en: "Wallaby", cat: "marsupials" },
  { title: "Common wombat", fr: "Wombat", en: "Wombat", cat: "marsupials" },
  { title: "Opossum", fr: "Opossum", en: "Opossum", cat: "marsupials" },
  { title: "Tasmanian devil", fr: "Diable de Tasmanie", en: "Tasmanian devil", cat: "marsupials" },

  // Cervidés
  { title: "Deer", fr: "Cerf", en: "Deer", cat: "deer" },
  { title: "Moose", fr: "Orignal", en: "Moose", cat: "deer" },
  { title: "Elk", fr: "Wapiti", en: "Elk", cat: "deer" },
  { title: "Reindeer", fr: "Renne", en: "Reindeer", cat: "deer" },

  // Poissons
  { title: "Great white shark", fr: "Requin blanc", en: "Great white shark", cat: "fish" },
  { title: "Hammerhead shark", fr: "Requin-marteau", en: "Hammerhead shark", cat: "fish" },
  { title: "Clownfish", fr: "Poisson-clown", en: "Clownfish", cat: "fish" },
  { title: "Goldfish", fr: "Poisson rouge", en: "Goldfish", cat: "fish" },
  { title: "Seahorse", fr: "Hippocampe", en: "Seahorse", cat: "fish" },
  { title: "Manta ray", fr: "Raie manta", en: "Manta ray", cat: "fish" },

  // Petits mammifères
  { title: "Raccoon", fr: "Raton laveur", en: "Raccoon", cat: "small_mammals" },
  { title: "Striped skunk", fr: "Moufette", en: "Skunk", cat: "small_mammals" },
  { title: "European badger", fr: "Blaireau", en: "Badger", cat: "small_mammals" },
  { title: "Ferret", fr: "Furet", en: "Ferret", cat: "small_mammals" },
  { title: "Weasel", fr: "Belette", en: "Weasel", cat: "small_mammals" },
  { title: "Mongoose", fr: "Mangouste", en: "Mongoose", cat: "small_mammals" },
  { title: "Sloth", fr: "Paresseux", en: "Sloth", cat: "small_mammals" },
  { title: "Nine-banded armadillo", fr: "Tatou", en: "Armadillo", cat: "small_mammals" },
  { title: "Giant anteater", fr: "Fourmilier", en: "Anteater", cat: "small_mammals" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, hardness: 0 },
  moyen: { rounds: 10, hardness: 1 },
  difficile: { rounds: 12, hardness: 2 },
  impossible: { rounds: 14, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;
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
  document.getElementById("roundVal").textContent = `${round + 1}/${TOTAL_ROUNDS()}`;
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
  const sameCat = ANIMALS.filter(a => a.cat === correct.cat && a.title !== correct.title);
  const otherCat = ANIMALS.filter(a => a.cat !== correct.cat);
  let pool;
  if (cfg.hardness === 0) {
    pool = otherCat;
  } else if (cfg.hardness === 1) {
    const sameSample = sameCat.sort(() => Math.random() - 0.5).slice(0, 1);
    pool = [...sameSample, ...otherCat];
  } else {
    pool = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
  }
  const wrong = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
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
  if (round >= TOTAL_ROUNDS()) {
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

function startGame(difficulty) {
  diffKey = difficulty;
  cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.moyen;
  round = 0;
  score = 0;
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
});

// Hook de test/debug (aucun impact en jeu normal).
window.__zoomAnimalDebug = { handleGuess, startGame, getState: () => ({ round, score, over, stepIndex, current, diffKey }) };

best = Number(localStorage.getItem("bestZoomAnimal") || 0);
applyLang();
