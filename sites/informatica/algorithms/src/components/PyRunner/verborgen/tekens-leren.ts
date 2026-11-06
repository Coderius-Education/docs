// Verborgen code voor de machine-learning-route, fase F ("Op weg naar
// Traffic", stap 6, de uitgangen leren): wat de leerling in de stappen
// ervoor schreef, precies zoals in de antwoorden daar. naar_getallen uit
// stap 1 (een plaatje als getallen), neuron uit "ja of nee", leer uit "een
// functie leer", som_van en herken uit stap 4 (de grootste wint), lees_tekens
// uit stap 5 (de tekens inlezen), en de tekens zelf. Zie ./index.ts; dezelfde
// stukken staan ook in ./tekens-toetsen.ts.
export default String.raw`
# Uit de vorige stappen: een plaatje als getallen, het neuron, leer,
# de grootste wint en de tekens inlezen.

def naar_getallen(plaatje):
    invoer = []
    for rij in plaatje:
        for teken in rij:
            if teken == "#":
                invoer.append(1)
            else:
                invoer.append(0)
    return invoer

def neuron(invoer, gewichten, bias):
    som = bias
    for i in range(len(invoer)):
        som = som + invoer[i] * gewichten[i]
    if som > 0:
        return 1
    return 0

def leer(voorbeelden, rondes):
    gewichten = [0] * len(voorbeelden[0][0])
    bias = 0
    for ronde in range(rondes):
        for invoer, doel in voorbeelden:
            fout = doel - neuron(invoer, gewichten, bias)
            for i in range(len(invoer)):
                gewichten[i] = gewichten[i] + fout * invoer[i]
            bias = bias + fout
    return gewichten, bias

def som_van(invoer, gewichten, bias):
    som = bias
    for i in range(len(invoer)):
        som = som + invoer[i] * gewichten[i]
    return som

def herken(invoer, alle_gewichten, biases):
    uitgangen = []
    for n in range(len(alle_gewichten)):
        uitgangen.append(som_van(invoer, alle_gewichten[n], biases[n]))
    beste = 0
    for i in range(len(uitgangen)):
        if uitgangen[i] > uitgangen[beste]:
            beste = i
    return beste

def lees_tekens(mappen):
    plaatjes = []
    labels = []
    for soort in mappen:
        for plaatje in mappen[soort]:
            plaatjes.append(naar_getallen(plaatje))
            labels.append(soort)
    return plaatjes, labels

# De tekens: elk teken zoals het hoort, en negen keer met één pixel anders.
soorten = ["|", "-", "x", "o"]
tekens = [
    [".#.", ".#.", ".#."],
    ["...", "###", "..."],
    ["#.#", ".#.", "#.#"],
    ["###", "#.#", "###"],
]

def met_een_foutje(plaatje):
    varianten = []
    for r in range(3):
        for k in range(3):
            nieuw = []
            for i in range(3):
                rij = plaatje[i]
                if i == r:
                    if rij[k] == "#":
                        rij = rij[:k] + "." + rij[k + 1:]
                    else:
                        rij = rij[:k] + "#" + rij[k + 1:]
                nieuw.append(rij)
            varianten.append(nieuw)
    return varianten

mappen = {}
for soort in range(len(soorten)):
    mappen[soort] = [tekens[soort]] + met_een_foutje(tekens[soort])
`;
