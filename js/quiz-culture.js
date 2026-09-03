import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Musique, art, citations : teste ta culture !",
    hintPhoto: "Reconnais-tu cette personne ?",
    hintArtwork: "De qui vient cette œuvre ?",
    hintMusic: "Quelle est cette chanson ?",
    hintQuote: "Choisis la bonne suite",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🎭 Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Music, art, quotes: test your culture!",
    hintPhoto: "Do you recognize this person?",
    hintArtwork: "Who made this artwork?",
    hintMusic: "What song is this?",
    hintQuote: "Pick the right continuation",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🎭 Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Photos vérifiées via l'API Wikipedia (pageimages) — personnalités reconnaissables (peintres + musiciens).
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
  { id: "Celine Dion", fr: "Céline Dion", en: "Celine Dion", cat: "pop_music" }
];

// Œuvres du domaine public, image vérifiée via Wikipedia (pageimages).
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
  { wikiTitle: "Wanderer above the Sea of Fog", artist: "Caspar David Friedrich", cat: "modern_art" }
];

// L'artiste (nom) sert de choix de réponse pour le mode "œuvre" — dédupliqué depuis ARTWORKS.
const ARTWORK_ARTISTS = Array.from(
  new Map(ARTWORKS.map(a => {
    const match = ARTISTS.find(p => p.id === a.artist) || { fr: a.artist, en: a.artist };
    return [a.artist, { id: a.artist, fr: match.fr, en: match.en, cat: a.cat }];
  })).values()
);

// Chansons connues, prévisualisées via l'API de recherche iTunes (pas de clé requise).
const SONGS = [
  { id: "bohemian-rhapsody", artist: "Queen", search: "Queen Bohemian Rhapsody", fr: "Bohemian Rhapsody – Queen", en: "Bohemian Rhapsody – Queen", cat: "rock" },
  { id: "dont-stop-me-now", artist: "Queen", search: "Queen Dont Stop Me Now", fr: "Don't Stop Me Now – Queen", en: "Don't Stop Me Now – Queen", cat: "rock" },
  { id: "billie-jean", artist: "Michael Jackson", search: "Michael Jackson Billie Jean", fr: "Billie Jean – Michael Jackson", en: "Billie Jean – Michael Jackson", cat: "pop" },
  { id: "thriller", artist: "Michael Jackson", search: "Michael Jackson Thriller", fr: "Thriller – Michael Jackson", en: "Thriller – Michael Jackson", cat: "pop" },
  { id: "dancing-queen", artist: "ABBA", search: "ABBA Dancing Queen", fr: "Dancing Queen – ABBA", en: "Dancing Queen – ABBA", cat: "pop" },
  { id: "hey-jude", artist: "The Beatles", search: "The Beatles Hey Jude", fr: "Hey Jude – The Beatles", en: "Hey Jude – The Beatles", cat: "rock" },
  { id: "shape-of-you", artist: "Ed Sheeran", search: "Ed Sheeran Shape of You", fr: "Shape of You – Ed Sheeran", en: "Shape of You – Ed Sheeran", cat: "pop" },
  { id: "rolling-in-the-deep", artist: "Adele", search: "Adele Rolling in the Deep", fr: "Rolling in the Deep – Adele", en: "Rolling in the Deep – Adele", cat: "pop" },
  { id: "i-wanna-dance", artist: "Whitney Houston", search: "Whitney Houston I Wanna Dance with Somebody", fr: "I Wanna Dance with Somebody – Whitney Houston", en: "I Wanna Dance with Somebody – Whitney Houston", cat: "pop" },
  { id: "smells-like-teen-spirit", artist: "Nirvana", search: "Nirvana Smells Like Teen Spirit", fr: "Smells Like Teen Spirit – Nirvana", en: "Smells Like Teen Spirit – Nirvana", cat: "rock" },
  { id: "halo", artist: "Beyoncé", search: "Beyonce Halo", fr: "Halo – Beyoncé", en: "Halo – Beyoncé", cat: "pop" },
  { id: "viva-la-vida", artist: "Coldplay", search: "Coldplay Viva la Vida", fr: "Viva la Vida – Coldplay", en: "Viva la Vida – Coldplay", cat: "rock" },
  { id: "umbrella", artist: "Rihanna", search: "Rihanna Umbrella", fr: "Umbrella – Rihanna", en: "Umbrella – Rihanna", cat: "pop" },
  { id: "uptown-funk", artist: "Bruno Mars", search: "Bruno Mars Uptown Funk", fr: "Uptown Funk – Bruno Mars", en: "Uptown Funk – Bruno Mars", cat: "pop" },
  { id: "my-heart-will-go-on", artist: "Celine Dion", search: "Celine Dion My Heart Will Go On", fr: "My Heart Will Go On – Céline Dion", en: "My Heart Will Go On – Celine Dion", cat: "classic" },
  { id: "get-lucky", artist: "Daft Punk", search: "Daft Punk Get Lucky", fr: "Get Lucky – Daft Punk", en: "Get Lucky – Daft Punk", cat: "pop" },
  { id: "lose-yourself", artist: "Eminem", search: "Eminem Lose Yourself", fr: "Lose Yourself – Eminem", en: "Lose Yourself – Eminem", cat: "hiphop" },
  { id: "bad-romance", artist: "Lady Gaga", search: "Lady Gaga Bad Romance", fr: "Bad Romance – Lady Gaga", en: "Bad Romance – Lady Gaga", cat: "pop" },
  { id: "rocket-man", artist: "Elton John", search: "Elton John Rocket Man", fr: "Rocket Man – Elton John", en: "Rocket Man – Elton John", cat: "classic" },
  { id: "no-woman-no-cry", artist: "Bob Marley", search: "Bob Marley No Woman No Cry", fr: "No Woman, No Cry – Bob Marley", en: "No Woman, No Cry – Bob Marley", cat: "reggae" },
  { id: "blinding-lights", artist: "The Weeknd", search: "The Weeknd Blinding Lights", fr: "Blinding Lights – The Weeknd", en: "Blinding Lights – The Weeknd", cat: "pop" },
  { id: "firework", artist: "Katy Perry", search: "Katy Perry Firework", fr: "Firework – Katy Perry", en: "Firework – Katy Perry", cat: "pop" },
  { id: "believer", artist: "Imagine Dragons", search: "Imagine Dragons Believer", fr: "Believer – Imagine Dragons", en: "Believer – Imagine Dragons", cat: "rock" },
  { id: "alors-on-danse", artist: "Stromae", search: "Stromae Alors on danse", fr: "Alors on danse – Stromae", en: "Alors on danse – Stromae", cat: "french" }
];

// Comptines, proverbes et courtes citations connues (domaine public / très courts extraits).
const QUOTES_FR = [
  { id: "souris-verte", begin: "Une souris verte, qui courait dans l'herbe", end: "je l'attrape par la queue", cat: "comptine" },
  { id: "petit-navire", begin: "Il était un petit navire", end: "qui n'avait ja-ja-jamais navigué", cat: "comptine" },
  { id: "frere-jacques", begin: "Frère Jacques, Frère Jacques", end: "dormez-vous ? Dormez-vous ?", cat: "comptine" },
  { id: "au-clair-de-la-lune", begin: "Au clair de la lune, mon ami Pierrot", end: "prête-moi ta plume pour écrire un mot", cat: "comptine" },
  { id: "pont-avignon", begin: "Sur le pont d'Avignon", end: "on y danse, on y danse", cat: "comptine" },
  { id: "claire-fontaine", begin: "À la claire fontaine, m'en allant promener", end: "j'ai trouvé l'eau si belle que je m'y suis baigné", cat: "comptine" },
  { id: "meunier", begin: "Meunier, tu dors", end: "ton moulin, ton moulin va trop vite", cat: "comptine" },
  { id: "ainsi-font", begin: "Ainsi font, font, font", end: "les petites marionnettes", cat: "comptine" },
  { id: "houston", begin: "Houston, on a un", end: "problème", cat: "citation" },
  { id: "force", begin: "Que la force soit", end: "avec toi", cat: "citation" },
  { id: "grands-maux", begin: "Aux grands maux les grands", end: "remèdes", cat: "proverbe" },
  { id: "devise", begin: "Liberté, égalité,", end: "fraternité", cat: "proverbe" },
  { id: "union", begin: "L'union fait la", end: "force", cat: "proverbe" },
  { id: "lievre-tortue", begin: "Rien ne sert de courir, il faut partir à", end: "point", cat: "proverbe" },
  { id: "tiens", begin: "Un tiens vaut mieux que deux tu", end: "l'auras", cat: "proverbe" },
  { id: "petit-oiseau", begin: "Petit à petit, l'oiseau fait son", end: "nid", cat: "proverbe" }
];

const QUOTES_EN = [
  { id: "twinkle", begin: "Twinkle, twinkle, little", end: "star", cat: "rhyme" },
  { id: "jack-jill", begin: "Jack and Jill went up the", end: "hill", cat: "rhyme" },
  { id: "humpty", begin: "Humpty Dumpty sat on a", end: "wall", cat: "rhyme" },
  { id: "row-boat", begin: "Row, row, row your", end: "boat", cat: "rhyme" },
  { id: "mary-lamb", begin: "Mary had a little", end: "lamb", cat: "rhyme" },
  { id: "old-macdonald", begin: "Old MacDonald had a", end: "farm", cat: "rhyme" },
  { id: "rain-rain", begin: "Rain, rain, go", end: "away", cat: "rhyme" },
  { id: "hickory", begin: "Hickory dickory", end: "dock", cat: "rhyme" },
  { id: "early-bird", begin: "The early bird catches the", end: "worm", cat: "proverb" },
  { id: "picture-words", begin: "A picture is worth a thousand", end: "words", cat: "proverb" },
  { id: "actions", begin: "Actions speak louder than", end: "words", cat: "proverb" },
  { id: "rome", begin: "When in Rome, do as the Romans", end: "do", cat: "proverb" },
  { id: "force-en", begin: "May the Force be with", end: "you", cat: "quote" },
  { id: "houston-en", begin: "Houston, we have a", end: "problem", cat: "quote" },
  { id: "to-be", begin: "To be or not to", end: "be", cat: "quote" },
  { id: "apple", begin: "An apple a day keeps the doctor", end: "away", cat: "proverb" }
];

const ROUND_TYPES = ["artist_photo", "artwork", "music", "quote"];

const DIFFICULTIES = {
  facile: { rounds: 8, time: 14, hardness: 0 },
  moyen: { rounds: 10, time: 11, hardness: 1 },
  difficile: { rounds: 12, time: 9, hardness: 2 },
  impossible: { rounds: 14, time: 7, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;

const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");
const hintText = document.getElementById("hintText");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let best = 0;
let over = false;
let current = null;
let timeLeft = 0;
let timerInterval = null;
let typeSeq = [];
let audioEl = null;

const imgCache = new Map();
const previewCache = new Map();

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function buildTypeSequence(n) {
  const seq = [];
  while (seq.length < n) seq.push(...shuffle(ROUND_TYPES));
  return seq.slice(0, n);
}

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

async function fetchPreviewUrl(song) {
  if (previewCache.has(song.id)) return previewCache.get(song.id);
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(song.search)}&media=music&entity=song&limit=1&country=CA`;
    const res = await fetch(url);
    const data = await res.json();
    const src = data?.results?.[0]?.previewUrl || null;
    previewCache.set(song.id, src);
    return src;
  } catch (e) {
    return null;
  }
}

function timeForRound() {
  const bonus = current?.type === "music" ? 4 : 0;
  return Math.max(cfg.time - round * 0.2, cfg.time - 4) + bonus;
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

function pickChoices(pool, correct) {
  const sameCat = pool.filter(p => p.cat === correct.cat && p.id !== correct.id);
  const otherCat = pool.filter(p => p.cat !== correct.cat);
  let wrongPool;
  if (cfg.hardness === 0) {
    wrongPool = otherCat.length ? otherCat : pool.filter(p => p.id !== correct.id);
  } else if (cfg.hardness === 1) {
    wrongPool = [...shuffle(sameCat).slice(0, 1), ...otherCat];
  } else {
    wrongPool = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
  }

  const seenLabels = new Set([correct[lang]]);
  const wrong = [];
  for (const p of shuffle(wrongPool)) {
    if (wrong.length >= 3) break;
    if (seenLabels.has(p[lang])) continue;
    seenLabels.add(p[lang]);
    wrong.push(p);
  }
  if (wrong.length < 3) {
    for (const p of shuffle(pool)) {
      if (wrong.length >= 3) break;
      if (p.id === correct.id || seenLabels.has(p[lang])) continue;
      seenLabels.add(p[lang]);
      wrong.push(p);
    }
  }
  return shuffle([...wrong, correct]);
}

function showLoading(show) {
  if (show) {
    stimulusEl.className = "quiz-stimulus";
    stimulusEl.innerHTML = `<p class="quiz-loading">${T[lang].loading}</p>`;
  }
}

function stopAudio() {
  if (audioEl) { audioEl.pause(); audioEl = null; }
}

function playCurrentSound() {
  if (!current || current.type !== "music" || !current.previewUrl) return;
  stopAudio();
  audioEl = new Audio(current.previewUrl);
  audioEl.play().catch(() => {});
  const btn = document.getElementById("playBtn");
  if (btn) btn.classList.add("playing");
  audioEl.addEventListener("ended", () => { if (btn) btn.classList.remove("playing"); });
}

async function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  clearInterval(timerInterval);
  stopAudio();
  updateHud();
  choicesEl.innerHTML = "";

  const type = typeSeq[round];
  hintText.textContent = T[lang][
    type === "artist_photo" ? "hintPhoto" :
    type === "artwork" ? "hintArtwork" :
    type === "music" ? "hintMusic" : "hintQuote"
  ];

  if (type === "artist_photo" || type === "artwork") {
    showLoading(true);
    let attempts = 0, src = null, item = null;
    while (attempts < 4 && !src) {
      if (type === "artist_photo") {
        item = ARTISTS[Math.floor(Math.random() * ARTISTS.length)];
        src = await fetchWikiImage(item.id);
      } else {
        const work = ARTWORKS[Math.floor(Math.random() * ARTWORKS.length)];
        src = await fetchWikiImage(work.wikiTitle);
        item = ARTWORK_ARTISTS.find(a => a.id === work.artist);
      }
      attempts++;
    }
    if (!src || !item) { stimulusEl.innerHTML = ""; return; }
    current = { type, correct: item, pool: type === "artist_photo" ? ARTISTS : ARTWORK_ARTISTS };
    stimulusEl.className = "quiz-stimulus photo-quiz";
    stimulusEl.innerHTML = `<img src="${src}" alt="">`;
  } else if (type === "music") {
    showLoading(true);
    let attempts = 0, previewUrl = null, song = null;
    while (attempts < 4 && !previewUrl) {
      song = SONGS[Math.floor(Math.random() * SONGS.length)];
      previewUrl = await fetchPreviewUrl(song);
      attempts++;
    }
    if (!previewUrl) { stimulusEl.innerHTML = ""; return; }
    current = { type, correct: song, pool: SONGS, previewUrl };
    stimulusEl.className = "quiz-stimulus";
    stimulusEl.innerHTML = `<button class="play-sound-btn" id="playBtn">🎵</button>`;
    document.getElementById("playBtn").onclick = playCurrentSound;
    setTimeout(playCurrentSound, 300);
  } else {
    const src = lang === "fr" ? QUOTES_FR : QUOTES_EN;
    const q = src[Math.floor(Math.random() * src.length)];
    const pool = src.map(x => ({ id: x.id, fr: x.end, en: x.end, cat: x.cat }));
    current = { type, correct: pool.find(p => p.id === q.id), pool, begin: q.begin };
    stimulusEl.className = "quiz-stimulus text-quiz";
    stimulusEl.textContent = `« ${q.begin}... »`;
  }

  const choices = pickChoices(current.pool, current.correct);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.id === current.correct.id, btn);
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
  stopAudio();
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
      if (b.textContent === current.correct[lang]) b.classList.add("correct");
    });
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 1100);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestQuizCulture", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "quiz-culture", score * 10);
}

function startGame(difficulty) {
  diffKey = difficulty;
  cfg = DIFFICULTIES[difficulty] || DIFFICULTIES.moyen;
  round = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  over = false;
  typeSeq = buildTypeSequence(TOTAL_ROUNDS());

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
window.__quizCultureDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey, typeSeq }) };

best = Number(localStorage.getItem("bestQuizCulture") || 0);
applyLang();
