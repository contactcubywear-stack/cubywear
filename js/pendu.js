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

const MAX_WRONG = 6;
const ALPHABET = "AZERTYUIOPQSDFGHJKLMWXCVBN".split("").sort();

const themes = Object.keys(WORDS);
const theme = themes[Math.floor(Math.random() * themes.length)];
const wordList = WORDS[theme];
const word = wordList[Math.floor(Math.random() * wordList.length)].toUpperCase();

const guessed = new Set();
let wrong = 0;
let over = false;

document.getElementById("theme").textContent = `Thème : ${theme}`;

const keyboardEl = document.getElementById("keyboard");
const wordDisplayEl = document.getElementById("wordDisplay");
const triesEl = document.getElementById("triesLeft");

ALPHABET.forEach(letter => {
  const btn = document.createElement("button");
  btn.className = "key";
  btn.textContent = letter;
  btn.onclick = () => guessLetter(letter, btn);
  keyboardEl.appendChild(btn);
});

function renderWord() {
  wordDisplayEl.textContent = [...word].map(l => (guessed.has(l) ? l : "_")).join(" ");
}

function updateFigure() {
  for (let i = 0; i < MAX_WRONG; i++) {
    document.querySelector(`.part-${i}`).classList.toggle("show", i < wrong);
  }
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
    triesEl.textContent = `Essais restants : ${MAX_WRONG - wrong}`;
    updateFigure();

    if (wrong >= MAX_WRONG) {
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

document.getElementById("replayBtn").onclick = () => location.reload();

renderWord();
