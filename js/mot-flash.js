import { saveScore } from "../api.js";

const T = {
  fr: {
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    mainMenu: "Menu principal", home: "Accueil", replay: "Rejouer", submit: "Valider",
    done: "⚡ Terminé !", correctAnswers: "Bonnes réponses", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`, placeholder: "Ta réponse"
  },
  en: {
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    mainMenu: "Main menu", home: "Home", replay: "Replay", submit: "Submit",
    done: "⚡ Done!", correctAnswers: "Correct answers", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`, placeholder: "Your answer"
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const ENTRIES = {
  fr: [
    { word: "soleil", clue: "Étoile au centre de notre système" },
    { word: "chat", clue: "Animal domestique qui miaule" },
    { word: "pizza", clue: "Plat italien rond avec du fromage" },
    { word: "avion", clue: "Vole dans le ciel avec des passagers" },
    { word: "livre", clue: "On le lit page par page" },
    { word: "montagne", clue: "Relief très élevé" },
    { word: "ocean", clue: "Grande étendue d'eau salée" },
    { word: "guitare", clue: "Instrument à cordes qu'on gratte" },
    { word: "fromage", clue: "Fait à partir de lait" },
    { word: "parapluie", clue: "Protège de la pluie" },
    { word: "velo", clue: "Deux roues, on pédale" },
    { word: "neige", clue: "Blanche et froide en hiver" },
    { word: "cinema", clue: "Endroit pour regarder des films" },
    { word: "docteur", clue: "Soigne les malades" },
    { word: "jardin", clue: "Endroit où poussent des fleurs" },
    { word: "musique", clue: "On l'écoute avec ses oreilles" },
    { word: "voiture", clue: "Roule sur la route avec un moteur" },
    { word: "fenetre", clue: "On regarde dehors à travers elle" },
    { word: "chocolat", clue: "Sucré, souvent brun" },
    { word: "etoile", clue: "Brille dans le ciel la nuit" },
    { word: "lune", clue: "Tourne autour de la Terre, visible la nuit" },
    { word: "plage", clue: "Sable et mer, parfait pour l'été" },
    { word: "train", clue: "Roule sur des rails" },
    { word: "bateau", clue: "Flotte sur l'eau" },
    { word: "piano", clue: "Instrument à touches noires et blanches" },
    { word: "tigre", clue: "Grand félin rayé" },
    { word: "lion", clue: "Roi de la savane" },
    { word: "elephant", clue: "Le plus gros animal terrestre" },
    { word: "dauphin", clue: "Mammifère marin très intelligent" },
    { word: "papillon", clue: "Insecte aux ailes colorées" },
    { word: "abeille", clue: "Insecte qui fait du miel" },
    { word: "tortue", clue: "Animal lent avec une carapace" },
    { word: "singe", clue: "Grimpe aux arbres et mange des bananes" },
    { word: "serpent", clue: "Reptile sans pattes" },
    { word: "requin", clue: "Poisson prédateur redouté" },
    { word: "baleine", clue: "Le plus grand animal du monde" },
    { word: "renard", clue: "Rusé, roux, vit dans les bois" },
    { word: "loup", clue: "Cousin sauvage du chien" },
    { word: "ours", clue: "Gros mammifère qui hiberne" },
    { word: "hibou", clue: "Oiseau nocturne aux grands yeux" },
    { word: "pomme", clue: "Fruit rouge ou vert, croquant" },
    { word: "banane", clue: "Fruit jaune et courbé" },
    { word: "fraise", clue: "Petit fruit rouge à pépins" },
    { word: "orange", clue: "Fruit sucré et acidulé, agrume" },
    { word: "citron", clue: "Fruit jaune très acide" },
    { word: "ananas", clue: "Fruit tropical à écorce épineuse" },
    { word: "gateau", clue: "Dessert qu'on mange aux anniversaires" },
    { word: "glace", clue: "Dessert froid et sucré" },
    { word: "cafe", clue: "Boisson chaude et amère" },
    { word: "the", clue: "Boisson chaude infusée" },
    { word: "pain", clue: "Aliment de base fait de farine" },
    { word: "beurre", clue: "On le tartine sur le pain" },
    { word: "lait", clue: "Boisson blanche des vaches" },
    { word: "oeuf", clue: "Pondu par les poules" },
    { word: "riz", clue: "Céréale blanche de base asiatique" },
    { word: "pates", clue: "Plat italien à base de farine" },
    { word: "salade", clue: "Plat léger fait de légumes" },
    { word: "soupe", clue: "Plat liquide et chaud" },
    { word: "maison", clue: "Endroit où l'on habite" },
    { word: "appartement", clue: "Logement dans un immeuble" },
    { word: "cuisine", clue: "Pièce où on prépare les repas" },
    { word: "chambre", clue: "Pièce où l'on dort" },
    { word: "salon", clue: "Pièce où l'on reçoit ses invités" },
    { word: "piscine", clue: "Bassin pour nager" },
    { word: "plafond", clue: "Au-dessus de ta tête dans une pièce" },
    { word: "porte", clue: "S'ouvre et se ferme pour entrer" },
    { word: "escalier", clue: "Sert à monter ou descendre" },
    { word: "ascenseur", clue: "Cabine qui monte et descend dans un immeuble" },
    { word: "telephone", clue: "Sert à appeler quelqu'un" },
    { word: "ordinateur", clue: "Machine pour naviguer sur internet" },
    { word: "television", clue: "Écran pour regarder des programmes" },
    { word: "horloge", clue: "Indique l'heure" },
    { word: "montre", clue: "Se porte au poignet pour voir l'heure" },
    { word: "lunettes", clue: "Se portent sur le nez pour mieux voir" },
    { word: "chapeau", clue: "Se porte sur la tête" },
    { word: "chaussures", clue: "Se portent aux pieds" },
    { word: "manteau", clue: "Vêtement chaud pour l'hiver" },
    { word: "valise", clue: "On la remplit pour voyager" },
    { word: "passeport", clue: "Document pour voyager à l'étranger" },
    { word: "helicoptere", clue: "Vole avec des pales qui tournent" },
    { word: "fusee", clue: "Décolle vers l'espace" },
    { word: "planete", clue: "Corps céleste qui tourne autour d'une étoile" },
    { word: "comete", clue: "Objet céleste avec une longue traînée" },
    { word: "nuage", clue: "Flotte dans le ciel, gris ou blanc" },
    { word: "tonnerre", clue: "Bruit fort pendant un orage" },
    { word: "eclair", clue: "Lumière rapide pendant un orage" },
    { word: "vent", clue: "Air qui se déplace" },
    { word: "tempete", clue: "Vent très fort avec de la pluie" },
    { word: "desert", clue: "Endroit très sec et chaud" },
    { word: "foret", clue: "Grande zone remplie d'arbres" },
    { word: "riviere", clue: "Cours d'eau qui coule" },
    { word: "lac", clue: "Étendue d'eau entourée de terre" },
    { word: "ile", clue: "Terre entourée d'eau" },
    { word: "volcan", clue: "Montagne qui peut cracher de la lave" },
    { word: "seisme", clue: "Secousse soudaine du sol" },
    { word: "arbre", clue: "Grand végétal avec un tronc et des feuilles" },
    { word: "fleur", clue: "Partie colorée et parfumée d'une plante" },
    { word: "herbe", clue: "Tapis vert qui pousse dans les jardins" },
    { word: "feuille", clue: "Partie verte d'un arbre ou d'une plante" },
    { word: "racine", clue: "Partie d'une plante sous la terre" }
  ],
  en: [
    { word: "sun", clue: "Star at the center of our solar system" },
    { word: "cat", clue: "Pet animal that meows" },
    { word: "pizza", clue: "Round Italian dish with cheese" },
    { word: "plane", clue: "Flies in the sky with passengers" },
    { word: "book", clue: "You read it page by page" },
    { word: "mountain", clue: "Very high landform" },
    { word: "ocean", clue: "Large body of salt water" },
    { word: "guitar", clue: "String instrument you strum" },
    { word: "cheese", clue: "Made from milk" },
    { word: "umbrella", clue: "Protects you from rain" },
    { word: "bike", clue: "Two wheels, you pedal" },
    { word: "snow", clue: "White and cold in winter" },
    { word: "cinema", clue: "Place to watch movies" },
    { word: "doctor", clue: "Treats sick people" },
    { word: "garden", clue: "Place where flowers grow" },
    { word: "music", clue: "You listen to it with your ears" },
    { word: "car", clue: "Drives on the road with an engine" },
    { word: "window", clue: "You look outside through it" },
    { word: "chocolate", clue: "Sweet, often brown" },
    { word: "star", clue: "Shines in the sky at night" },
    { word: "moon", clue: "Orbits the Earth, visible at night" },
    { word: "beach", clue: "Sand and sea, perfect for summer" },
    { word: "train", clue: "Runs on rails" },
    { word: "boat", clue: "Floats on water" },
    { word: "piano", clue: "Instrument with black and white keys" },
    { word: "tiger", clue: "Big striped wild cat" },
    { word: "lion", clue: "King of the savanna" },
    { word: "elephant", clue: "Largest land animal" },
    { word: "dolphin", clue: "Very intelligent sea mammal" },
    { word: "butterfly", clue: "Insect with colorful wings" },
    { word: "bee", clue: "Insect that makes honey" },
    { word: "turtle", clue: "Slow animal with a shell" },
    { word: "monkey", clue: "Climbs trees and eats bananas" },
    { word: "snake", clue: "Reptile with no legs" },
    { word: "shark", clue: "Feared ocean predator" },
    { word: "whale", clue: "The largest animal on Earth" },
    { word: "fox", clue: "Clever, reddish, lives in the woods" },
    { word: "wolf", clue: "Wild cousin of the dog" },
    { word: "bear", clue: "Large mammal that hibernates" },
    { word: "owl", clue: "Nocturnal bird with big eyes" },
    { word: "apple", clue: "Red or green crunchy fruit" },
    { word: "banana", clue: "Yellow curved fruit" },
    { word: "strawberry", clue: "Small red fruit with seeds" },
    { word: "orange", clue: "Sweet citrus fruit" },
    { word: "lemon", clue: "Very sour yellow fruit" },
    { word: "pineapple", clue: "Spiky tropical fruit" },
    { word: "cake", clue: "Dessert eaten on birthdays" },
    { word: "yogurt", clue: "Creamy dairy snack" },
    { word: "coffee", clue: "Hot bitter drink" },
    { word: "tea", clue: "Hot brewed drink" },
    { word: "bread", clue: "Basic food made from flour" },
    { word: "butter", clue: "Spread on bread" },
    { word: "milk", clue: "White drink from cows" },
    { word: "egg", clue: "Laid by hens" },
    { word: "rice", clue: "Basic white grain, Asian staple" },
    { word: "pasta", clue: "Italian flour-based dish" },
    { word: "salad", clue: "Light dish made of vegetables" },
    { word: "soup", clue: "Hot liquid dish" },
    { word: "house", clue: "Place where you live" },
    { word: "apartment", clue: "Home inside a building" },
    { word: "kitchen", clue: "Room where meals are made" },
    { word: "bedroom", clue: "Room where you sleep" },
    { word: "lounge", clue: "Room where guests are received" },
    { word: "pool", clue: "Basin for swimming" },
    { word: "ceiling", clue: "Above your head in a room" },
    { word: "door", clue: "Opens and closes to enter" },
    { word: "staircase", clue: "Used to go up or down" },
    { word: "elevator", clue: "Cabin that goes up and down in a building" },
    { word: "phone", clue: "Used to call someone" },
    { word: "computer", clue: "Machine to browse the internet" },
    { word: "television", clue: "Screen for watching shows" },
    { word: "clock", clue: "Shows the time" },
    { word: "watch", clue: "Worn on the wrist to see time" },
    { word: "glasses", clue: "Worn on the nose to see better" },
    { word: "hat", clue: "Worn on the head" },
    { word: "shoes", clue: "Worn on your feet" },
    { word: "coat", clue: "Warm clothing for winter" },
    { word: "suitcase", clue: "Packed for traveling" },
    { word: "passport", clue: "Document needed to travel abroad" },
    { word: "helicopter", clue: "Flies using spinning blades" },
    { word: "rocket", clue: "Launches into space" },
    { word: "planet", clue: "Celestial body orbiting a star" },
    { word: "comet", clue: "Celestial object with a long tail" },
    { word: "cloud", clue: "Floats in the sky, gray or white" },
    { word: "thunder", clue: "Loud sound during a storm" },
    { word: "lightning", clue: "Fast flash of light during a storm" },
    { word: "wind", clue: "Moving air" },
    { word: "storm", clue: "Strong wind with rain" },
    { word: "desert", clue: "Very dry and hot place" },
    { word: "forest", clue: "Large area full of trees" },
    { word: "river", clue: "Flowing body of water" },
    { word: "lake", clue: "Body of water surrounded by land" },
    { word: "island", clue: "Land surrounded by water" },
    { word: "volcano", clue: "Mountain that can erupt lava" },
    { word: "earthquake", clue: "Sudden shaking of the ground" },
    { word: "tree", clue: "Tall plant with a trunk and leaves" },
    { word: "flower", clue: "Colorful, scented part of a plant" },
    { word: "grass", clue: "Green carpet that grows in gardens" },
    { word: "leaf", clue: "Green part of a tree or plant" },
    { word: "root", clue: "Underground part of a plant" }
  ]
};

const DIFFICULTIES = {
  facile:     { rounds: 8,  time: 15 },
  moyen:      { rounds: 10, time: 10 },
  difficile:  { rounds: 12, time: 7 },
  impossible: { rounds: 14, time: 5 }
};

let cfg = DIFFICULTIES.moyen;

const clueEl = document.getElementById("clue");
const clueBox = document.getElementById("clueBox");
const inputEl = document.getElementById("answerInput");

let round = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let over = false;
let current = null;
let timeLeft = 0;
let timerInterval = null;

function normalize(s) {
  return s.trim().toLowerCase();
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, cfg.rounds);
  document.getElementById("streakVal").textContent = streak;
  document.getElementById("timeVal").textContent = `${timeLeft}s`;
}

function startRound() {
  if (round >= cfg.rounds) {
    endGame();
    return;
  }
  clueBox.className = "clue-box";
  current = ENTRIES[lang][Math.floor(Math.random() * ENTRIES[lang].length)];
  clueEl.textContent = current.clue;
  inputEl.value = "";
  inputEl.disabled = false;
  inputEl.focus();
  timeLeft = cfg.time;
  updateHud();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateHud();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      streak = 0;
      if (window.CubySfx) CubySfx.fail();
      round++;
      startRound();
    }
  }, 1000);
}

function submit() {
  if (over) return;
  const correct = normalize(inputEl.value) === current.word;
  clearInterval(timerInterval);

  if (correct) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
    clueBox.classList.add("correct");
    if (window.CubySfx) CubySfx.match();
  } else {
    streak = 0;
    clueBox.classList.add("wrong");
    if (window.CubySfx) CubySfx.fail();
  }

  round++;
  setTimeout(startRound, 350);
}

async function endGame() {
  over = true;
  clearInterval(timerInterval);
  inputEl.disabled = true;
  if (window.CubySfx) CubySfx.win();

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "mot-flash", score * 10);
}

function startGame(diff) {
  cfg = DIFFICULTIES[diff];
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

document.getElementById("submitBtn").onclick = submit;
inputEl.addEventListener("keydown", e => {
  if (e.key === "Enter") submit();
});
document.getElementById("replayBtn").onclick = () => location.reload();

function applyLang() {
  document.documentElement.setAttribute("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (T[lang][key] !== undefined) el.textContent = T[lang][key];
  });
  inputEl.placeholder = T[lang].placeholder;
  document.getElementById("langToggle").textContent = lang.toUpperCase();
}

document.getElementById("langToggle").addEventListener("click", () => {
  lang = lang === "fr" ? "en" : "fr";
  localStorage.setItem("cubywearLang", lang);
  applyLang();
});

// Hook de test/debug (aucun impact en jeu normal).
window.__motFlashDebug = { submit, setAnswer: v => (inputEl.value = v), getState: () => ({ round, score, over, current, streak }) };

applyLang();
