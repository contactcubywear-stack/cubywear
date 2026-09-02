import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Reconnais-tu cet endroit ?",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🌍 Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Do you recognize this place?",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🌍 Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Titres Wikipédia vérifiés à l'avance pour garantir une vraie photo du lieu, groupés par région.
const PLACES = [
  // Europe
  { title: "Eiffel Tower", fr: "Tour Eiffel (France)", en: "Eiffel Tower (France)", cat: "europe" },
  { title: "Louvre", fr: "Le Louvre (France)", en: "The Louvre (France)", cat: "europe" },
  { title: "Mont Saint-Michel", fr: "Mont Saint-Michel (France)", en: "Mont Saint-Michel (France)", cat: "europe" },
  { title: "Palace of Versailles", fr: "Château de Versailles (France)", en: "Palace of Versailles (France)", cat: "europe" },
  { title: "Notre-Dame de Paris", fr: "Notre-Dame de Paris (France)", en: "Notre-Dame de Paris (France)", cat: "europe" },
  { title: "Sacré-Cœur, Paris", fr: "Sacré-Cœur (France)", en: "Sacré-Cœur (France)", cat: "europe" },
  { title: "Arc de Triomphe", fr: "Arc de Triomphe (France)", en: "Arc de Triomphe (France)", cat: "europe" },
  { title: "Pont du Gard", fr: "Pont du Gard (France)", en: "Pont du Gard (France)", cat: "europe" },
  { title: "Chateau de Chambord", fr: "Château de Chambord (France)", en: "Château de Chambord (France)", cat: "europe" },
  { title: "Big Ben", fr: "Big Ben (Royaume-Uni)", en: "Big Ben (UK)", cat: "europe" },
  { title: "Tower Bridge", fr: "Tower Bridge (Royaume-Uni)", en: "Tower Bridge (UK)", cat: "europe" },
  { title: "Stonehenge", fr: "Stonehenge (Royaume-Uni)", en: "Stonehenge (UK)", cat: "europe" },
  { title: "Buckingham Palace", fr: "Buckingham Palace (Royaume-Uni)", en: "Buckingham Palace (UK)", cat: "europe" },
  { title: "Edinburgh Castle", fr: "Château d'Édimbourg (Royaume-Uni)", en: "Edinburgh Castle (UK)", cat: "europe" },
  { title: "Giant's Causeway", fr: "Chaussée des Géants (Royaume-Uni)", en: "Giant's Causeway (UK)", cat: "europe" },
  { title: "Windsor Castle", fr: "Château de Windsor (Royaume-Uni)", en: "Windsor Castle (UK)", cat: "europe" },
  { title: "Cliffs of Moher", fr: "Falaises de Moher (Irlande)", en: "Cliffs of Moher (Ireland)", cat: "europe" },
  { title: "Ring of Kerry", fr: "Ring of Kerry (Irlande)", en: "Ring of Kerry (Ireland)", cat: "europe" },
  { title: "Blarney Castle", fr: "Château de Blarney (Irlande)", en: "Blarney Castle (Ireland)", cat: "europe" },
  { title: "Colosseum", fr: "Colisée (Italie)", en: "Colosseum (Italy)", cat: "europe" },
  { title: "Leaning Tower of Pisa", fr: "Tour de Pise (Italie)", en: "Tower of Pisa (Italy)", cat: "europe" },
  { title: "Venice", fr: "Venise (Italie)", en: "Venice (Italy)", cat: "europe" },
  { title: "Trevi Fountain", fr: "Fontaine de Trevi (Italie)", en: "Trevi Fountain (Italy)", cat: "europe" },
  { title: "Duomo di Milano", fr: "Duomo de Milan (Italie)", en: "Milan Cathedral (Italy)", cat: "europe" },
  { title: "Cinque Terre", fr: "Cinque Terre (Italie)", en: "Cinque Terre (Italy)", cat: "europe" },
  { title: "Positano", fr: "Positano (Italie)", en: "Positano (Italy)", cat: "europe" },
  { title: "Amalfi Coast", fr: "Côte Amalfitaine (Italie)", en: "Amalfi Coast (Italy)", cat: "europe" },
  { title: "Sagrada Família", fr: "Sagrada Família (Espagne)", en: "Sagrada Família (Spain)", cat: "europe" },
  { title: "Alhambra", fr: "Alhambra (Espagne)", en: "Alhambra (Spain)", cat: "europe" },
  { title: "Park Güell", fr: "Parc Güell (Espagne)", en: "Park Güell (Spain)", cat: "europe" },
  { title: "Neuschwanstein Castle", fr: "Château de Neuschwanstein (Allemagne)", en: "Neuschwanstein Castle (Germany)", cat: "europe" },
  { title: "Brandenburg Gate", fr: "Porte de Brandebourg (Allemagne)", en: "Brandenburg Gate (Germany)", cat: "europe" },
  { title: "Cologne Cathedral", fr: "Cathédrale de Cologne (Allemagne)", en: "Cologne Cathedral (Germany)", cat: "europe" },
  { title: "Acropolis of Athens", fr: "Acropole d'Athènes (Grèce)", en: "Acropolis of Athens (Greece)", cat: "europe" },
  { title: "Santorini", fr: "Santorin (Grèce)", en: "Santorini (Greece)", cat: "europe" },
  { title: "Meteora", fr: "Météores (Grèce)", en: "Meteora (Greece)", cat: "europe" },
  { title: "Charles Bridge", fr: "Pont Charles (République tchèque)", en: "Charles Bridge (Czechia)", cat: "europe" },
  { title: "Prague Castle", fr: "Château de Prague (République tchèque)", en: "Prague Castle (Czechia)", cat: "europe" },
  { title: "Kinderdijk", fr: "Moulins de Kinderdijk (Pays-Bas)", en: "Windmills of Kinderdijk (Netherlands)", cat: "europe" },
  { title: "Anne Frank House", fr: "Maison d'Anne Frank (Pays-Bas)", en: "Anne Frank House (Netherlands)", cat: "europe" },
  { title: "Atomium", fr: "Atomium (Belgique)", en: "Atomium (Belgium)", cat: "europe" },
  { title: "Hallstatt", fr: "Hallstatt (Autriche)", en: "Hallstatt (Austria)", cat: "europe" },
  { title: "Schönbrunn Palace", fr: "Château de Schönbrunn (Autriche)", en: "Schönbrunn Palace (Austria)", cat: "europe" },
  { title: "Matterhorn", fr: "Cervin (Suisse)", en: "Matterhorn (Switzerland)", cat: "europe" },
  { title: "Chapel Bridge", fr: "Pont de la Chapelle (Suisse)", en: "Chapel Bridge (Switzerland)", cat: "europe" },
  { title: "Trakai Island Castle", fr: "Château de Trakai (Lituanie)", en: "Trakai Island Castle (Lithuania)", cat: "europe" },
  { title: "Peles Castle", fr: "Château de Peleș (Roumanie)", en: "Peleș Castle (Romania)", cat: "europe" },
  { title: "Bran Castle", fr: "Château de Bran (Roumanie)", en: "Bran Castle (Romania)", cat: "europe" },
  { title: "Blue Lagoon (geothermal spa)", fr: "Lagon Bleu (Islande)", en: "Blue Lagoon (Iceland)", cat: "europe" },
  { title: "Loch Ness", fr: "Loch Ness (Royaume-Uni)", en: "Loch Ness (UK)", cat: "europe" },
  { title: "Lake Bled", fr: "Lac de Bled (Slovénie)", en: "Lake Bled (Slovenia)", cat: "europe" },
  { title: "Dubrovnik", fr: "Dubrovnik (Croatie)", en: "Dubrovnik (Croatia)", cat: "europe" },
  { title: "Plitvice Lakes National Park", fr: "Lacs de Plitvice (Croatie)", en: "Plitvice Lakes (Croatia)", cat: "europe" },
  { title: "Belem Tower", fr: "Tour de Belém (Portugal)", en: "Belém Tower (Portugal)", cat: "europe" },
  { title: "Douro Valley", fr: "Vallée du Douro (Portugal)", en: "Douro Valley (Portugal)", cat: "europe" },

  // Amérique du Nord
  { title: "Statue of Liberty", fr: "Statue de la Liberté (États-Unis)", en: "Statue of Liberty (USA)", cat: "north_america" },
  { title: "Golden Gate Bridge", fr: "Golden Gate (États-Unis)", en: "Golden Gate Bridge (USA)", cat: "north_america" },
  { title: "Empire State Building", fr: "Empire State Building (États-Unis)", en: "Empire State Building (USA)", cat: "north_america" },
  { title: "Grand Canyon", fr: "Grand Canyon (États-Unis)", en: "Grand Canyon (USA)", cat: "north_america" },
  { title: "Niagara Falls", fr: "Chutes du Niagara (Canada)", en: "Niagara Falls (Canada)", cat: "north_america" },
  { title: "Mount Rushmore", fr: "Mont Rushmore (États-Unis)", en: "Mount Rushmore (USA)", cat: "north_america" },
  { title: "White House", fr: "Maison Blanche (États-Unis)", en: "White House (USA)", cat: "north_america" },
  { title: "CN Tower", fr: "Tour CN (Canada)", en: "CN Tower (Canada)", cat: "north_america" },
  { title: "Hollywood Sign", fr: "Panneau Hollywood (États-Unis)", en: "Hollywood Sign (USA)", cat: "north_america" },
  { title: "Times Square", fr: "Times Square (États-Unis)", en: "Times Square (USA)", cat: "north_america" },
  { title: "Chichen Itza", fr: "Chichén Itzá (Mexique)", en: "Chichen Itza (Mexico)", cat: "north_america" },
  { title: "Antelope Canyon", fr: "Antelope Canyon (États-Unis)", en: "Antelope Canyon (USA)", cat: "north_america" },
  { title: "Alcatraz Island", fr: "Alcatraz (États-Unis)", en: "Alcatraz (USA)", cat: "north_america" },
  { title: "Yellowstone National Park", fr: "Parc de Yellowstone (États-Unis)", en: "Yellowstone (USA)", cat: "north_america" },
  { title: "Space Needle", fr: "Space Needle (États-Unis)", en: "Space Needle (USA)", cat: "north_america" },
  { title: "Pyramid of the Sun", fr: "Pyramide du Soleil (Mexique)", en: "Pyramid of the Sun (Mexico)", cat: "north_america" },

  // Amérique du Sud
  { title: "Christ the Redeemer (statue)", fr: "Christ Rédempteur (Brésil)", en: "Christ the Redeemer (Brazil)", cat: "south_america" },
  { title: "Machu Picchu", fr: "Machu Picchu (Pérou)", en: "Machu Picchu (Peru)", cat: "south_america" },
  { title: "Iguazu Falls", fr: "Chutes d'Iguaçu (Brésil)", en: "Iguazu Falls (Brazil)", cat: "south_america" },
  { title: "Salar de Uyuni", fr: "Salar d'Uyuni (Bolivie)", en: "Salar de Uyuni (Bolivia)", cat: "south_america" },
  { title: "Nazca Lines", fr: "Lignes de Nazca (Pérou)", en: "Nazca Lines (Peru)", cat: "south_america" },
  { title: "Torres del Paine National Park", fr: "Torres del Paine (Chili)", en: "Torres del Paine (Chile)", cat: "south_america" },
  { title: "Easter Island", fr: "Île de Pâques (Chili)", en: "Easter Island (Chile)", cat: "south_america" },

  // Asie
  { title: "Great Wall of China", fr: "Grande Muraille (Chine)", en: "Great Wall (China)", cat: "asia" },
  { title: "Forbidden City", fr: "Cité Interdite (Chine)", en: "Forbidden City (China)", cat: "asia" },
  { title: "Terracotta Army", fr: "Armée de terre cuite (Chine)", en: "Terracotta Army (China)", cat: "asia" },
  { title: "Taj Mahal", fr: "Taj Mahal (Inde)", en: "Taj Mahal (India)", cat: "asia" },
  { title: "Golden Temple", fr: "Temple d'Or (Inde)", en: "Golden Temple (India)", cat: "asia" },
  { title: "Red Fort", fr: "Fort Rouge (Inde)", en: "Red Fort (India)", cat: "asia" },
  { title: "Gateway of India", fr: "Porte de l'Inde (Inde)", en: "Gateway of India (India)", cat: "asia" },
  { title: "Angkor Wat", fr: "Angkor Vat (Cambodge)", en: "Angkor Wat (Cambodia)", cat: "asia" },
  { title: "Mount Fuji", fr: "Mont Fuji (Japon)", en: "Mount Fuji (Japan)", cat: "asia" },
  { title: "Fushimi Inari-taisha", fr: "Fushimi Inari-taisha (Japon)", en: "Fushimi Inari-taisha (Japan)", cat: "asia" },
  { title: "Ha Long Bay", fr: "Baie d'Ha Long (Vietnam)", en: "Ha Long Bay (Vietnam)", cat: "asia" },
  { title: "Borobudur", fr: "Borobudur (Indonésie)", en: "Borobudur (Indonesia)", cat: "asia" },
  { title: "Bali", fr: "Bali (Indonésie)", en: "Bali (Indonesia)", cat: "asia" },
  { title: "Mount Bromo", fr: "Mont Bromo (Indonésie)", en: "Mount Bromo (Indonesia)", cat: "asia" },
  { title: "Tanah Lot", fr: "Tanah Lot (Indonésie)", en: "Tanah Lot (Indonesia)", cat: "asia" },
  { title: "Potala Palace", fr: "Palais du Potala (Tibet)", en: "Potala Palace (Tibet)", cat: "asia" },
  { title: "Hagia Sophia", fr: "Sainte-Sophie (Turquie)", en: "Hagia Sophia (Turkey)", cat: "asia" },
  { title: "Cappadocia", fr: "Cappadoce (Turquie)", en: "Cappadocia (Turkey)", cat: "asia" },
  { title: "Marina Bay Sands", fr: "Marina Bay Sands (Singapour)", en: "Marina Bay Sands (Singapore)", cat: "asia" },
  { title: "Petronas Towers", fr: "Tours Petronas (Malaisie)", en: "Petronas Towers (Malaysia)", cat: "asia" },

  // Moyen-Orient
  { title: "Petra", fr: "Pétra (Jordanie)", en: "Petra (Jordan)", cat: "middle_east" },
  { title: "Wadi Rum", fr: "Wadi Rum (Jordanie)", en: "Wadi Rum (Jordan)", cat: "middle_east" },
  { title: "Dead Sea", fr: "Mer Morte (Jordanie/Israël)", en: "Dead Sea (Jordan/Israel)", cat: "middle_east" },
  { title: "Western Wall", fr: "Mur des Lamentations (Israël)", en: "Western Wall (Israel)", cat: "middle_east" },
  { title: "Dome of the Rock", fr: "Dôme du Rocher (Israël)", en: "Dome of the Rock (Israel)", cat: "middle_east" },
  { title: "Mecca", fr: "La Mecque (Arabie saoudite)", en: "Mecca (Saudi Arabia)", cat: "middle_east" },
  { title: "Burj Khalifa", fr: "Burj Khalifa (Émirats)", en: "Burj Khalifa (UAE)", cat: "middle_east" },
  { title: "Burj Al Arab", fr: "Burj Al Arab (Émirats)", en: "Burj Al Arab (UAE)", cat: "middle_east" },
  { title: "Sheikh Zayed Grand Mosque", fr: "Grande Mosquée Cheikh Zayed (Émirats)", en: "Sheikh Zayed Grand Mosque (UAE)", cat: "middle_east" },
  { title: "Palm Jumeirah", fr: "Palm Jumeirah (Émirats)", en: "Palm Jumeirah (UAE)", cat: "middle_east" },
  { title: "Krak des Chevaliers", fr: "Krak des Chevaliers (Syrie)", en: "Krak des Chevaliers (Syria)", cat: "middle_east" },

  // Afrique
  { title: "Great Pyramid of Giza", fr: "Grande Pyramide de Gizeh (Égypte)", en: "Great Pyramid of Giza (Egypt)", cat: "africa" },
  { title: "Great Sphinx of Giza", fr: "Grand Sphinx de Gizeh (Égypte)", en: "Great Sphinx of Giza (Egypt)", cat: "africa" },
  { title: "Karnak Temple", fr: "Temple de Karnak (Égypte)", en: "Karnak Temple (Egypt)", cat: "africa" },
  { title: "Abu Simbel temples", fr: "Temples d'Abou Simbel (Égypte)", en: "Abu Simbel (Egypt)", cat: "africa" },
  { title: "Luxor Temple", fr: "Temple de Louxor (Égypte)", en: "Luxor Temple (Egypt)", cat: "africa" },
  { title: "Table Mountain", fr: "Montagne de la Table (Afrique du Sud)", en: "Table Mountain (South Africa)", cat: "africa" },
  { title: "Victoria Falls", fr: "Chutes Victoria (Zambie/Zimbabwe)", en: "Victoria Falls (Zambia/Zimbabwe)", cat: "africa" },
  { title: "Sahara", fr: "Désert du Sahara (Afrique)", en: "Sahara Desert (Africa)", cat: "africa" },
  { title: "Serengeti National Park", fr: "Parc du Serengeti (Tanzanie)", en: "Serengeti (Tanzania)", cat: "africa" },
  { title: "Mount Kilimanjaro", fr: "Kilimandjaro (Tanzanie)", en: "Mount Kilimanjaro (Tanzania)", cat: "africa" },

  // Océanie
  { title: "Sydney Opera House", fr: "Opéra de Sydney (Australie)", en: "Sydney Opera House (Australia)", cat: "oceania" },
  { title: "Uluru", fr: "Uluru (Australie)", en: "Uluru (Australia)", cat: "oceania" },
  { title: "Great Barrier Reef", fr: "Grande Barrière de Corail (Australie)", en: "Great Barrier Reef (Australia)", cat: "oceania" },
  { title: "Milford Sound", fr: "Milford Sound (Nouvelle-Zélande)", en: "Milford Sound (New Zealand)", cat: "oceania" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, time: 12, hardness: 0 },
  moyen: { rounds: 10, time: 10, hardness: 1 },
  difficile: { rounds: 12, time: 8, hardness: 2 },
  impossible: { rounds: 14, time: 6, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;

const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let best = 0;
let over = false;
let current = null;
let timeLeft = 0;
let timerInterval = null;

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

function timeForRound() {
  return Math.max(cfg.time - round * 0.3, cfg.time - 4);
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS());
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function updateTimerBar() {
  const fill = document.getElementById("timerFill");
  if (!fill) return;
  const total = timeForRound();
  const ratio = Math.max(timeLeft / total, 0);
  fill.style.width = `${ratio * 100}%`;
  fill.classList.toggle("warn", ratio <= 0.5 && ratio > 0.2);
  fill.classList.toggle("danger", ratio <= 0.2);
}

function pickChoices(correct) {
  const sameCat = PLACES.filter(p => p.cat === correct.cat && p.title !== correct.title);
  const otherCat = PLACES.filter(p => p.cat !== correct.cat);
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
  if (show) {
    stimulusEl.innerHTML = "";
    const loadingEl = document.createElement("p");
    loadingEl.id = "quizLoading";
    loadingEl.className = "quiz-loading";
    loadingEl.textContent = T[lang].loading;
    stimulusEl.appendChild(loadingEl);
  }
}

async function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  clearInterval(timerInterval);
  stimulusEl.className = "quiz-stimulus";
  updateHud();
  choicesEl.innerHTML = "";
  showLoading(true);

  let attempts = 0;
  let src = null;
  let place = null;
  while (attempts < 4 && !src) {
    place = PLACES[Math.floor(Math.random() * PLACES.length)];
    src = await fetchWikiImage(place.title);
    attempts++;
  }

  if (!src) {
    stimulusEl.innerHTML = "";
    return;
  }

  current = place;
  stimulusEl.className = "quiz-stimulus photo-quiz";
  stimulusEl.innerHTML = `<img src="${src}" alt="">`;

  const choices = pickChoices(current);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.title === current.title, btn);
    choicesEl.appendChild(btn);
  });

  timeLeft = timeForRound();
  updateTimerBar();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    updateTimerBar();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handlePick(false, null);
    }
  }, 100);
}

function handlePick(correct, btn) {
  if (over) return;
  clearInterval(timerInterval);
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));

  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    stimulusEl.classList.add("correct");
    if (btn) btn.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    stimulusEl.classList.add("wrong");
    if (btn) btn.classList.add("wrong");
    document.querySelectorAll(".choice-btn").forEach(b => {
      if (b.textContent === current[lang]) b.classList.add("correct");
    });
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 1000);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestAutourDuMonde", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "autour-du-monde", score * 10);
}

function startGame(difficulty) {
  diffKey = difficulty;
  cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.moyen;
  round = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  over = false;

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;

  const timerWrap = document.createElement("div");
  timerWrap.className = "timer-bar";
  timerWrap.innerHTML = `<div class="timer-fill" id="timerFill"></div>`;
  stimulusEl.after(timerWrap);

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
window.__autourDuMondeDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestAutourDuMonde") || 0);
applyLang();
