export function bindInput({ onMove, onA, onB, onStart, onSelect }) {
  // Touch buttons
  document.querySelectorAll("#dpad button").forEach(btn => {
    const dir = btn.getAttribute("data-dir");
    btn.addEventListener("click", () => onMove(dir));
  });

  document.getElementById("btnA").addEventListener("click", onA);
  document.getElementById("btnB").addEventListener("click", onB);
  document.getElementById("btnStart").addEventListener("click", onStart);
  document.getElementById("btnSelect").addEventListener("click", onSelect);

  // Keyboard
  window.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "ArrowUp") onMove("up");
    else if (k === "ArrowDown") onMove("down");
    else if (k === "ArrowLeft") onMove("left");
    else if (k === "ArrowRight") onMove("right");
    else if (k === "z" || k === "Z") onA();
    else if (k === "x" || k === "X") onB();
    else if (k === "Enter") onStart();
    else if (k === "Shift") onSelect();
  }, { passive: true });
}