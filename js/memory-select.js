function startMemory(level) {
  const settings = {
    facile:   { time: 10 * 60, tries: null,      grid: 4 },
    moyen:    { time: 3 * 60,  tries: 20,       grid: 4 },
    difficile:{ time: 2 * 60,  tries: 10,       grid: 6 },
    impossible:{ time: 1 * 60, tries: 5,        grid: 6 }
  };

  localStorage.setItem("memorySettings", JSON.stringify(settings[level]));

  window.location.href = "memory.html";
}