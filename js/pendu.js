import { saveScore } from "../api.js";

const WORDS = {
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

const COMPLEX_WORDS = [
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

// Facile ajoute des détails au visage (plus d'essais avant de perdre),
// les autres niveaux gardent le bonhomme classique en 6 étapes.
const PART_SETS = {
  facile:     ["hair","eyes","mouth","nose","head","body","armL","armR","legL","legR"],
  moyen:      ["head","body","armL","armR","legL","legR"],
  difficile:  ["head","body","armL","armR","legL","legR"],
  impossible: ["head","body","armL","armR","legL","legR"]
};

const SHOW_THEME = { facile: true, moyen: true, difficile: false, impossible: false };

const ALPHABET = "AZERTYUIOPQSDFGHJKLMWXCVBN".split("").sort();

const themeEl = document.getElementById("theme");
const keyboardEl = document.getElementById("keyboard");
const wordDisplayEl = document.getElementById("wordDisplay");
const triesEl = document.getElementById("triesLeft");

let word = "";
let parts = [];
let maxWrong = 6;
let guessed = new Set();
let wrong = 0;
let over = false;

function pickWord(difficulty) {
  if (difficulty === "impossible") {
    const w = COMPLEX_WORDS[Math.floor(Math.random() * COMPLEX_WORDS.length)];
    return { word: w.toUpperCase(), theme: null };
  }
  const themes = Object.keys(WORDS);
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const list = WORDS[theme];
  const w = list[Math.floor(Math.random() * list.length)];
  return { word: w.toUpperCase(), theme };
}

function renderWord() {
  wordDisplayEl.textContent = [...word].map(l => (guessed.has(l) ? l : "_")).join(" ");
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
    renderWord();

    if ([...word].every(l => guessed.has(l))) {
      return endGame("win");
    }
  } else {
    wrong++;
    btn.classList.add("wrong");
    triesEl.textContent = `Essais restants : ${maxWrong - wrong}`;
    updateFigure();

    if (wrong >= maxWrong) {
      return endGame("lose");
    }
  }
}

async function endGame(result) {
  over = true;
  document.querySelectorAll(".key").forEach(btn => (btn.disabled = true));

  document.getElementById("resultTitle").textContent =
    result === "win" ? "🎉 Bravo, tu as trouvé !" : "😕 Perdu !";
  document.getElementById("resultWord").textContent = `Le mot était : ${word}`;
  document.getElementById("resultModal").hidden = false;

  await saveScore("CW-BLK-1-0001", "pendu", result === "win" ? Math.max(20 - wrong * 2, 5) : 0);
}

function startGame(difficulty) {
  const picked = pickWord(difficulty);
  word = picked.word;
  parts = PART_SETS[difficulty];
  maxWrong = parts.length;
  guessed = new Set();
  wrong = 0;
  over = false;

  document.querySelectorAll(".part").forEach(el => el.classList.remove("show"));

  themeEl.hidden = !SHOW_THEME[difficulty];
  if (SHOW_THEME[difficulty]) themeEl.textContent = `Thème : ${picked.theme}`;

  triesEl.textContent = `Essais restants : ${maxWrong}`;

  keyboardEl.innerHTML = "";
  ALPHABET.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "key";
    btn.textContent = letter;
    btn.onclick = () => guessLetter(letter, btn);
    keyboardEl.appendChild(btn);
  });

  document.getElementById("difficultySelect").hidden = true;
  document.getElementById("gameArea").hidden = false;
  renderWord();
}

document.querySelectorAll("[data-difficulty]").forEach(btn => {
  btn.onclick = () => startGame(btn.dataset.difficulty);
});

document.getElementById("replayBtn").onclick = () => location.reload();
