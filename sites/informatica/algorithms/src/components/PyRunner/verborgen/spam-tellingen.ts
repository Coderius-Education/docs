// Verborgen code voor de machine-learning-route, fase A (het spamfilter dat
// leert, "de score" en "wat telt het zwaarst"): de twee tellingen die de
// leerling in "twee tellingen" maakte. Met de tellingen in de editor stond
// de loop die hij moest aanpassen onder de rand van het veld. Zie ./index.ts.
export default String.raw`
# De tellingen uit "twee tellingen": hoe vaak elk woord in de spam en in
# de gewone berichten voorkwam.

spam = {
    "win": 1, "nu": 2, "gratis": 2, "geld": 2,
    "prijs": 1, "klik": 2, "hier": 1, "voor": 1,
}
gewoon = {
    "zie": 1, "je": 3, "morgen": 1, "op": 1, "school": 2,
    "heb": 1, "het": 1, "huiswerk": 1, "al": 1, "kom": 1,
    "nu": 1, "naar": 1,
}
`;
