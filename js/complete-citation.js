import { saveScore } from "../api.js";

const T = {
  fr: {
    home: "Accueil", mainMenu: "Menu principal", replay: "Rejouer",
    hint: "Choisis la bonne suite",
    chooseDifficulty: "Choisis la difficulté",
    easy: "Facile", medium: "Moyen", hard: "Difficile", impossible: "Impossible",
    done: "💬 Terminé !", score: "Score", bestStreak: "Meilleure série",
    round: (n, total) => `${n}/${total}`
  },
  en: {
    home: "Home", mainMenu: "Main menu", replay: "Replay",
    hint: "Pick the right continuation",
    chooseDifficulty: "Choose a difficulty",
    easy: "Easy", medium: "Medium", hard: "Hard", impossible: "Impossible",
    done: "💬 Done!", score: "Score", bestStreak: "Best streak",
    round: (n, total) => `${n}/${total}`
  }
};

function getLang() {
  return localStorage.getItem("cubywearLang") === "en" ? "en" : "fr";
}
let lang = getLang();

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
  { id: "petit-oiseau", begin: "Petit à petit, l'oiseau fait son", end: "nid", cat: "proverbe" },

  { id: "oeuf-boeuf", begin: "Qui vole un œuf, vole un", end: "bœuf", cat: "proverbe" },
  { id: "chat-echaude", begin: "Chat échaudé craint l'eau", end: "froide", cat: "proverbe" },
  { id: "peau-ours", begin: "Il ne faut pas vendre la peau de l'ours avant de l'", end: "avoir tué", cat: "proverbe" },
  { id: "chiens-chats", begin: "Les chiens ne font pas des", end: "chats", cat: "proverbe" },
  { id: "semer-vent", begin: "Qui sème le vent récolte la", end: "tempête", cat: "proverbe" },
  { id: "pierre-roule", begin: "Pierre qui roule n'amasse pas", end: "mousse", cat: "proverbe" },
  { id: "habit-moine", begin: "L'habit ne fait pas le", end: "moine", cat: "proverbe" },
  { id: "pluie-beau-temps", begin: "Après la pluie, le beau", end: "temps", cat: "proverbe" },
  { id: "tel-pere", begin: "Tel père, tel", end: "fils", cat: "proverbe" },
  { id: "mieux-tard", begin: "Mieux vaut tard que", end: "jamais", cat: "proverbe" },
  { id: "qui-ne-risque", begin: "Qui ne risque rien n'a", end: "rien", cat: "proverbe" },
  { id: "loin-yeux", begin: "Loin des yeux, loin du", end: "cœur", cat: "proverbe" },
  { id: "murs-oreilles", begin: "Les murs ont des", end: "oreilles", cat: "proverbe" },
  { id: "midi-porte", begin: "Chacun voit midi à sa", end: "porte", cat: "proverbe" },
  { id: "battre-fer", begin: "Il faut battre le fer tant qu'il est", end: "chaud", cat: "proverbe" },
  { id: "trop-embrasse", begin: "Qui trop embrasse mal", end: "étreint", cat: "proverbe" },
  { id: "temps-argent", begin: "Le temps, c'est de l'", end: "argent", cat: "proverbe" },
  { id: "ventre-affame", begin: "Ventre affamé n'a point d'", end: "oreilles", cat: "proverbe" },
  { id: "bon-entendeur", begin: "À bon entendeur,", end: "salut", cat: "proverbe" },
  { id: "fumee-feu", begin: "Il n'y a pas de fumée sans", end: "feu", cat: "proverbe" },
  { id: "argent-bonheur", begin: "L'argent ne fait pas le", end: "bonheur", cat: "proverbe" },
  { id: "chasse-place", begin: "Qui va à la chasse perd sa", end: "place", cat: "proverbe" },
  { id: "brille-or", begin: "Tout ce qui brille n'est pas", end: "or", cat: "proverbe" },
  { id: "bons-comptes", begin: "Les bons comptes font les bons", end: "amis", cat: "proverbe" },
  { id: "omelette-oeufs", begin: "On ne fait pas d'omelette sans casser des", end: "œufs", cat: "proverbe" },
  { id: "prevenir-guerir", begin: "Mieux vaut prévenir que", end: "guérir", cat: "proverbe" },
  { id: "chose-promise", begin: "Chose promise, chose", end: "due", cat: "proverbe" },
  { id: "deux-avis", begin: "Deux avis valent mieux qu'", end: "un", cat: "proverbe" },
  { id: "tourner-langue", begin: "Il faut tourner sa langue sept fois dans sa bouche avant de", end: "parler", cat: "proverbe" },
  { id: "charite", begin: "Charité bien ordonnée commence par soi-", end: "même", cat: "proverbe" },
  { id: "vouloir-pouvoir", begin: "Vouloir, c'est", end: "pouvoir", cat: "proverbe" },
  { id: "aime-chatie", begin: "Qui aime bien châtie", end: "bien", cat: "proverbe" },
  { id: "grands-esprits", begin: "Les grands esprits se", end: "rencontrent", cat: "proverbe" },
  { id: "tout-vient", begin: "Tout vient à point à qui sait", end: "attendre", cat: "proverbe" },
  { id: "exactitude", begin: "L'exactitude est la politesse des", end: "rois", cat: "proverbe" },
  { id: "linge-sale", begin: "Il faut laver son linge sale en", end: "famille", cat: "proverbe" },
  { id: "pas-nouvelles", begin: "Pas de nouvelles, bonnes", end: "nouvelles", cat: "proverbe" },
  { id: "oeil-dent", begin: "Œil pour œil, dent pour", end: "dent", cat: "proverbe" },
  { id: "ressemble-assemble", begin: "Qui se ressemble s'", end: "assemble", cat: "proverbe" },
  { id: "jours-ressemblent", begin: "Les jours se suivent et ne se", end: "ressemblent pas", cat: "proverbe" },
  { id: "faute-avouee", begin: "Faute avouée est à moitié", end: "pardonnée", cat: "proverbe" },
  { id: "seul-mal-accompagne", begin: "Il vaut mieux être seul que mal", end: "accompagné", cat: "proverbe" },
  { id: "rira-dernier", begin: "Rira bien qui rira", end: "le dernier", cat: "proverbe" },
  { id: "hirondelle", begin: "Une hirondelle ne fait pas le", end: "printemps", cat: "proverbe" },
  { id: "casse-verres", begin: "Qui casse les verres les", end: "paie", cat: "proverbe" },
  { id: "appetit", begin: "L'appétit vient en", end: "mangeant", cat: "proverbe" },
  { id: "paroles-envolent", begin: "Les paroles s'envolent, les écrits", end: "restent", cat: "proverbe" },
  { id: "petit-poisson", begin: "Petit poisson deviendra", end: "grand", cat: "proverbe" },
  { id: "chaque-jour", begin: "À chaque jour suffit sa", end: "peine", cat: "proverbe" },
  { id: "lendemain", begin: "Ne remets pas au lendemain ce que tu peux faire le", end: "jour même", cat: "proverbe" },
  { id: "voyager-loin", begin: "Qui veut voyager loin ménage sa", end: "monture", cat: "proverbe" },
  { id: "prudence", begin: "Prudence est mère de", end: "sûreté", cat: "proverbe" },
  { id: "qui-ne-dit-mot", begin: "Qui ne dit mot", end: "consent", cat: "proverbe" },
  { id: "tout-nouveau", begin: "Tout nouveau, tout", end: "beau", cat: "proverbe" },
  { id: "bien-mal-acquis", begin: "Bien mal acquis ne profite", end: "jamais", cat: "proverbe" },
  { id: "temps-au-temps", begin: "Il faut savoir donner du temps au", end: "temps", cat: "proverbe" },
  { id: "vin-tire", begin: "Quand le vin est tiré, il faut le", end: "boire", cat: "proverbe" },
  { id: "midi-quatorze", begin: "Chercher midi à quatorze", end: "heures", cat: "proverbe" },
  { id: "eau-riviere", begin: "L'eau va toujours à la", end: "rivière", cat: "proverbe" },
  { id: "pied-mur-macon", begin: "C'est au pied du mur qu'on voit le", end: "maçon", cat: "proverbe" },
  { id: "mauvaise-herbe", begin: "Mauvaise herbe croît", end: "toujours", cat: "proverbe" },
  { id: "qui-vivra-verra", begin: "Qui vivra", end: "verra", cat: "proverbe" },
  { id: "necessite-loi", begin: "Nécessité fait", end: "loi", cat: "proverbe" },
  { id: "patience-longueur", begin: "Patience et longueur de temps font plus que force ni", end: "rage", cat: "proverbe" },
  { id: "qui-terre-guerre", begin: "Qui terre a,", end: "guerre a", cat: "proverbe" },
  { id: "main-lave", begin: "Une main lave l'autre et les deux lavent le", end: "visage", cat: "proverbe" },

  { id: "foret-lointaine", begin: "Dans la forêt lointaine, on entend le", end: "coucou", cat: "comptine" },
  { id: "promenons-bois", begin: "Promenons-nous dans les bois, pendant que le loup n'y est", end: "pas", cat: "comptine" },
  { id: "planter-choux", begin: "Savez-vous planter les choux, à la mode, à la", end: "mode de chez nous", cat: "comptine" },
  { id: "il-court-furet", begin: "Il court, il court, le", end: "furet", cat: "comptine" },
  { id: "fais-dodo", begin: "Fais dodo, Colas mon petit", end: "frère", cat: "comptine" },
  { id: "bon-vent", begin: "V'là le bon vent, v'là le joli", end: "vent", cat: "comptine" },
  { id: "marlbrough", begin: "Marlbrough s'en va-t-en", end: "guerre", cat: "comptine" },
  { id: "poule-mur", begin: "Une poule sur un", end: "mur", cat: "comptine" },
  { id: "cadet-rousselle", begin: "Cadet Rousselle a trois", end: "maisons", cat: "comptine" },
  { id: "compere-guilleri", begin: "Compère Guilleri, te lairras-tu", end: "mourir", cat: "comptine" },
  { id: "do-re-mi", begin: "Do, ré, mi, fa, sol, la,", end: "si, do", cat: "comptine" },
  { id: "bonjour-cousine", begin: "Bonjour ma cousine, bonjour mon cousin", end: "germain", cat: "comptine" },
  { id: "il-etait-fois", begin: "Il était une fois, dans un pays très", end: "lointain", cat: "comptine" },

  { id: "pense-suis", begin: "Je pense, donc je", end: "suis", cat: "citation" },
  { id: "enfer-autres", begin: "L'enfer, c'est les", end: "autres", cat: "citation" },
  { id: "liberte-nom", begin: "Liberté, j'écris ton", end: "nom", cat: "citation" },
  { id: "demain-aube", begin: "Demain, dès l'aube, à l'heure où blanchit la", end: "campagne", cat: "citation" },
  { id: "coeur-raisons", begin: "Le cœur a ses raisons que la raison ne connaît", end: "point", cat: "citation" },
  { id: "amour-preuves", begin: "Il n'y a pas d'amour, il n'y a que des preuves d'", end: "amour", cat: "citation" },
  { id: "homme-libre", begin: "L'homme est né libre, et partout il est dans les", end: "fers", cat: "citation" },
  { id: "petit-prince", begin: "On ne voit bien qu'avec le cœur, l'essentiel est invisible pour les", end: "yeux", cat: "citation" }
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
  { id: "apple", begin: "An apple a day keeps the doctor", end: "away", cat: "proverb" },

  { id: "chickens-hatch", begin: "Don't count your chickens before they", end: "hatch", cat: "proverb" },
  { id: "grass-greener", begin: "The grass is always greener on the other", end: "side", cat: "proverb" },
  { id: "cloud-lining", begin: "Every cloud has a silver", end: "lining", cat: "proverb" },
  { id: "better-late", begin: "Better late than", end: "never", cat: "proverb" },
  { id: "practice-perfect", begin: "Practice makes", end: "perfect", cat: "proverb" },
  { id: "honesty-policy", begin: "Honesty is the best", end: "policy", cat: "proverb" },
  { id: "two-wrongs", begin: "Two wrongs don't make a", end: "right", cat: "proverb" },
  { id: "pen-sword", begin: "The pen is mightier than the", end: "sword", cat: "proverb" },
  { id: "will-way", begin: "Where there's a will, there's a", end: "way", cat: "proverb" },
  { id: "judge-book", begin: "You can't judge a book by its", end: "cover", cat: "proverb" },
  { id: "absence-fonder", begin: "Absence makes the heart grow", end: "fonder", cat: "proverb" },
  { id: "glitters-gold", begin: "All that glitters is not", end: "gold", cat: "proverb" },
  { id: "birds-feather", begin: "Birds of a feather flock", end: "together", cat: "proverb" },
  { id: "eggs-basket", begin: "Don't put all your eggs in one", end: "basket", cat: "proverb" },
  { id: "dog-day", begin: "Every dog has its", end: "day", cat: "proverb" },
  { id: "look-leap", begin: "Look before you", end: "leap", cat: "proverb" },
  { id: "no-news", begin: "No news is good", end: "news", cat: "proverb" },
  { id: "sight-mind", begin: "Out of sight, out of", end: "mind", cat: "proverb" },
  { id: "time-wounds", begin: "Time heals all", end: "wounds", cat: "proverb" },
  { id: "rains-pours", begin: "When it rains, it", end: "pours", cat: "proverb" },
  { id: "cake-too", begin: "You can't have your cake and eat it", end: "too", cat: "proverb" },
  { id: "curiosity-cat", begin: "Curiosity killed the", end: "cat", cat: "proverb" },
  { id: "spilled-milk", begin: "Don't cry over spilled", end: "milk", cat: "proverb" },
  { id: "easy-come", begin: "Easy come, easy", end: "go", cat: "proverb" },
  { id: "great-minds", begin: "Great minds think", end: "alike", cat: "proverb" },
  { id: "broke-fix", begin: "If it ain't broke, don't fix", end: "it", cat: "proverb" },
  { id: "takes-two", begin: "It takes two to", end: "tango", cat: "proverb" },
  { id: "friends-close", begin: "Keep your friends close and your enemies", end: "closer", cat: "proverb" },
  { id: "laughter-medicine", begin: "Laughter is the best", end: "medicine", cat: "proverb" },
  { id: "sleeping-dogs", begin: "Let sleeping dogs", end: "lie", cat: "proverb" },
  { id: "money-trees", begin: "Money doesn't grow on", end: "trees", cat: "proverb" },
  { id: "necessity-invention", begin: "Necessity is the mother of", end: "invention", cat: "proverb" },
  { id: "once-bitten", begin: "Once bitten, twice", end: "shy", cat: "proverb" },
  { id: "rome-day", begin: "Rome wasn't built in a", end: "day", cat: "proverb" },
  { id: "apple-tree", begin: "The apple doesn't fall far from the", end: "tree", cat: "proverb" },
  { id: "no-place-home", begin: "There's no place like", end: "home", cat: "proverb" },
  { id: "cooks-broth", begin: "Too many cooks spoil the", end: "broth", cat: "proverb" },
  { id: "going-tough", begin: "When the going gets tough, the tough get", end: "going", cat: "proverb" },
  { id: "reap-sow", begin: "You reap what you", end: "sow", cat: "proverb" },
  { id: "watched-pot", begin: "A watched pot never", end: "boils", cat: "proverb" },
  { id: "beggars-choosers", begin: "Beggars can't be", end: "choosers", cat: "proverb" },
  { id: "better-safe", begin: "Better safe than", end: "sorry", cat: "proverb" },
  { id: "blood-water", begin: "Blood is thicker than", end: "water", cat: "proverb" },
  { id: "cleanliness", begin: "Cleanliness is next to", end: "godliness", cat: "proverb" },
  { id: "bite-hand", begin: "Don't bite the hand that feeds", end: "you", cat: "proverb" },
  { id: "walk-mile", begin: "Don't judge a man until you walk a mile in his", end: "shoes", cat: "proverb" },
  { id: "fortune-bold", begin: "Fortune favors the", end: "bold", cat: "proverb" },
  { id: "good-things-wait", begin: "Good things come to those who", end: "wait", cat: "proverb" },
  { id: "laughs-best", begin: "He who laughs last, laughs", end: "best", cat: "proverb" },
  { id: "ignorance-bliss", begin: "Ignorance is", end: "bliss", cat: "proverb" },
  { id: "knowledge-power", begin: "Knowledge is", end: "power", cat: "proverb" },
  { id: "busy-plans", begin: "Life is what happens when you're busy making other", end: "plans", cat: "proverb" },
  { id: "slow-steady", begin: "Slow and steady wins the", end: "race", cat: "proverb" },
  { id: "still-waters", begin: "Still waters run", end: "deep", cat: "proverb" },
  { id: "squeaky-wheel", begin: "The squeaky wheel gets the", end: "grease", cat: "proverb" },
  { id: "skin-cat", begin: "There's more than one way to skin a", end: "cat", cat: "proverb" },
  { id: "variety-spice", begin: "Variety is the spice of", end: "life", cat: "proverb" },
  { id: "horse-water", begin: "You can lead a horse to water but you can't make it", end: "drink", cat: "proverb" },
  { id: "friend-indeed", begin: "A friend in need is a friend", end: "indeed", cat: "proverb" },
  { id: "put-off", begin: "Don't put off until tomorrow what you can do", end: "today", cat: "proverb" },
  { id: "apple-eye", begin: "The apple of my", end: "eye", cat: "proverb" },
  { id: "break-a", begin: "Break a", end: "leg", cat: "proverb" },

  { id: "baa-baa", begin: "Baa, baa, black", end: "sheep", cat: "rhyme" },
  { id: "miss-muffet", begin: "Little Miss Muffet sat on a", end: "tuffet", cat: "rhyme" },
  { id: "old-woman-shoe", begin: "There was an old woman who lived in a", end: "shoe", cat: "rhyme" },
  { id: "little-piggy", begin: "This little piggy went to", end: "market", cat: "rhyme" },
  { id: "ring-rosie", begin: "Ring around the rosie, a pocket full of", end: "posies", cat: "rhyme" },
  { id: "london-bridge", begin: "London Bridge is falling", end: "down", cat: "rhyme" },
  { id: "itsy-bitsy", begin: "Itsy bitsy spider climbed up the water", end: "spout", cat: "rhyme" },
  { id: "pat-a-cake", begin: "Pat-a-cake, pat-a-cake, baker's", end: "man", cat: "rhyme" },
  { id: "simple-simon", begin: "Simple Simon met a", end: "pieman", cat: "rhyme" },
  { id: "wee-willie", begin: "Wee Willie Winkie runs through the", end: "town", cat: "rhyme" },
  { id: "jack-horner", begin: "Little Jack Horner sat in a", end: "corner", cat: "rhyme" },
  { id: "peter-piper", begin: "Peter Piper picked a peck of pickled", end: "peppers", cat: "rhyme" },
  { id: "sixpence", begin: "Sing a song of sixpence, a pocket full of", end: "rye", cat: "rhyme" },
  { id: "star-light", begin: "Star light, star bright, first star I see", end: "tonight", cat: "rhyme" },
  { id: "buckle-shoe", begin: "One, two, buckle my", end: "shoe", cat: "rhyme" },

  { id: "have-a-dream", begin: "I have a", end: "dream", cat: "quote" },
  { id: "giant-leap", begin: "That's one small step for man, one giant leap for", end: "mankind", cat: "quote" },
  { id: "think-am", begin: "I think, therefore I", end: "am", cat: "quote" },
  { id: "ask-not", begin: "Ask not what your country can do for", end: "you", cat: "quote" },
  { id: "fear-itself", begin: "The only thing we have to fear is fear", end: "itself", cat: "quote" },
  { id: "elementary", begin: "Elementary, my dear", end: "Watson", cat: "quote" },
  { id: "looking-at-you", begin: "Here's looking at", end: "you, kid", cat: "quote" },
  { id: "odds-favor", begin: "May the odds be ever in your", end: "favor", cat: "quote" },
  { id: "winter-coming", begin: "Winter is", end: "coming", cat: "quote" }
];

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
  return Math.max(cfg.time - round * 0.2, cfg.time - 4);
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
    wrongPool = [...sameCat.sort(() => Math.random() - 0.5).slice(0, 1), ...otherCat];
  } else {
    wrongPool = sameCat.length >= 3 ? sameCat : [...sameCat, ...otherCat];
  }

  const seenLabels = new Set([correct[lang]]);
  const wrong = [];
  for (const p of wrongPool.sort(() => Math.random() - 0.5)) {
    if (wrong.length >= 3) break;
    if (seenLabels.has(p[lang])) continue;
    seenLabels.add(p[lang]);
    wrong.push(p);
  }
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function startRound() {
  if (round >= TOTAL_ROUNDS()) {
    endGame();
    return;
  }
  clearInterval(timerInterval);
  stimulusEl.className = "quiz-stimulus text-quiz";
  updateHud();
  choicesEl.innerHTML = "";

  const src = lang === "fr" ? QUOTES_FR : QUOTES_EN;
  const q = src[Math.floor(Math.random() * src.length)];
  const pool = src.map(x => ({ id: x.id, fr: x.end, en: x.end, cat: x.cat }));
  current = pool.find(p => p.id === q.id);
  stimulusEl.textContent = `« ${q.begin}... »`;

  const choices = pickChoices(pool, current);
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
  setTimeout(startRound, 1100);
}

async function endGame() {
  over = true;
  if (window.CubySfx) CubySfx.win();

  if (score > best) {
    best = score;
    localStorage.setItem("bestCompleteCitation", best);
  }

  document.getElementById("statScore").textContent = score;
  document.getElementById("statStreak").textContent = bestStreak;
  document.getElementById("resultModal").hidden = false;
  await saveScore("CW-BLK-1-0001", "complete-citation", score * 10);
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
window.__completeCitationDebug = { handlePick, startGame, getState: () => ({ round, score, over, current, streak, diffKey }) };

best = Number(localStorage.getItem("bestCompleteCitation") || 0);
applyLang();
