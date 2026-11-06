// Verborgen code voor de machine-learning-route: plaatjes van het fruit uit
// fase B, voor "Laat de buren stemmen" (de k buren) en "Een neuron dat zelf
// leert" (de grens van het neuron). Het tekenen is matplotlib, en dat hoort
// niet bij de route; daarom staat het hier, en roept de leerling alleen
// teken_buren of teken_grens aan. PyRunner laadt matplotlib ook voor
// verborgen code (zie ../matplotlib.ts). Zie ./index.ts.
export default String.raw`
# Tekenen staat hier al klaar. Het is matplotlib: dat hoef je voor deze
# route niet te kennen, maar je mag het lezen.
import matplotlib.pyplot as plt

KLEUR = {"appel": "tab:red", "banaan": "gold", "citroen": "tab:green"}
VORM = {"appel": "o", "banaan": "s", "citroen": "^"}

def soortnaam(soort):
    if soort == 1:
        return "banaan"
    if soort == 0:
        return "appel"
    return soort

def teken_voorbeelden(voorbeelden):
    getekend = []
    for maten, soort in voorbeelden:
        naam = soortnaam(soort)
        label = None
        if naam not in getekend:
            label = naam
            getekend.append(naam)
        plt.scatter(maten[0], maten[1], color=KLEUR.get(naam, "gray"),
                    marker=VORM.get(naam, "o"), s=90, edgecolors="black", label=label)
    plt.xlabel("lengte (cm)")
    plt.ylabel("breedte (cm)")

def teken_buren(voorbeelden, nieuw, k):
    plt.figure(figsize=(6, 4))
    teken_voorbeelden(voorbeelden)
    paren = []
    for maten, soort in voorbeelden:
        afstand = abs(nieuw[0] - maten[0]) + abs(nieuw[1] - maten[1])
        paren.append((afstand, soort, maten))
    for afstand, soort, maten in sorted(paren)[:k]:
        plt.plot([nieuw[0], maten[0]], [nieuw[1], maten[1]], color="gray", linestyle="--")
    plt.scatter(nieuw[0], nieuw[1], color="black", marker="X", s=140, label="nieuw")
    # Naast het plaatje, zodat hij nooit een stuk fruit bedekt.
    plt.legend(loc="upper left", bbox_to_anchor=(1, 1))
    plt.title("De " + str(k) + " dichtstbijzijnde buren van " + str(nieuw))
    plt.show()

def teken_grens(voorbeelden, gewichten, bias):
    plt.figure(figsize=(6, 4))
    teken_voorbeelden(voorbeelden)
    lengtes = [maten[0] for maten, soort in voorbeelden]
    breedtes = [maten[1] for maten, soort in voorbeelden]
    links, rechts = min(lengtes) - 2, max(lengtes) + 2
    onder, boven = min(breedtes) - 2, max(breedtes) + 2
    if gewichten[1] != 0:
        # De grens: daar is de som precies 0.
        y_links = -(gewichten[0] * links + bias) / gewichten[1]
        y_rechts = -(gewichten[0] * rechts + bias) / gewichten[1]
        plt.plot([links, rechts], [y_links, y_rechts], color="black", label="grens van het neuron")
    plt.xlim(links, rechts)
    plt.ylim(onder, boven)
    # Naast het plaatje, zodat hij nooit een stuk fruit bedekt.
    plt.legend(loc="upper left", bbox_to_anchor=(1, 1))
    plt.title("Wat het neuron geleerd heeft")
    plt.show()
`;
