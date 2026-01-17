const map = document.getElementById("map");
const dialogue = document.getElementById("dialogue");
const portrait = document.getElementById("portrait");
const inventory = document.getElementById("inventory");

map.textContent =
`....................
....................
....@...............
....................
....................
....................`;

portrait.textContent =
`  O
 /|\\
 / \\`;

inventory.textContent =
`- Potion
- Key`;

dialogue.textContent = "Welcome to the ASCII project.";

document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", e => {
    dialogue.textContent = `Pressed ${btn.textContent}`;
  });
});