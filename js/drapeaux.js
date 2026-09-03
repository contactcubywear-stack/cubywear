import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    done: "🚩 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    done: "🚩 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

const COUNTRIES = [
  { flag: "🇫🇷", fr: "France", en: "France" },
  { flag: "🇺🇸", fr: "États-Unis", en: "United States" },
  { flag: "🇨🇦", fr: "Canada", en: "Canada" },
  { flag: "🇲🇽", fr: "Mexique", en: "Mexico" },
  { flag: "🇧🇷", fr: "Brésil", en: "Brazil" },
  { flag: "🇦🇷", fr: "Argentine", en: "Argentina" },
  { flag: "🇬🇧", fr: "Royaume-Uni", en: "United Kingdom" },
  { flag: "🇩🇪", fr: "Allemagne", en: "Germany" },
  { flag: "🇮🇹", fr: "Italie", en: "Italy" },
  { flag: "🇪🇸", fr: "Espagne", en: "Spain" },
  { flag: "🇵🇹", fr: "Portugal", en: "Portugal" },
  { flag: "🇳🇱", fr: "Pays-Bas", en: "Netherlands" },
  { flag: "🇧🇪", fr: "Belgique", en: "Belgium" },
  { flag: "🇨🇭", fr: "Suisse", en: "Switzerland" },
  { flag: "🇸🇪", fr: "Suède", en: "Sweden" },
  { flag: "🇳🇴", fr: "Norvège", en: "Norway" },
  { flag: "🇬🇷", fr: "Grèce", en: "Greece" },
  { flag: "🇷🇺", fr: "Russie", en: "Russia" },
  { flag: "🇨🇳", fr: "Chine", en: "China" },
  { flag: "🇯🇵", fr: "Japon", en: "Japan" },
  { flag: "🇰🇷", fr: "Corée du Sud", en: "South Korea" },
  { flag: "🇮🇳", fr: "Inde", en: "India" },
  { flag: "🇦🇺", fr: "Australie", en: "Australia" },
  { flag: "🇪🇬", fr: "Égypte", en: "Egypt" },
  { flag: "🇲🇦", fr: "Maroc", en: "Morocco" },
  { flag: "🇿🇦", fr: "Afrique du Sud", en: "South Africa" },
  { flag: "🇰🇪", fr: "Kenya", en: "Kenya" },
  { flag: "🇹🇷", fr: "Turquie", en: "Turkey" },
  { flag: "🇮🇪", fr: "Irlande", en: "Ireland" },
  { flag: "🇵🇱", fr: "Pologne", en: "Poland" },

  { flag: "🇩🇰", fr: "Danemark", en: "Denmark" },
  { flag: "🇫🇮", fr: "Finlande", en: "Finland" },
  { flag: "🇮🇸", fr: "Islande", en: "Iceland" },
  { flag: "🇦🇹", fr: "Autriche", en: "Austria" },
  { flag: "🇨🇿", fr: "Tchéquie", en: "Czechia" },
  { flag: "🇭🇺", fr: "Hongrie", en: "Hungary" },
  { flag: "🇷🇴", fr: "Roumanie", en: "Romania" },
  { flag: "🇺🇦", fr: "Ukraine", en: "Ukraine" },
  { flag: "🇭🇷", fr: "Croatie", en: "Croatia" },
  { flag: "🇷🇸", fr: "Serbie", en: "Serbia" },
  { flag: "🇸🇰", fr: "Slovaquie", en: "Slovakia" },
  { flag: "🇸🇮", fr: "Slovénie", en: "Slovenia" },
  { flag: "🇧🇬", fr: "Bulgarie", en: "Bulgaria" },
  { flag: "🇱🇹", fr: "Lituanie", en: "Lithuania" },
  { flag: "🇱🇻", fr: "Lettonie", en: "Latvia" },
  { flag: "🇪🇪", fr: "Estonie", en: "Estonia" },
  { flag: "🇱🇺", fr: "Luxembourg", en: "Luxembourg" },
  { flag: "🇲🇹", fr: "Malte", en: "Malta" },
  { flag: "🇨🇾", fr: "Chypre", en: "Cyprus" },
  { flag: "🇧🇦", fr: "Bosnie-Herzégovine", en: "Bosnia and Herzegovina" },
  { flag: "🇦🇱", fr: "Albanie", en: "Albania" },
  { flag: "🇲🇩", fr: "Moldavie", en: "Moldova" },
  { flag: "🇧🇾", fr: "Biélorussie", en: "Belarus" },
  { flag: "🇲🇨", fr: "Monaco", en: "Monaco" },
  { flag: "🇦🇩", fr: "Andorre", en: "Andorra" },
  { flag: "🇱🇮", fr: "Liechtenstein", en: "Liechtenstein" },
  { flag: "🇸🇲", fr: "Saint-Marin", en: "San Marino" },
  { flag: "🇻🇦", fr: "Vatican", en: "Vatican City" },

  { flag: "🇻🇳", fr: "Vietnam", en: "Vietnam" },
  { flag: "🇹🇭", fr: "Thaïlande", en: "Thailand" },
  { flag: "🇮🇩", fr: "Indonésie", en: "Indonesia" },
  { flag: "🇲🇾", fr: "Malaisie", en: "Malaysia" },
  { flag: "🇸🇬", fr: "Singapour", en: "Singapore" },
  { flag: "🇵🇭", fr: "Philippines", en: "Philippines" },
  { flag: "🇰🇭", fr: "Cambodge", en: "Cambodia" },
  { flag: "🇱🇦", fr: "Laos", en: "Laos" },
  { flag: "🇲🇲", fr: "Birmanie", en: "Myanmar" },
  { flag: "🇧🇩", fr: "Bangladesh", en: "Bangladesh" },
  { flag: "🇵🇰", fr: "Pakistan", en: "Pakistan" },
  { flag: "🇱🇰", fr: "Sri Lanka", en: "Sri Lanka" },
  { flag: "🇳🇵", fr: "Népal", en: "Nepal" },
  { flag: "🇲🇳", fr: "Mongolie", en: "Mongolia" },
  { flag: "🇰🇿", fr: "Kazakhstan", en: "Kazakhstan" },
  { flag: "🇺🇿", fr: "Ouzbékistan", en: "Uzbekistan" },
  { flag: "🇦🇫", fr: "Afghanistan", en: "Afghanistan" },
  { flag: "🇮🇶", fr: "Irak", en: "Iraq" },
  { flag: "🇮🇷", fr: "Iran", en: "Iran" },
  { flag: "🇮🇱", fr: "Israël", en: "Israel" },
  { flag: "🇸🇦", fr: "Arabie Saoudite", en: "Saudi Arabia" },
  { flag: "🇦🇪", fr: "Émirats Arabes Unis", en: "United Arab Emirates" },
  { flag: "🇶🇦", fr: "Qatar", en: "Qatar" },
  { flag: "🇰🇼", fr: "Koweït", en: "Kuwait" },
  { flag: "🇯🇴", fr: "Jordanie", en: "Jordan" },
  { flag: "🇱🇧", fr: "Liban", en: "Lebanon" },
  { flag: "🇸🇾", fr: "Syrie", en: "Syria" },
  { flag: "🇾🇪", fr: "Yémen", en: "Yemen" },
  { flag: "🇴🇲", fr: "Oman", en: "Oman" },

  { flag: "🇳🇬", fr: "Nigeria", en: "Nigeria" },
  { flag: "🇬🇭", fr: "Ghana", en: "Ghana" },
  { flag: "🇪🇹", fr: "Éthiopie", en: "Ethiopia" },
  { flag: "🇹🇿", fr: "Tanzanie", en: "Tanzania" },
  { flag: "🇺🇬", fr: "Ouganda", en: "Uganda" },
  { flag: "🇩🇿", fr: "Algérie", en: "Algeria" },
  { flag: "🇹🇳", fr: "Tunisie", en: "Tunisia" },
  { flag: "🇱🇾", fr: "Libye", en: "Libya" },
  { flag: "🇸🇳", fr: "Sénégal", en: "Senegal" },
  { flag: "🇨🇮", fr: "Côte d'Ivoire", en: "Ivory Coast" },
  { flag: "🇨🇲", fr: "Cameroun", en: "Cameroon" },
  { flag: "🇿🇼", fr: "Zimbabwe", en: "Zimbabwe" },
  { flag: "🇿🇲", fr: "Zambie", en: "Zambia" },
  { flag: "🇲🇿", fr: "Mozambique", en: "Mozambique" },
  { flag: "🇦🇴", fr: "Angola", en: "Angola" },
  { flag: "🇲🇬", fr: "Madagascar", en: "Madagascar" },
  { flag: "🇷🇼", fr: "Rwanda", en: "Rwanda" },
  { flag: "🇳🇦", fr: "Namibie", en: "Namibia" },
  { flag: "🇧🇼", fr: "Botswana", en: "Botswana" },
  { flag: "🇨🇩", fr: "RD Congo", en: "DR Congo" },

  { flag: "🇨🇱", fr: "Chili", en: "Chile" },
  { flag: "🇨🇴", fr: "Colombie", en: "Colombia" },
  { flag: "🇵🇪", fr: "Pérou", en: "Peru" },
  { flag: "🇻🇪", fr: "Venezuela", en: "Venezuela" },
  { flag: "🇪🇨", fr: "Équateur", en: "Ecuador" },
  { flag: "🇧🇴", fr: "Bolivie", en: "Bolivia" },
  { flag: "🇺🇾", fr: "Uruguay", en: "Uruguay" },
  { flag: "🇵🇾", fr: "Paraguay", en: "Paraguay" },
  { flag: "🇨🇺", fr: "Cuba", en: "Cuba" },
  { flag: "🇯🇲", fr: "Jamaïque", en: "Jamaica" },
  { flag: "🇵🇦", fr: "Panama", en: "Panama" },
  { flag: "🇨🇷", fr: "Costa Rica", en: "Costa Rica" },
  { flag: "🇬🇹", fr: "Guatemala", en: "Guatemala" },
  { flag: "🇩🇴", fr: "République Dominicaine", en: "Dominican Republic" },
  { flag: "🇭🇹", fr: "Haïti", en: "Haiti" },
  { flag: "🇭🇳", fr: "Honduras", en: "Honduras" },
  { flag: "🇸🇻", fr: "Salvador", en: "El Salvador" },
  { flag: "🇳🇮", fr: "Nicaragua", en: "Nicaragua" },
  { flag: "🇹🇹", fr: "Trinité-et-Tobago", en: "Trinidad and Tobago" },

  { flag: "🇳🇿", fr: "Nouvelle-Zélande", en: "New Zealand" },
  { flag: "🇫🇯", fr: "Fidji", en: "Fiji" },
  { flag: "🇵🇬", fr: "Papouasie-Nouvelle-Guinée", en: "Papua New Guinea" }
];

const TOTAL_ROUNDS = 10;

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

function timeForRound() {
  return Math.max(9 - round * 0.4, 4);
}

function updateHud() {
  document.getElementById("roundVal").textContent = T[lang].round(round + 1, TOTAL_ROUNDS);
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
  const others = COUNTRIES.filter(c => c.fr !== correct.fr).sort(() => Math.random() - 0.5).slice(0, 3);
  return [...others, correct].sort(() => Math.random() - 0.5);
}

function startRound() {
  if (round >= TOTAL_ROUNDS) {
    endGame();
    return;
  }
  stimulusEl.className = "quiz-stimulus";
  updateHud();

  current = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  stimulusEl.textContent = current.flag;

  const choices = pickChoices(current);
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.textContent = choice[lang];
    btn.onclick = () => handlePick(choice.fr === current.fr, btn);
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
  setTimeout(startRound, 700);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestDrapeaux", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "drapeaux", score * 10);
}

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
window.__drapeauxDebug = { handlePick, getState: () => ({ round, score, over, current, streak }) };

best = Number(localStorage.getItem("bestDrapeaux") || 0);
applyLang();

// Ajoute la barre de temps sous le stimulus (créée en JS pour rester dans le style.css partagé).
const timerWrap = document.createElement("div");
timerWrap.className = "timer-bar";
timerWrap.innerHTML = `<div class="timer-fill" id="timerFill"></div>`;
stimulusEl.after(timerWrap);

startRound();
