import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Écoute et devine la chanson !",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "🎧 Terminé !", score: "Score", bestStreak: "Meilleure série",
    loading: "Chargement",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Listen and guess the song!",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "🎧 Done!", score: "Score", bestStreak: "Best streak",
    loading: "Loading",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

// Prévisualisations vérifiées via l'API de recherche iTunes (pas de clé requise).
const SONGS = [
  { id: "bohemian-rhapsody", search: "Queen Bohemian Rhapsody", fr: "Bohemian Rhapsody – Queen", en: "Bohemian Rhapsody – Queen", cat: "rock" },
  { id: "dont-stop-me-now", search: "Queen Dont Stop Me Now", fr: "Don't Stop Me Now – Queen", en: "Don't Stop Me Now – Queen", cat: "rock" },
  { id: "billie-jean", search: "Michael Jackson Billie Jean", fr: "Billie Jean – Michael Jackson", en: "Billie Jean – Michael Jackson", cat: "pop" },
  { id: "thriller", search: "Michael Jackson Thriller", fr: "Thriller – Michael Jackson", en: "Thriller – Michael Jackson", cat: "pop" },
  { id: "dancing-queen", search: "ABBA Dancing Queen", fr: "Dancing Queen – ABBA", en: "Dancing Queen – ABBA", cat: "pop" },
  { id: "hey-jude", search: "The Beatles Hey Jude", fr: "Hey Jude – The Beatles", en: "Hey Jude – The Beatles", cat: "rock" },
  { id: "shape-of-you", search: "Ed Sheeran Shape of You", fr: "Shape of You – Ed Sheeran", en: "Shape of You – Ed Sheeran", cat: "pop" },
  { id: "rolling-in-the-deep", search: "Adele Rolling in the Deep", fr: "Rolling in the Deep – Adele", en: "Rolling in the Deep – Adele", cat: "pop" },
  { id: "i-wanna-dance", search: "Whitney Houston I Wanna Dance with Somebody", fr: "I Wanna Dance with Somebody – Whitney Houston", en: "I Wanna Dance with Somebody – Whitney Houston", cat: "pop" },
  { id: "smells-like-teen-spirit", search: "Nirvana Smells Like Teen Spirit", fr: "Smells Like Teen Spirit – Nirvana", en: "Smells Like Teen Spirit – Nirvana", cat: "rock" },
  { id: "halo", search: "Beyonce Halo", fr: "Halo – Beyoncé", en: "Halo – Beyoncé", cat: "pop" },
  { id: "viva-la-vida", search: "Coldplay Viva la Vida", fr: "Viva la Vida – Coldplay", en: "Viva la Vida – Coldplay", cat: "rock" },
  { id: "umbrella", search: "Rihanna Umbrella", fr: "Umbrella – Rihanna", en: "Umbrella – Rihanna", cat: "pop" },
  { id: "uptown-funk", search: "Bruno Mars Uptown Funk", fr: "Uptown Funk – Bruno Mars", en: "Uptown Funk – Bruno Mars", cat: "pop" },
  { id: "my-heart-will-go-on", search: "Celine Dion My Heart Will Go On", fr: "My Heart Will Go On – Céline Dion", en: "My Heart Will Go On – Celine Dion", cat: "classic" },
  { id: "get-lucky", search: "Daft Punk Get Lucky", fr: "Get Lucky – Daft Punk", en: "Get Lucky – Daft Punk", cat: "pop" },
  { id: "lose-yourself", search: "Eminem Lose Yourself", fr: "Lose Yourself – Eminem", en: "Lose Yourself – Eminem", cat: "hiphop" },
  { id: "bad-romance", search: "Lady Gaga Bad Romance", fr: "Bad Romance – Lady Gaga", en: "Bad Romance – Lady Gaga", cat: "pop" },
  { id: "rocket-man", search: "Elton John Rocket Man", fr: "Rocket Man – Elton John", en: "Rocket Man – Elton John", cat: "classic" },
  { id: "no-woman-no-cry", search: "Bob Marley No Woman No Cry", fr: "No Woman, No Cry – Bob Marley", en: "No Woman, No Cry – Bob Marley", cat: "reggae" },
  { id: "blinding-lights", search: "The Weeknd Blinding Lights", fr: "Blinding Lights – The Weeknd", en: "Blinding Lights – The Weeknd", cat: "pop" },
  { id: "firework", search: "Katy Perry Firework", fr: "Firework – Katy Perry", en: "Firework – Katy Perry", cat: "pop" },
  { id: "believer", search: "Imagine Dragons Believer", fr: "Believer – Imagine Dragons", en: "Believer – Imagine Dragons", cat: "rock" },
  { id: "alors-on-danse", search: "Stromae Alors on danse", fr: "Alors on danse – Stromae", en: "Alors on danse – Stromae", cat: "french" },

  { id: "beat-it", search: "Michael Jackson Beat It", fr: "Beat It – Michael Jackson", en: "Beat It – Michael Jackson", cat: "pop" },
  { id: "let-it-be", search: "The Beatles Let It Be", fr: "Let It Be – The Beatles", en: "Let It Be – The Beatles", cat: "rock" },
  { id: "yesterday", search: "The Beatles Yesterday", fr: "Yesterday – The Beatles", en: "Yesterday – The Beatles", cat: "rock" },
  { id: "we-will-rock-you", search: "Queen We Will Rock You", fr: "We Will Rock You – Queen", en: "We Will Rock You – Queen", cat: "rock" },
  { id: "somebody-to-love", search: "Queen Somebody to Love", fr: "Somebody to Love – Queen", en: "Somebody to Love – Queen", cat: "rock" },
  { id: "mamma-mia", search: "ABBA Mamma Mia", fr: "Mamma Mia – ABBA", en: "Mamma Mia – ABBA", cat: "pop" },
  { id: "waterloo", search: "ABBA Waterloo", fr: "Waterloo – ABBA", en: "Waterloo – ABBA", cat: "pop" },
  { id: "cant-help-falling", search: "Elvis Presley Cant Help Falling in Love", fr: "Can't Help Falling in Love – Elvis Presley", en: "Can't Help Falling in Love – Elvis Presley", cat: "pop" },
  { id: "jailhouse-rock", search: "Elvis Presley Jailhouse Rock", fr: "Jailhouse Rock – Elvis Presley", en: "Jailhouse Rock – Elvis Presley", cat: "pop" },
  { id: "space-oddity", search: "David Bowie Space Oddity", fr: "Space Oddity – David Bowie", en: "Space Oddity – David Bowie", cat: "pop" },
  { id: "lets-dance", search: "David Bowie Lets Dance", fr: "Let's Dance – David Bowie", en: "Let's Dance – David Bowie", cat: "pop" },
  { id: "purple-rain", search: "Prince Purple Rain", fr: "Purple Rain – Prince", en: "Purple Rain – Prince", cat: "pop" },
  { id: "like-a-prayer", search: "Madonna Like a Prayer", fr: "Like a Prayer – Madonna", en: "Like a Prayer – Madonna", cat: "pop" },
  { id: "vogue", search: "Madonna Vogue", fr: "Vogue – Madonna", en: "Vogue – Madonna", cat: "pop" },
  { id: "i-will-always-love-you", search: "Whitney Houston I Will Always Love You", fr: "I Will Always Love You – Whitney Houston", en: "I Will Always Love You – Whitney Houston", cat: "pop" },
  { id: "all-i-want-for-christmas", search: "Mariah Carey All I Want for Christmas Is You", fr: "All I Want for Christmas Is You – Mariah Carey", en: "All I Want for Christmas Is You – Mariah Carey", cat: "pop" },
  { id: "girls-just-want", search: "Cyndi Lauper Girls Just Want to Have Fun", fr: "Girls Just Want to Have Fun – Cyndi Lauper", en: "Girls Just Want to Have Fun – Cyndi Lauper", cat: "pop" },
  { id: "smooth-criminal", search: "Michael Jackson Smooth Criminal", fr: "Smooth Criminal – Michael Jackson", en: "Smooth Criminal – Michael Jackson", cat: "pop" },
  { id: "dreams-fleetwood", search: "Fleetwood Mac Dreams", fr: "Dreams – Fleetwood Mac", en: "Dreams – Fleetwood Mac", cat: "rock" },
  { id: "hotel-california", search: "Eagles Hotel California", fr: "Hotel California – Eagles", en: "Hotel California – Eagles", cat: "rock" },
  { id: "stairway-to-heaven", search: "Led Zeppelin Stairway to Heaven", fr: "Stairway to Heaven – Led Zeppelin", en: "Stairway to Heaven – Led Zeppelin", cat: "rock" },
  { id: "sweet-child-o-mine", search: "Guns N Roses Sweet Child O Mine", fr: "Sweet Child O' Mine – Guns N' Roses", en: "Sweet Child O' Mine – Guns N' Roses", cat: "rock" },
  { id: "back-in-black", search: "AC/DC Back in Black", fr: "Back in Black – AC/DC", en: "Back in Black – AC/DC", cat: "rock" },
  { id: "livin-on-a-prayer", search: "Bon Jovi Livin on a Prayer", fr: "Livin' on a Prayer – Bon Jovi", en: "Livin' on a Prayer – Bon Jovi", cat: "rock" },
  { id: "paint-it-black", search: "The Rolling Stones Paint It Black", fr: "Paint It Black – The Rolling Stones", en: "Paint It Black – The Rolling Stones", cat: "rock" },
  { id: "another-brick", search: "Pink Floyd Another Brick in the Wall", fr: "Another Brick in the Wall – Pink Floyd", en: "Another Brick in the Wall – Pink Floyd", cat: "rock" },
  { id: "come-as-you-are", search: "Nirvana Come as You Are", fr: "Come as You Are – Nirvana", en: "Come as You Are – Nirvana", cat: "rock" },
  { id: "creep", search: "Radiohead Creep", fr: "Creep – Radiohead", en: "Creep – Radiohead", cat: "rock" },
  { id: "wonderwall", search: "Oasis Wonderwall", fr: "Wonderwall – Oasis", en: "Wonderwall – Oasis", cat: "rock" },
  { id: "yellow", search: "Coldplay Yellow", fr: "Yellow – Coldplay", en: "Yellow – Coldplay", cat: "rock" },
  { id: "fix-you", search: "Coldplay Fix You", fr: "Fix You – Coldplay", en: "Fix You – Coldplay", cat: "rock" },
  { id: "with-or-without-you", search: "U2 With or Without You", fr: "With or Without You – U2", en: "With or Without You – U2", cat: "rock" },
  { id: "californication", search: "Red Hot Chili Peppers Californication", fr: "Californication – Red Hot Chili Peppers", en: "Californication – Red Hot Chili Peppers", cat: "rock" },
  { id: "in-the-end", search: "Linkin Park In the End", fr: "In the End – Linkin Park", en: "In the End – Linkin Park", cat: "rock" },
  { id: "holiday-green-day", search: "Green Day Holiday", fr: "Holiday – Green Day", en: "Holiday – Green Day", cat: "rock" },
  { id: "mr-brightside", search: "The Killers Mr Brightside", fr: "Mr. Brightside – The Killers", en: "Mr. Brightside – The Killers", cat: "rock" },
  { id: "sugar-maroon5", search: "Maroon 5 Sugar", fr: "Sugar – Maroon 5", en: "Sugar – Maroon 5", cat: "pop" },
  { id: "counting-stars", search: "OneRepublic Counting Stars", fr: "Counting Stars – OneRepublic", en: "Counting Stars – OneRepublic", cat: "pop" },
  { id: "chandelier", search: "Sia Chandelier", fr: "Chandelier – Sia", en: "Chandelier – Sia", cat: "pop" },
  { id: "stay-with-me", search: "Sam Smith Stay With Me", fr: "Stay With Me – Sam Smith", en: "Stay With Me – Sam Smith", cat: "pop" },
  { id: "someone-like-you", search: "Adele Someone Like You", fr: "Someone Like You – Adele", en: "Someone Like You – Adele", cat: "pop" },
  { id: "hello-adele", search: "Adele Hello", fr: "Hello – Adele", en: "Hello – Adele", cat: "pop" },
  { id: "rehab", search: "Amy Winehouse Rehab", fr: "Rehab – Amy Winehouse", en: "Rehab – Amy Winehouse", cat: "pop" },
  { id: "how-will-i-know", search: "Whitney Houston How Will I Know", fr: "How Will I Know – Whitney Houston", en: "How Will I Know – Whitney Houston", cat: "pop" },
  { id: "cant-stop-the-feeling", search: "Justin Timberlake Cant Stop the Feeling", fr: "Can't Stop the Feeling! – Justin Timberlake", en: "Can't Stop the Feeling! – Justin Timberlake", cat: "pop" },
  { id: "just-the-way-you-are", search: "Bruno Mars Just the Way You Are", fr: "Just the Way You Are – Bruno Mars", en: "Just the Way You Are – Bruno Mars", cat: "pop" },
  { id: "diamonds", search: "Rihanna Diamonds", fr: "Diamonds – Rihanna", en: "Diamonds – Rihanna", cat: "pop" },
  { id: "single-ladies", search: "Beyonce Single Ladies", fr: "Single Ladies – Beyoncé", en: "Single Ladies – Beyoncé", cat: "pop" },
  { id: "shake-it-off", search: "Taylor Swift Shake It Off", fr: "Shake It Off – Taylor Swift", en: "Shake It Off – Taylor Swift", cat: "pop" },
  { id: "blank-space", search: "Taylor Swift Blank Space", fr: "Blank Space – Taylor Swift", en: "Blank Space – Taylor Swift", cat: "pop" },
  { id: "thank-u-next", search: "Ariana Grande Thank U Next", fr: "Thank U, Next – Ariana Grande", en: "Thank U, Next – Ariana Grande", cat: "pop" },
  { id: "bad-guy", search: "Billie Eilish Bad Guy", fr: "Bad Guy – Billie Eilish", en: "Bad Guy – Billie Eilish", cat: "pop" },
  { id: "levitating", search: "Dua Lipa Levitating", fr: "Levitating – Dua Lipa", en: "Levitating – Dua Lipa", cat: "pop" },
  { id: "as-it-was", search: "Harry Styles As It Was", fr: "As It Was – Harry Styles", en: "As It Was – Harry Styles", cat: "pop" },
  { id: "save-your-tears", search: "The Weeknd Save Your Tears", fr: "Save Your Tears – The Weeknd", en: "Save Your Tears – The Weeknd", cat: "pop" },
  { id: "perfect", search: "Ed Sheeran Perfect", fr: "Perfect – Ed Sheeran", en: "Perfect – Ed Sheeran", cat: "pop" },
  { id: "sorry-bieber", search: "Justin Bieber Sorry", fr: "Sorry – Justin Bieber", en: "Sorry – Justin Bieber", cat: "pop" },
  { id: "stitches", search: "Shawn Mendes Stitches", fr: "Stitches – Shawn Mendes", en: "Stitches – Shawn Mendes", cat: "pop" },
  { id: "roar", search: "Katy Perry Roar", fr: "Roar – Katy Perry", en: "Roar – Katy Perry", cat: "pop" },
  { id: "happy-pharrell", search: "Pharrell Williams Happy", fr: "Happy – Pharrell Williams", en: "Happy – Pharrell Williams", cat: "pop" },
  { id: "summer-calvin-harris", search: "Calvin Harris Summer", fr: "Summer – Calvin Harris", en: "Summer – Calvin Harris", cat: "pop" },
  { id: "wake-me-up", search: "Avicii Wake Me Up", fr: "Wake Me Up – Avicii", en: "Wake Me Up – Avicii", cat: "pop" },
  { id: "titanium", search: "David Guetta Titanium", fr: "Titanium – David Guetta", en: "Titanium – David Guetta", cat: "pop" },
  { id: "wonderful-world", search: "Louis Armstrong What a Wonderful World", fr: "What a Wonderful World – Louis Armstrong", en: "What a Wonderful World – Louis Armstrong", cat: "classic" },
  { id: "my-way", search: "Frank Sinatra My Way", fr: "My Way – Frank Sinatra", en: "My Way – Frank Sinatra", cat: "classic" },
  { id: "fly-me-to-the-moon", search: "Frank Sinatra Fly Me to the Moon", fr: "Fly Me to the Moon – Frank Sinatra", en: "Fly Me to the Moon – Frank Sinatra", cat: "classic" },
  { id: "hit-the-road-jack", search: "Ray Charles Hit the Road Jack", fr: "Hit the Road Jack – Ray Charles", en: "Hit the Road Jack – Ray Charles", cat: "classic" },
  { id: "respect", search: "Aretha Franklin Respect", fr: "Respect – Aretha Franklin", en: "Respect – Aretha Franklin", cat: "soul" },
  { id: "whats-going-on", search: "Marvin Gaye Whats Going On", fr: "What's Going On – Marvin Gaye", en: "What's Going On – Marvin Gaye", cat: "soul" },
  { id: "superstition", search: "Stevie Wonder Superstition", fr: "Superstition – Stevie Wonder", en: "Superstition – Stevie Wonder", cat: "soul" },
  { id: "three-little-birds", search: "Bob Marley Three Little Birds", fr: "Three Little Birds – Bob Marley", en: "Three Little Birds – Bob Marley", cat: "reggae" },
  { id: "is-this-love", search: "Bob Marley Is This Love", fr: "Is This Love – Bob Marley", en: "Is This Love – Bob Marley", cat: "reggae" },
  { id: "gimme-gimme-gimme", search: "ABBA Gimme Gimme Gimme", fr: "Gimme! Gimme! Gimme! – ABBA", en: "Gimme! Gimme! Gimme! – ABBA", cat: "disco" },
  { id: "ymca", search: "Village People YMCA", fr: "Y.M.C.A. – Village People", en: "Y.M.C.A. – Village People", cat: "disco" },
  { id: "i-will-survive", search: "Gloria Gaynor I Will Survive", fr: "I Will Survive – Gloria Gaynor", en: "I Will Survive – Gloria Gaynor", cat: "disco" },
  { id: "hot-stuff", search: "Donna Summer Hot Stuff", fr: "Hot Stuff – Donna Summer", en: "Hot Stuff – Donna Summer", cat: "disco" },
  { id: "stayin-alive", search: "Bee Gees Stayin Alive", fr: "Stayin' Alive – Bee Gees", en: "Stayin' Alive – Bee Gees", cat: "disco" },
  { id: "september", search: "Earth Wind and Fire September", fr: "September – Earth, Wind & Fire", en: "September – Earth, Wind & Fire", cat: "disco" },
  { id: "le-freak", search: "Chic Le Freak", fr: "Le Freak – Chic", en: "Le Freak – Chic", cat: "disco" }
];

const DIFFICULTIES = {
  facile: { rounds: 8, playMs: 6000, hardness: 0 },
  moyen: { rounds: 10, playMs: 5000, hardness: 1 },
  difficile: { rounds: 12, playMs: 3500, hardness: 2 },
  impossible: { rounds: 14, playMs: 2500, hardness: 3 }
};

let cfg = DIFFICULTIES.moyen;
let diffKey = "moyen";
const TOTAL_ROUNDS = () => cfg.rounds;

const stimulusEl = document.getElementById("stimulus");
const choicesEl = document.getElementById("choices");
const playBtn = document.getElementById("playBtn");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let best = 0;
let over = false;
let current = null;
let audioEl = null;
let stopTimer = null;

const previewCache = new Map();

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

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS());
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("bestVal").textContent = best;
}

function playCurrentSound() {
  if (!current || !current.previewUrl) return;
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);

  audioEl = new Audio(current.previewUrl);
  audioEl.play().catch(() => {});
  playBtn.classList.add("playing");
  stopTimer = setTimeout(() => {
    if (audioEl) audioEl.pause();
    playBtn.classList.remove("playing");
  }, cfg.playMs);
  audioEl.addEventListener("ended", () => playBtn.classList.remove("playing"));
}

function pickChoices(correct) {
  const sameCat = SONGS.filter(s => s.cat === correct.cat && s.id !== correct.id);
  const otherCat = SONGS.filter(s => s.cat !== correct.cat);
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

async function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();
  choicesEl.innerHTML = "";
  playBtn.classList.remove("playing");

  let attempts = 0;
  let previewUrl = null;
  let song = null;
  while (attempts < 4 && !previewUrl) {
    song = SONGS[Math.floor(Math.random() * SONGS.length)];
    previewUrl = await fetchPreviewUrl(song);
    attempts++;
  }

  if (!previewUrl) return;

  current = { ...song, previewUrl };

  const choices = pickChoices(song);
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.id === current.id, btn);
    choicesEl.appendChild(btn);
  });

  setTimeout(playCurrentSound, 300);
}

function handlePick(correct, btn) {
  if (over) return;
  document.querySelectorAll(".choice-btn").forEach(b => (b.onclick = null));
  if (audioEl) { audioEl.pause(); audioEl = null; }
  clearTimeout(stopTimer);
  playBtn.classList.remove("playing");

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
    localStorage.setItem("bestBlindTest", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "blind-test", score * 10);
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

  startRound();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

playBtn.addEventListener("click", () => playCurrentSound());
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
window.__blindTestDebug = { handlePick, playCurrentSound, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestBlindTest") || 0);
applyLang();
