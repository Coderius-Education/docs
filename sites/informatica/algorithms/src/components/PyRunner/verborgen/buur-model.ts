// Verborgen code voor de machine-learning-route, fase B ("Een eigen
// Shopping"): wat scikit-learn bij Shopping voor je doet. voorspel_lijst
// speelt fit en predict van KNeighborsClassifier(n_neighbors=1), met de
// kenmerken en labels als twee lijsten, zoals CS50 ze geeft. De leerling
// schrijft het lezen en het beoordelen zelf; dit stuk is niet het antwoord
// van een CS50-functie. Zie ./index.ts.
export default String.raw`
# Dit doet scikit-learn bij Shopping voor je, met n_neighbors=1:
# fit onthoudt de oefenset, predict zoekt bij elk nieuw ding de
# dichtstbijzijnde buur. Je mag het lezen.

def afstand(a, b):
    totaal = 0
    for x, y in zip(a, b):
        totaal = totaal + abs(x - y)
    return totaal

def voorspel_lijst(oefen_kenmerken, oefen_labels, nieuwe):
    voorspellingen = []
    for nieuw in nieuwe:
        beste_afstand = 1000000
        beste_label = None
        for kenmerk, label in zip(oefen_kenmerken, oefen_labels):
            d = afstand(nieuw, kenmerk)
            if d < beste_afstand:
                beste_afstand = d
                beste_label = label
        voorspellingen.append(beste_label)
    return voorspellingen
`;
