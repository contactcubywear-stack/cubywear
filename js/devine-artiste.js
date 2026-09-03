import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Reconnais-tu cette personne ?",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🖌️ Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Do you recognize this person?",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🖌️ Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Photos vérifiées via l'API Wikipedia (pageimages) — peintres et musiciens reconnaissables.
const ARTISTS = [
  { id: "Leonardo da Vinci", fr: "Léonard de Vinci", en: "Leonardo da Vinci", cat: "classical_art" },
  { id: "Michelangelo", fr: "Michel-Ange", en: "Michelangelo", cat: "classical_art" },
  { id: "Rembrandt", fr: "Rembrandt", en: "Rembrandt", cat: "classical_art" },
  { id: "Johannes Vermeer", fr: "Johannes Vermeer", en: "Johannes Vermeer", cat: "classical_art" },
  { id: "Diego Velázquez", fr: "Diego Velázquez", en: "Diego Velázquez", cat: "classical_art" },
  { id: "Sandro Botticelli", fr: "Sandro Botticelli", en: "Sandro Botticelli", cat: "classical_art" },
  { id: "Jan van Eyck", fr: "Jan van Eyck", en: "Jan van Eyck", cat: "classical_art" },
  { id: "Vincent van Gogh", fr: "Vincent van Gogh", en: "Vincent van Gogh", cat: "modern_art" },
  { id: "Pablo Picasso", fr: "Pablo Picasso", en: "Pablo Picasso", cat: "modern_art" },
  { id: "Salvador Dalí", fr: "Salvador Dalí", en: "Salvador Dalí", cat: "modern_art" },
  { id: "Claude Monet", fr: "Claude Monet", en: "Claude Monet", cat: "modern_art" },
  { id: "Frida Kahlo", fr: "Frida Kahlo", en: "Frida Kahlo", cat: "modern_art" },
  { id: "Andy Warhol", fr: "Andy Warhol", en: "Andy Warhol", cat: "modern_art" },
  { id: "Georgia O'Keeffe", fr: "Georgia O'Keeffe", en: "Georgia O'Keeffe", cat: "modern_art" },
  { id: "Gustav Klimt", fr: "Gustav Klimt", en: "Gustav Klimt", cat: "modern_art" },
  { id: "Edvard Munch", fr: "Edvard Munch", en: "Edvard Munch", cat: "modern_art" },
  { id: "René Magritte", fr: "René Magritte", en: "René Magritte", cat: "modern_art" },
  { id: "Grant Wood", fr: "Grant Wood", en: "Grant Wood", cat: "modern_art" },
  { id: "Edward Hopper", fr: "Edward Hopper", en: "Edward Hopper", cat: "modern_art" },
  { id: "Auguste Rodin", fr: "Auguste Rodin", en: "Auguste Rodin", cat: "modern_art" },
  { id: "Caspar David Friedrich", fr: "Caspar David Friedrich", en: "Caspar David Friedrich", cat: "modern_art" },
  { id: "Katsushika Hokusai", fr: "Hokusai", en: "Hokusai", cat: "modern_art" },
  { id: "James McNeill Whistler", fr: "James McNeill Whistler", en: "James McNeill Whistler", cat: "modern_art" },
  { id: "Eugène Delacroix", fr: "Eugène Delacroix", en: "Eugène Delacroix", cat: "modern_art" },
  { id: "Wolfgang Amadeus Mozart", fr: "Wolfgang Amadeus Mozart", en: "Wolfgang Amadeus Mozart", cat: "classical_music" },
  { id: "Ludwig van Beethoven", fr: "Ludwig van Beethoven", en: "Ludwig van Beethoven", cat: "classical_music" },
  { id: "Michael Jackson", fr: "Michael Jackson", en: "Michael Jackson", cat: "pop_music" },
  { id: "Elvis Presley", fr: "Elvis Presley", en: "Elvis Presley", cat: "pop_music" },
  { id: "Freddie Mercury", fr: "Freddie Mercury", en: "Freddie Mercury", cat: "pop_music" },
  { id: "Bob Marley", fr: "Bob Marley", en: "Bob Marley", cat: "pop_music" },
  { id: "Beyoncé", fr: "Beyoncé", en: "Beyoncé", cat: "pop_music" },
  { id: "Elton John", fr: "Elton John", en: "Elton John", cat: "pop_music" },
  { id: "David Bowie", fr: "David Bowie", en: "David Bowie", cat: "pop_music" },
  { id: "Prince (musician)", fr: "Prince", en: "Prince", cat: "pop_music" },
  { id: "Madonna", fr: "Madonna", en: "Madonna", cat: "pop_music" },
  { id: "Celine Dion", fr: "Céline Dion", en: "Celine Dion", cat: "pop_music" },

  { id: "Paul Cézanne", fr: "Paul Cézanne", en: "Paul Cézanne", cat: "modern_art" },
  { id: "Henri Matisse", fr: "Henri Matisse", en: "Henri Matisse", cat: "modern_art" },
  { id: "Paul Gauguin", fr: "Paul Gauguin", en: "Paul Gauguin", cat: "modern_art" },
  { id: "Edgar Degas", fr: "Edgar Degas", en: "Edgar Degas", cat: "modern_art" },
  { id: "Pierre-Auguste Renoir", fr: "Pierre-Auguste Renoir", en: "Pierre-Auguste Renoir", cat: "modern_art" },
  { id: "Georges Seurat", fr: "Georges Seurat", en: "Georges Seurat", cat: "modern_art" },
  { id: "Henri de Toulouse-Lautrec", fr: "Toulouse-Lautrec", en: "Toulouse-Lautrec", cat: "modern_art" },
  { id: "Marc Chagall", fr: "Marc Chagall", en: "Marc Chagall", cat: "modern_art" },
  { id: "Joan Miró", fr: "Joan Miró", en: "Joan Miró", cat: "modern_art" },
  { id: "Piet Mondrian", fr: "Piet Mondrian", en: "Piet Mondrian", cat: "modern_art" },
  { id: "Jackson Pollock", fr: "Jackson Pollock", en: "Jackson Pollock", cat: "modern_art" },
  { id: "Mark Rothko", fr: "Mark Rothko", en: "Mark Rothko", cat: "modern_art" },
  { id: "Roy Lichtenstein", fr: "Roy Lichtenstein", en: "Roy Lichtenstein", cat: "modern_art" },
  { id: "Keith Haring", fr: "Keith Haring", en: "Keith Haring", cat: "modern_art" },
  { id: "Jean-Michel Basquiat", fr: "Jean-Michel Basquiat", en: "Jean-Michel Basquiat", cat: "modern_art" },
  { id: "Diego Rivera", fr: "Diego Rivera", en: "Diego Rivera", cat: "modern_art" },
  { id: "El Greco", fr: "Le Greco", en: "El Greco", cat: "classical_art" },
  { id: "Francisco Goya", fr: "Francisco de Goya", en: "Francisco Goya", cat: "classical_art" },
  { id: "Titian", fr: "Titien", en: "Titian", cat: "classical_art" },
  { id: "Raphael", fr: "Raphaël", en: "Raphael", cat: "classical_art" },
  { id: "Peter Paul Rubens", fr: "Rubens", en: "Peter Paul Rubens", cat: "classical_art" },
  { id: "Henri Rousseau", fr: "Henri Rousseau", en: "Henri Rousseau", cat: "modern_art" },
  { id: "Amedeo Modigliani", fr: "Amedeo Modigliani", en: "Amedeo Modigliani", cat: "modern_art" },
  { id: "Egon Schiele", fr: "Egon Schiele", en: "Egon Schiele", cat: "modern_art" },
  { id: "M. C. Escher", fr: "M. C. Escher", en: "M. C. Escher", cat: "modern_art" },
  { id: "Camille Pissarro", fr: "Camille Pissarro", en: "Camille Pissarro", cat: "modern_art" },
  { id: "Berthe Morisot", fr: "Berthe Morisot", en: "Berthe Morisot", cat: "modern_art" },
  { id: "Mary Cassatt", fr: "Mary Cassatt", en: "Mary Cassatt", cat: "modern_art" },

  { id: "John Lennon", fr: "John Lennon", en: "John Lennon", cat: "pop_music" },
  { id: "Paul McCartney", fr: "Paul McCartney", en: "Paul McCartney", cat: "pop_music" },
  { id: "Bob Dylan", fr: "Bob Dylan", en: "Bob Dylan", cat: "pop_music" },
  { id: "Jimi Hendrix", fr: "Jimi Hendrix", en: "Jimi Hendrix", cat: "pop_music" },
  { id: "Whitney Houston", fr: "Whitney Houston", en: "Whitney Houston", cat: "pop_music" },
  { id: "Aretha Franklin", fr: "Aretha Franklin", en: "Aretha Franklin", cat: "pop_music" },
  { id: "Stevie Wonder", fr: "Stevie Wonder", en: "Stevie Wonder", cat: "pop_music" },
  { id: "Ray Charles", fr: "Ray Charles", en: "Ray Charles", cat: "pop_music" },
  { id: "Louis Armstrong", fr: "Louis Armstrong", en: "Louis Armstrong", cat: "pop_music" },
  { id: "Miles Davis", fr: "Miles Davis", en: "Miles Davis", cat: "pop_music" },
  { id: "Ella Fitzgerald", fr: "Ella Fitzgerald", en: "Ella Fitzgerald", cat: "pop_music" },
  { id: "Nina Simone", fr: "Nina Simone", en: "Nina Simone", cat: "pop_music" },
  { id: "Johnny Cash", fr: "Johnny Cash", en: "Johnny Cash", cat: "pop_music" },
  { id: "Dolly Parton", fr: "Dolly Parton", en: "Dolly Parton", cat: "pop_music" },
  { id: "Adele", fr: "Adele", en: "Adele", cat: "pop_music" },
  { id: "Rihanna", fr: "Rihanna", en: "Rihanna", cat: "pop_music" },
  { id: "Taylor Swift", fr: "Taylor Swift", en: "Taylor Swift", cat: "pop_music" },
  { id: "Ed Sheeran", fr: "Ed Sheeran", en: "Ed Sheeran", cat: "pop_music" },
  { id: "Bruno Mars", fr: "Bruno Mars", en: "Bruno Mars", cat: "pop_music" },
  { id: "Lady Gaga", fr: "Lady Gaga", en: "Lady Gaga", cat: "pop_music" },
  { id: "Eminem", fr: "Eminem", en: "Eminem", cat: "pop_music" },
  { id: "Jay-Z", fr: "Jay-Z", en: "Jay-Z", cat: "pop_music" },
  { id: "Kanye West", fr: "Kanye West", en: "Kanye West", cat: "pop_music" },
  { id: "Drake (musician)", fr: "Drake", en: "Drake", cat: "pop_music" },
  { id: "Justin Bieber", fr: "Justin Bieber", en: "Justin Bieber", cat: "pop_music" },
  { id: "Ariana Grande", fr: "Ariana Grande", en: "Ariana Grande", cat: "pop_music" },
  { id: "Shakira", fr: "Shakira", en: "Shakira", cat: "pop_music" },
  { id: "Ricky Martin", fr: "Ricky Martin", en: "Ricky Martin", cat: "pop_music" },
  { id: "Enrique Iglesias", fr: "Enrique Iglesias", en: "Enrique Iglesias", cat: "pop_music" },
  { id: "Julio Iglesias", fr: "Julio Iglesias", en: "Julio Iglesias", cat: "pop_music" },
  { id: "Édith Piaf", fr: "Édith Piaf", en: "Édith Piaf", cat: "pop_music" },
  { id: "Charles Aznavour", fr: "Charles Aznavour", en: "Charles Aznavour", cat: "pop_music" },
  { id: "Serge Gainsbourg", fr: "Serge Gainsbourg", en: "Serge Gainsbourg", cat: "pop_music" },
  { id: "Jacques Brel", fr: "Jacques Brel", en: "Jacques Brel", cat: "pop_music" },
  { id: "Johnny Hallyday", fr: "Johnny Hallyday", en: "Johnny Hallyday", cat: "pop_music" },
  { id: "Garou (singer)", fr: "Garou", en: "Garou", cat: "pop_music" },
  { id: "Roch Voisine", fr: "Roch Voisine", en: "Roch Voisine", cat: "pop_music" },
  { id: "Félix Leclerc", fr: "Félix Leclerc", en: "Félix Leclerc", cat: "pop_music" },
  { id: "Robert Charlebois", fr: "Robert Charlebois", en: "Robert Charlebois", cat: "pop_music" },
  { id: "Ginette Reno", fr: "Ginette Reno", en: "Ginette Reno", cat: "pop_music" }
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
  const sameCat = ARTISTS.filter(p => p.cat === correct.cat && p.id !== correct.id);
  const otherCat = ARTISTS.filter(p => p.cat !== correct.cat);
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
  let person = null;
  while (attempts < 4 && !src) {
    person = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
    src = await fetchWikiImage(person.id);
    attempts++;
  }

  if (!src) {
    stimulusEl.innerHTML = "";
    return;
  }

  current = person;
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
    localStorage.setItem("bestDevineArtiste", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "devine-artiste", score * 10);
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
window.__devineArtisteDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestDevineArtiste") || 0);
applyLang();
