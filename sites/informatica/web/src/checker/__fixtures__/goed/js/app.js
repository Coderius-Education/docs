const knop = document.getElementById("uitvoer");
let teller = 0;

function groet() {
  teller = teller + 1;
  if (teller > 1) {
    knop.textContent = "Je klikte al " + teller + " keer";
  } else {
    knop.textContent = "Hallo";
  }
  knop.classList.add("actief");
}
