const LEVEL_LABELS = {
  facile: "Facile",
  moyen: "Moyen",
  difficile: "Difficile",
  impossible: "Impossible"
};

function startMemory(level) {
  const settings = {
    facile:   { time: 5 * 60,  tries: 30, grid: 4 },
    moyen:    { time: 3 * 60,  tries: 10, grid: 4 },
    difficile:{ time: 1 * 60,  tries: 5,  grid: 6 },
    impossible:{ time: 30,     tries: 3,  grid: 6 }
  };

  localStorage.setItem("memorySettings", JSON.stringify({ ...settings[level], level: LEVEL_LABELS[level] }));

  window.location.href = "memory.html";
}