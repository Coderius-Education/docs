// Verborgen code voor de machine-learning-route, fase E (op weg naar
// Degrees): het netwerk en buren uit "Een netwerk", Knoop uit "Een knoop" en
// Wachtrij uit "Een wachtrij als klasse", precies zoals die stappen ze
// bouwen. Het netwerk staat ook in ./metro.ts. Zie ./index.ts.
export default String.raw`
# Het metronetwerk, buren, Knoop en Wachtrij uit de vorige stappen staan hier
# al klaar.

verbindingen = [
    ("rood", "Centraal", "Markt"),
    ("rood", "Markt", "Haven"),
    ("rood", "Haven", "Strand"),
    ("blauw", "Zuid", "Markt"),
    ("blauw", "Markt", "Park"),
    ("blauw", "Park", "Noord"),
    ("groen", "Centraal", "Park"),
    ("groen", "Park", "Stadion"),
    ("geel", "Haven", "Museum"),
    ("geel", "Museum", "Stadion"),
]

def buren(station):
    resultaat = []
    for lijn, a, b in verbindingen:
        if a == station:
            resultaat.append((lijn, b))
        if b == station:
            resultaat.append((lijn, a))
    return resultaat

class Knoop:
    def __init__(self, toestand, ouder, actie):
        self.toestand = toestand
        self.ouder = ouder
        self.actie = actie

class Wachtrij:
    def __init__(self):
        self.lijst = []

    def voeg_toe(self, knoop):
        self.lijst.append(knoop)

    def haal_eruit(self):
        return self.lijst.pop(0)

    def is_leeg(self):
        return len(self.lijst) == 0

    def bevat(self, toestand):
        for knoop in self.lijst:
            if knoop.toestand == toestand:
                return True
        return False
`;
