// Verborgen code voor de machine-learning-route, fase F ("Aan de slag met
// Traffic", de laatste stap van "Op weg naar Traffic"): alles van
// ./tekens-leren.ts, plus leer_netwerk uit stap 6 (de uitgangen leren) en
// splits, dat doet wat train_test_split in Traffic doet. Zie ./index.ts.
export default String.raw`
# Uit de vorige stappen: een plaatje als getallen, het neuron, leer,
# de grootste wint, de tekens inlezen en leer_netwerk.
import random

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

def leer_netwerk(plaatjes, labels, aantal_soorten, rondes):
    alle_gewichten = []
    biases = []
    for soort in range(aantal_soorten):
        voorbeelden = []
        for i in range(len(plaatjes)):
            if labels[i] == soort:
                voorbeelden.append((plaatjes[i], 1))
            else:
                voorbeelden.append((plaatjes[i], 0))
        gewichten, bias = leer(voorbeelden, rondes)
        alle_gewichten.append(gewichten)
        biases.append(bias)
    return alle_gewichten, biases

# splits doet wat train_test_split in Traffic doet: de plaatjes schudden,
# en een deel apart houden als toets.
def splits(plaatjes, labels, toets_deel):
    paren = []
    for i in range(len(plaatjes)):
        paren.append((plaatjes[i], labels[i]))
    random.shuffle(paren)
    aantal_toets = int(len(paren) * toets_deel)
    oefen_plaatjes = []
    toets_plaatjes = []
    oefen_labels = []
    toets_labels = []
    for i in range(len(paren)):
        plaatje, label = paren[i]
        if i < len(paren) - aantal_toets:
            oefen_plaatjes.append(plaatje)
            oefen_labels.append(label)
        else:
            toets_plaatjes.append(plaatje)
            toets_labels.append(label)
    return oefen_plaatjes, toets_plaatjes, oefen_labels, toets_labels

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
