import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "De qui vient cette œuvre ?",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🖼️ Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Who made this artwork?",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🖼️ Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Nom de l'artiste, utilisé aussi comme identifiant de recherche Wikipédia (portrait non affiché ici).
const ARTIST_NAMES = {
  "Leonardo da Vinci": { fr: "Léonard de Vinci", en: "Leonardo da Vinci" },
  "Michelangelo": { fr: "Michel-Ange", en: "Michelangelo" },
  "Rembrandt": { fr: "Rembrandt", en: "Rembrandt" },
  "Sandro Botticelli": { fr: "Sandro Botticelli", en: "Sandro Botticelli" },
  "Johannes Vermeer": { fr: "Johannes Vermeer", en: "Johannes Vermeer" },
  "Diego Velázquez": { fr: "Diego Velázquez", en: "Diego Velázquez" },
  "Jan van Eyck": { fr: "Jan van Eyck", en: "Jan van Eyck" },
  "Vincent van Gogh": { fr: "Vincent van Gogh", en: "Vincent van Gogh" },
  "Claude Monet": { fr: "Claude Monet", en: "Claude Monet" },
  "Katsushika Hokusai": { fr: "Hokusai", en: "Hokusai" },
  "Edvard Munch": { fr: "Edvard Munch", en: "Edvard Munch" },
  "Wassily Kandinsky": { fr: "Vassily Kandinsky", en: "Wassily Kandinsky" },
  "Gustav Klimt": { fr: "Gustav Klimt", en: "Gustav Klimt" },
  "Edward Hopper": { fr: "Edward Hopper", en: "Edward Hopper" },
  "Grant Wood": { fr: "Grant Wood", en: "Grant Wood" },
  "Eugène Delacroix": { fr: "Eugène Delacroix", en: "Eugène Delacroix" },
  "James McNeill Whistler": { fr: "James McNeill Whistler", en: "James McNeill Whistler" },
  "Auguste Rodin": { fr: "Auguste Rodin", en: "Auguste Rodin" },
  "Andy Warhol": { fr: "Andy Warhol", en: "Andy Warhol" },
  "Caspar David Friedrich": { fr: "Caspar David Friedrich", en: "Caspar David Friedrich" },

  "J. M. W. Turner": { fr: "William Turner", en: "J. M. W. Turner" },
  "John Constable": { fr: "John Constable", en: "John Constable" },
  "Pierre-Auguste Renoir": { fr: "Pierre-Auguste Renoir", en: "Pierre-Auguste Renoir" },
  "Georges Seurat": { fr: "Georges Seurat", en: "Georges Seurat" },
  "Paul Cézanne": { fr: "Paul Cézanne", en: "Paul Cézanne" },
  "Camille Pissarro": { fr: "Camille Pissarro", en: "Camille Pissarro" },
  "Jean-Honoré Fragonard": { fr: "Jean-Honoré Fragonard", en: "Jean-Honoré Fragonard" },
  "Jacques-Louis David": { fr: "Jacques-Louis David", en: "Jacques-Louis David" },
  "Francisco Goya": { fr: "Francisco de Goya", en: "Francisco Goya" },
  "Honoré Daumier": { fr: "Honoré Daumier", en: "Honoré Daumier" },
  "Édouard Manet": { fr: "Édouard Manet", en: "Édouard Manet" },
  "George Stubbs": { fr: "George Stubbs", en: "George Stubbs" },
  "Pieter Bruegel the Elder": { fr: "Pieter Brueghel l'Ancien", en: "Pieter Bruegel the Elder" },
  "Hieronymus Bosch": { fr: "Jérôme Bosch", en: "Hieronymus Bosch" },
  "Peter Paul Rubens": { fr: "Rubens", en: "Peter Paul Rubens" },
  "Titian": { fr: "Titien", en: "Titian" },
  "Hans Holbein the Younger": { fr: "Hans Holbein le Jeune", en: "Hans Holbein the Younger" },
  "Théodore Géricault": { fr: "Théodore Géricault", en: "Théodore Géricault" },
  "Raphael": { fr: "Raphaël", en: "Raphael" },
  "Thomas Gainsborough": { fr: "Thomas Gainsborough", en: "Thomas Gainsborough" },
  "Joseph Wright of Derby": { fr: "Joseph Wright of Derby", en: "Joseph Wright of Derby" },
  "Thomas Cole": { fr: "Thomas Cole", en: "Thomas Cole" },
  "Asher Brown Durand": { fr: "Asher Brown Durand", en: "Asher Brown Durand" },
  "Winslow Homer": { fr: "Winslow Homer", en: "Winslow Homer" },
  "Piet Mondrian": { fr: "Piet Mondrian", en: "Piet Mondrian" },
  "John Everett Millais": { fr: "John Everett Millais", en: "John Everett Millais" },
  "John William Waterhouse": { fr: "John William Waterhouse", en: "John William Waterhouse" },
  "Frederic Leighton": { fr: "Frederic Leighton", en: "Frederic Leighton" },
  "Cassius Marcellus Coolidge": { fr: "Cassius Marcellus Coolidge", en: "Cassius Marcellus Coolidge" },
  "Henri Rousseau": { fr: "Henri Rousseau", en: "Henri Rousseau" },
  "Agnolo Bronzino": { fr: "Bronzino", en: "Agnolo Bronzino" },
  "Quentin Matsys": { fr: "Quentin Metsys", en: "Quentin Matsys" },
  "Albrecht Dürer": { fr: "Albrecht Dürer", en: "Albrecht Dürer" }
};

// Œuvres du domaine public, image vérifiée via l'API Wikipedia (pageimages).
const ARTWORKS = [
  { wikiTitle: "Mona Lisa", artist: "Leonardo da Vinci", cat: "classical_art" },
  { wikiTitle: "The Last Supper", artist: "Leonardo da Vinci", cat: "classical_art" },
  { wikiTitle: "The Creation of Adam", artist: "Michelangelo", cat: "classical_art" },
  { wikiTitle: "David (Michelangelo)", artist: "Michelangelo", cat: "classical_art" },
  { wikiTitle: "The Birth of Venus", artist: "Sandro Botticelli", cat: "classical_art" },
  { wikiTitle: "Girl with a Pearl Earring", artist: "Johannes Vermeer", cat: "classical_art" },
  { wikiTitle: "The Night Watch", artist: "Rembrandt", cat: "classical_art" },
  { wikiTitle: "Las Meninas", artist: "Diego Velázquez", cat: "classical_art" },
  { wikiTitle: "The Anatomy Lesson of Dr. Nicolaes Tulp", artist: "Rembrandt", cat: "classical_art" },
  { wikiTitle: "The Arnolfini Portrait", artist: "Jan van Eyck", cat: "classical_art" },
  { wikiTitle: "The Starry Night", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Café Terrace at Night", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Impression, Sunrise", artist: "Claude Monet", cat: "modern_art" },
  { wikiTitle: "The Great Wave off Kanagawa", artist: "Katsushika Hokusai", cat: "modern_art" },
  { wikiTitle: "The Scream", artist: "Edvard Munch", cat: "modern_art" },
  { wikiTitle: "Composition VII", artist: "Wassily Kandinsky", cat: "modern_art" },
  { wikiTitle: "The Kiss (Klimt)", artist: "Gustav Klimt", cat: "modern_art" },
  { wikiTitle: "Nighthawks (painting)", artist: "Edward Hopper", cat: "modern_art" },
  { wikiTitle: "American Gothic", artist: "Grant Wood", cat: "modern_art" },
  { wikiTitle: "Liberty Leading the People", artist: "Eugène Delacroix", cat: "modern_art" },
  { wikiTitle: "Whistler's Mother", artist: "James McNeill Whistler", cat: "modern_art" },
  { wikiTitle: "The Thinker", artist: "Auguste Rodin", cat: "modern_art" },
  { wikiTitle: "Campbell's Soup Cans", artist: "Andy Warhol", cat: "modern_art" },
  { wikiTitle: "Wanderer above the Sea of Fog", artist: "Caspar David Friedrich", cat: "modern_art" },

  { wikiTitle: "The Fighting Temeraire", artist: "J. M. W. Turner", cat: "romanticism" },
  { wikiTitle: "The Hay Wain", artist: "John Constable", cat: "romanticism" },
  { wikiTitle: "Bal du moulin de la Galette", artist: "Pierre-Auguste Renoir", cat: "impressionism" },
  { wikiTitle: "Luncheon of the Boating Party", artist: "Pierre-Auguste Renoir", cat: "impressionism" },
  { wikiTitle: "A Sunday Afternoon on the Island of La Grande Jatte", artist: "Georges Seurat", cat: "impressionism" },
  { wikiTitle: "The Card Players", artist: "Paul Cézanne", cat: "modern_art" },
  { wikiTitle: "The Basket of Apples", artist: "Paul Cézanne", cat: "modern_art" },
  { wikiTitle: "Sunflowers (Van Gogh series)", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Irises (painting)", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Wheatfield with Crows", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "The Potato Eaters", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Rouen Cathedral (Monet series)", artist: "Claude Monet", cat: "impressionism" },
  { wikiTitle: "Boulevard Montmartre", artist: "Camille Pissarro", cat: "impressionism" },
  { wikiTitle: "Dance at Bougival", artist: "Pierre-Auguste Renoir", cat: "impressionism" },
  { wikiTitle: "Two Sisters (On the Terrace)", artist: "Pierre-Auguste Renoir", cat: "impressionism" },
  { wikiTitle: "The Swing (Fragonard)", artist: "Jean-Honoré Fragonard", cat: "classical_art" },
  { wikiTitle: "Napoleon Crossing the Alps", artist: "Jacques-Louis David", cat: "classical_art" },
  { wikiTitle: "Saturn Devouring His Son", artist: "Francisco Goya", cat: "classical_art" },
  { wikiTitle: "The Third Class Carriage", artist: "Honoré Daumier", cat: "modern_art" },
  { wikiTitle: "Olympia (Manet)", artist: "Édouard Manet", cat: "impressionism" },
  { wikiTitle: "A Bar at the Folies-Bergère", artist: "Édouard Manet", cat: "impressionism" },
  { wikiTitle: "The Luncheon on the Grass", artist: "Édouard Manet", cat: "impressionism" },
  { wikiTitle: "Whistlejacket", artist: "George Stubbs", cat: "classical_art" },
  { wikiTitle: "Portrait of Adele Bloch-Bauer I", artist: "Gustav Klimt", cat: "modern_art" },
  { wikiTitle: "Judith and the Head of Holofernes (Klimt)", artist: "Gustav Klimt", cat: "modern_art" },
  { wikiTitle: "Danaë (Klimt)", artist: "Gustav Klimt", cat: "modern_art" },
  { wikiTitle: "The Tower of Babel (Bruegel)", artist: "Pieter Bruegel the Elder", cat: "classical_art" },
  { wikiTitle: "The Peasant Wedding", artist: "Pieter Bruegel the Elder", cat: "classical_art" },
  { wikiTitle: "Netherlandish Proverbs", artist: "Pieter Bruegel the Elder", cat: "classical_art" },
  { wikiTitle: "Hunters in the Snow", artist: "Pieter Bruegel the Elder", cat: "classical_art" },
  { wikiTitle: "The Garden of Earthly Delights", artist: "Hieronymus Bosch", cat: "classical_art" },
  { wikiTitle: "Massacre of the Innocents (Rubens)", artist: "Peter Paul Rubens", cat: "classical_art" },
  { wikiTitle: "Venus of Urbino", artist: "Titian", cat: "classical_art" },
  { wikiTitle: "Bacchus and Ariadne", artist: "Titian", cat: "classical_art" },
  { wikiTitle: "Self-Portrait with Two Circles", artist: "Rembrandt", cat: "classical_art" },
  { wikiTitle: "Portrait of Dr. Gachet", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Self-Portrait with Bandaged Ear", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Almond Blossoms", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "The Ambassadors (Holbein)", artist: "Hans Holbein the Younger", cat: "classical_art" },
  { wikiTitle: "The Bedroom (Van Gogh)", artist: "Vincent van Gogh", cat: "modern_art" },
  { wikiTitle: "Water Lilies (Monet)", artist: "Claude Monet", cat: "impressionism" },
  { wikiTitle: "Woman with a Parasol - Madame Monet and Her Son", artist: "Claude Monet", cat: "impressionism" },
  { wikiTitle: "The Umbrellas (Renoir)", artist: "Pierre-Auguste Renoir", cat: "impressionism" },
  { wikiTitle: "The Milkmaid (Vermeer)", artist: "Johannes Vermeer", cat: "classical_art" },
  { wikiTitle: "View of Delft", artist: "Johannes Vermeer", cat: "classical_art" },
  { wikiTitle: "The Third of May 1808", artist: "Francisco Goya", cat: "classical_art" },
  { wikiTitle: "The Raft of the Medusa", artist: "Théodore Géricault", cat: "romanticism" },
  { wikiTitle: "Automat (painting)", artist: "Edward Hopper", cat: "modern_art" },
  { wikiTitle: "Chop Suey (painting)", artist: "Edward Hopper", cat: "modern_art" },
  { wikiTitle: "New York Movie", artist: "Edward Hopper", cat: "modern_art" },

  { wikiTitle: "The Oath of the Horatii", artist: "Jacques-Louis David", cat: "classical_art" },
  { wikiTitle: "The Death of Marat", artist: "Jacques-Louis David", cat: "classical_art" },
  { wikiTitle: "The Sistine Madonna", artist: "Raphael", cat: "classical_art" },
  { wikiTitle: "The School of Athens", artist: "Raphael", cat: "classical_art" },
  { wikiTitle: "Primavera (painting)", artist: "Sandro Botticelli", cat: "classical_art" },
  { wikiTitle: "The Blue Boy", artist: "Thomas Gainsborough", cat: "classical_art" },
  { wikiTitle: "Mr and Mrs Andrews", artist: "Thomas Gainsborough", cat: "classical_art" },
  { wikiTitle: "An Experiment on a Bird in the Air Pump", artist: "Joseph Wright of Derby", cat: "classical_art" },
  { wikiTitle: "The Oxbow", artist: "Thomas Cole", cat: "romanticism" },
  { wikiTitle: "Kindred Spirits (painting)", artist: "Asher Brown Durand", cat: "romanticism" },
  { wikiTitle: "The Gulf Stream (painting)", artist: "Winslow Homer", cat: "modern_art" },
  { wikiTitle: "Broadway Boogie Woogie", artist: "Piet Mondrian", cat: "modern_art" },
  { wikiTitle: "Landscape with the Fall of Icarus", artist: "Pieter Bruegel the Elder", cat: "classical_art" },
  { wikiTitle: "Ophelia (Millais)", artist: "John Everett Millais", cat: "classical_art" },
  { wikiTitle: "The Lady of Shalott (painting)", artist: "John William Waterhouse", cat: "classical_art" },
  { wikiTitle: "Flaming June", artist: "Frederic Leighton", cat: "classical_art" },
  { wikiTitle: "Bubbles (painting)", artist: "John Everett Millais", cat: "classical_art" },
  { wikiTitle: "Dogs Playing Poker", artist: "Cassius Marcellus Coolidge", cat: "modern_art" },
  { wikiTitle: "The Blue Rider (painting)", artist: "Wassily Kandinsky", cat: "modern_art" },

  { wikiTitle: "Venus, Cupid, Folly and Time", artist: "Agnolo Bronzino", cat: "classical_art" },
  { wikiTitle: "The Ugly Duchess", artist: "Quentin Matsys", cat: "classical_art" },
  { wikiTitle: "The Sleeping Gypsy", artist: "Henri Rousseau", cat: "modern_art" },
  { wikiTitle: "Tiger in a Tropical Storm", artist: "Henri Rousseau", cat: "modern_art" },
  { wikiTitle: "The Snake Charmer (Rousseau)", artist: "Henri Rousseau", cat: "modern_art" },
  { wikiTitle: "Wivenhoe Park", artist: "John Constable", cat: "romanticism" },
  { wikiTitle: "Salisbury Cathedral from the Meadows", artist: "John Constable", cat: "romanticism" },
  { wikiTitle: "The Slave Ship", artist: "J. M. W. Turner", cat: "romanticism" },
  { wikiTitle: "Self-Portrait (Dürer, Munich)", artist: "Albrecht Dürer", cat: "classical_art" },
  { wikiTitle: "Young Hare", artist: "Albrecht Dürer", cat: "classical_art" },
  { wikiTitle: "Portrait of a Young Man (Raphael)", artist: "Raphael", cat: "classical_art" }
];

// Liste dédupliquée des artistes, utilisée comme choix de réponse.
const ARTIST_POOL = Array.from(
  new Map(ARTWORKS.map(a => [a.artist, { id: a.artist, ...ARTIST_NAMES[a.artist], cat: a.cat }])).values()
);

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
  const sameCat = ARTIST_POOL.filter(p => p.cat === correct.cat && p.id !== correct.id);
  const otherCat = ARTIST_POOL.filter(p => p.cat !== correct.cat);
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
  let work = null;
  while (attempts < 4 && !src) {
    work = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)];
    src = await fetchWikiImage(work.wikiTitle);
    attempts++;
  }

  if (!src) {
    stimulusEl.innerHTML = "";
    return;
  }

  current = ARTIST_POOL.find(a => a.id === work.artist);
  stimulusEl.className = "quiz-stimulus photo-quiz";
  stimulusEl.innerHTML = `<img src="${src}" alt="">`;

  const choices = pickChoices(current);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.id === current.id, btn);
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
    localStorage.setItem("bestChefDoeuvre", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "chef-doeuvre", score * 10);
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
window.__chefDoeuvreDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestChefDoeuvre") || 0);
applyLang();
