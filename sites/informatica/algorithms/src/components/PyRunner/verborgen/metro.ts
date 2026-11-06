// Verborgen code voor de machine-learning-route, fase E (op weg naar
// Degrees): het netwerk en buren uit "Een netwerk", precies zoals die stap
// ze laat zien. Zie ./index.ts.
export default String.raw`
# Het metronetwerk en buren uit "Een netwerk" staan hier al klaar.

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
`;
