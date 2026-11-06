// Verborgen code voor de machine-learning-route, fase C ("Op weg naar
// PageRank", de laatste stap): het weermodel, het seizoen, kansen_morgen
// precies zoals het antwoord van "kansen mengen", en het doorrekenen tot het
// stilstaat uit "tot het stilstaat", nu als functie met kansen_morgen in
// plaats van het model. Zo staat in de editor alleen de steekproef die de
// leerling schrijft. Zie ./index.ts.
export default String.raw`
# Het model, het seizoen en kansen_morgen uit "kansen mengen" staan hier al
# klaar, en berekend() rekent door tot het stilstaat, zoals in
# "tot het stilstaat".

model = {
    "zon": {"zon": 0.5, "wolken": 0.3, "regen": 0.2},
    "wolken": {"zon": 0.3, "wolken": 0.4, "regen": 0.3},
    "regen": {"zon": 0.2, "wolken": 0.4, "regen": 0.4},
}
herfst = {"zon": 0.1, "wolken": 0.4, "regen": 0.5}

def kansen_morgen(vandaag):
    kansen = {}
    for morgen in herfst:
        kansen[morgen] = 0.8 * model[vandaag][morgen] + 0.2 * herfst[morgen]
    return kansen

def berekend():
    verdeling = {"zon": 1, "wolken": 0, "regen": 0}
    verschil = 1
    while verschil >= 0.001:
        nieuw = {}
        for morgen in herfst:
            kans = 0
            for vandaag in herfst:
                kans = kans + verdeling[vandaag] * kansen_morgen(vandaag)[morgen]
            nieuw[morgen] = kans
        verschil = 0
        for weer in nieuw:
            verschil = max(verschil, abs(nieuw[weer] - verdeling[weer]))
        verdeling = nieuw
    return verdeling
`;
