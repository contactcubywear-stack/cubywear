import { saveScore } from "../api.js";

const WORDS_FR = {
  "Animaux": ["chat","chien","lion","tigre","elephant","girafe","singe","zebre","panda","requin"],
  "Fruits": ["pomme","banane","orange","fraise","ananas","mangue","citron","cerise","raisin","kiwi"],
  "Pays": ["france","canada","japon","bresil","mexique","italie","espagne","chine","egypte","maroc"],
  "Metiers": ["docteur","pompier","avocat","chanteur","peintre","boulanger","fermier","pilote","dentiste","journaliste"],
  "Sports": ["football","tennis","natation","hockey","boxe","judo","cyclisme","escalade","ski","golf"],
  "Objets": ["telephone","ordinateur","chaise","table","lampe","miroir","horloge","valise","parapluie","ceinture"],
  "Nature": ["montagne","riviere","foret","ocean","volcan","desert","cascade","glacier","prairie","marais"],
  "Couleurs": ["rouge","bleu","jaune","vert","orange","violet","rose","noir","blanc","gris"],
  "Nourriture": ["pizza","pates","fromage","chocolat","gateau","salade","soupe","omelette","croissant","baguette"],
  "Technologie": ["internet","robot","satellite","drone","imprimante","clavier","ecran","batterie","casque","camera"]
};

const WORDS_EN = {
  "Animals": ["cat","dog","lion","tiger","elephant","giraffe","monkey","zebra","panda","shark"],
  "Fruits": ["apple","banana","orange","strawberry","pineapple","mango","lemon","cherry","grape","kiwi"],
  "Countries": ["france","canada","japan","brazil","mexico","italy","spain","china","egypt","morocco"],
  "Jobs": ["doctor","firefighter","lawyer","singer","painter","baker","farmer","pilot","dentist","journalist"],
  "Sports": ["football","tennis","swimming","hockey","boxing","judo","cycling","climbing","skiing","golf"],
  "Objects": ["telephone","computer","chair","table","lamp","mirror","clock","suitcase","umbrella","belt"],
  "Nature": ["mountain","river","forest","ocean","volcano","desert","waterfall","glacier","prairie","marsh"],
  "Colors": ["red","blue","yellow","green","orange","purple","pink","black","white","gray"],
  "Food": ["pizza","pasta","cheese","chocolate","cake","salad","soup","omelette","croissant","baguette"],
  "Technology": ["internet","robot","satellite","drone","printer","keyboard","screen","battery","headset","camera"]
};

const COMPLEX_WORDS_FR = [
  "extraordinaire","kaleidoscope","hippopotame","ornithorynque","psychologique",
  "contradictoire","incomprehensible","environnement","developpement","independance",
  "caracteristique","responsabilite","communication","investissement","administration",
  "transformation","experimentation","reconnaissance","gouvernement","philosophie",
  "mathematiques","architecture","technologique","entrepreneur","bibliotheque",
  "correspondance","independant","revolutionnaire","spectaculaire","systematique",
  "authentique","hypothetique","catastrophe","opportunite","controverse",
  "phenomene","atmosphere","thermodynamique","electromagnetique","biodiversite",
  "mondialisation","industrialisation","decentralisation","interdisciplinaire","microorganisme",
  "kilometrage","parallelepipede","anticonformiste","disproportionne","incontournable"
];

const COMPLEX_WORDS_EN = [
  "extraordinary","kaleidoscope","hippopotamus","platypus","psychological",
  "contradictory","incomprehensible","environment","development","independence",
  "characteristic","responsibility","communication","investment","administration",
  "transformation","experimentation","recognition","government","philosophy",
  "mathematics","architecture","technological","entrepreneur","library",
  "correspondence","independent","revolutionary","spectacular","systematic",
  "authentic","hypothetical","catastrophe","opportunity","controversy",
  "phenomenon","atmosphere","thermodynamics","electromagnetic","biodiversity",
  "globalization","industrialization","decentralization","interdisciplinary","microorganism",
  "mileage","parallelepiped","unconventional","disproportionate","unavoidable"
];

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer",
    themeLabel: t => `Thème : ${t}`,
    winTitle: "🎉 Bravo, tu as trouvé !", loseTitle: "😕 Perdu !",
    wordWas: w => `Le mot était : ${w}`,
    words: WORDS_FR, complex: COMPLEX_WORDS_FR
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay",
    themeLabel: t => `Theme: ${t}`,
    winTitle: "🎉 You found it!", loseTitle: "😕 You lost!",
    wordWas: w => `The word was: ${w}`,
    words: WORDS_EN, complex: COMPLEX_WORDS_EN
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const PART_SETS = {
  facile:     ["hair","eyes","mouth","nose","head","body","armL","armR","legL","legR"],
  moyen:      ["head","body","armL","armR","legL","legR"],
  difficile:  ["head","body","armL","armR","legL","legR"],
  impossible: ["head","body","armL","armR","legL","legR"]
};

const SHOW_THEME = { facile: true, moyen: true, difficile: false, impossible: false };

const ALPHABET_FR = "AZERTYUIOPQSDFGHJKLMWXCVBN".split("").sort();
const ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const themeEl = document.getElementById("theme");
const keyboardEl = document.getElementById("keyboard");
const wordDisplayEl = document.getElementById("wordDisplay");
const triesEl = document.getElementById("triesLeft");
const correctEl = document.getElementById("correctCount");

let word = "";
let currentTheme = null;
let parts = [];
let maxWrong = 6;
let guessed = new Set();
let wrong = 0;
let correct = 0;
let over = false;
let difficulty = "facile";

function pickWord(diff) {
  if (diff === "impossible") {
    const list = T[lang].complex;
    const w = list[Math.floor(Math.random() * list.length)];
    return { word: w.toUpperCase(), theme: null };
  }
  const themes = Object.keys(T[lang].words);
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const list = T[lang].words[theme];
  const w = list[Math.floor(Math.random() * list.length)];
  return { word: w.toUpperCase(), theme };
}

function renderWord() {
  wordDisplayEl.innerHTML = [...word].map(l =>
    guessed.has(l) ? `<span class="letter-pop">${l}</span>` : "_"
  ).join(" ");
}

function updateFigure() {
  parts.forEach((name, i) => {
    document.querySelectorAll(`.part-${name}`).forEach(el => el.classList.toggle("show", i < wrong));
  });
}

async function guessLetter(letter, btn) {
  if (over) return;
  btn.disabled = true;

  if (word.includes(letter)) {
    guessed.add(letter);
    btn.classList.add("correct");
    correct++;
    correctEl.textContent = correct;
    renderWord();
    if (window.CubySfx) CubySfx.match();

    if ([...word].every(l => guessed.has(l))) {
      return endGame("win");
    }
  } else {
    wrong++;
    btn.classList.add("wrong");
    triesEl.textContent = maxWrong - wrong;
    updateFigure();
    if (window.CubySfx) CubySfx.fail();

    if (wrong >= maxWrong) {
      return endGame("lose");
    }
  }
}

async function endGame(result) {
  over = true;
  document.querySelectorAll(".key").forEach(btn => (btn.disabled = true));

  if (window.CubySfx) (result === "win" ? CubySfx.win() : CubySfx.lose());

  document.getElementById("resultTitle").textContent =
    result === "win" ? T[lang].winTitle : T[lang].loseTitle;
  document.getElementById("resultWord").textContent = T[lang].wordWas(word);
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "pendu", result === "win" ? Math.max(20 - wrong * 2, 5) : 0);
}

function startGame(diff) {
  difficulty = diff;
  const picked = pickWord(diff);
  word = picked.word;
  currentTheme = picked.theme;
  parts = PART_SETS[diff];
  maxWrong = parts.length;
  guessed = new Set();
  wrong = 0;
  correct = 0;
  over = false;

  document.querySelectorAll(".part").forEach(el => el.classList.remove("show"));

  themeEl.hidden = !SHOW_THEME[diff];
  if (SHOW_THEME[diff]) themeEl.textContent = T[lang].themeLabel(currentTheme);

  triesEl.textContent = maxWrong;
  correctEl.textContent = 0;

  buildKeyboard();

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  renderWord();
}

function buildKeyboard() {
  const alphabet = lang === "en" ? ALPHABET_EN : ALPHABET_FR;
  keyboardEl.innerHTML = "";
  alphabet.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.textContent = letter;
    btn.onclick = () => guessLetter(letter, btn);
    keyboardEl.appendChild(btn);
  });
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
  // Une partie est en cours dans l'autre langue : on relance proprement
  // avec un nouveau mot de la langue choisie plutôt que de mélanger les deux.
  startGame(difficulty);
});

applyLang();
