const veld = document.querySelector("#bericht-veld");
const teller = document.querySelector("#teller");

veld.addEventListener("input", function () {
    teller.textContent = 80 - veld.value.length + " tekens over";
});
