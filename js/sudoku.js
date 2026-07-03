import { saveScore } from "../api.js";

const puzzle = [
  ["1", "", "", "4"],
  ["", "", "", ""],
  ["", "", "1", ""],
  ["4", "", "2", "3"]
];

const solution = [
  ["1","2","3","4"],
  ["2","3","4","1"],
  ["3","4","1","2"],
  ["4","1","2","3"]
];

const grid = document.getElementById("grid");

puzzle.forEach((row, r) => {
  const tr = document.createElement("tr");
  row.forEach((cell, c) => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.value = cell;
    input.disabled = cell !== "";
    td.appendChild(input);
    tr.appendChild(td);
  });
  grid.appendChild(tr);
});

document.getElementById("validate").onclick = async () => {
  let correct = true;

  [...grid.rows].forEach((tr, r) => {
    [...tr.cells].forEach((td, c) => {
      if (td.firstChild.value !== solution[r][c]) correct = false;
    });
  });

  alert(correct ? "Bravo !" : "Incorrect !");
  await saveScore("CW-BLK-1-0001", "sudoku", correct ? 20 : 0);
  window.location.href = "../index.html";
};
