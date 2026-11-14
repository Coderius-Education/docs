// Verborgen code voor de machine-learning-route, fase B (eerlijk testen,
// vanaf "Oefenen en toetsen"): afstand en voorspel zoals in ./knn.ts, en de
// 24 stuks fruit die de leerling in "Zo test je niet" ziet. Met het fruit in
// de editor stond de code die de leerling aanpast onder de rand van het
// veld. Zie ./index.ts.
export default String.raw`
# afstand en voorspel uit "Laat de buren stemmen" staan hier al klaar,
# en de 24 stuks fruit uit "Oefenen en toetsen".

def afstand(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def voorspel(nieuw, voorbeelden, k):
    paren = []
    for maten, soort in voorbeelden:
        paren.append((afstand(nieuw, maten), soort))
    buren = sorted(paren)[:k]
    stemmen = {}
    for d, soort in buren:
        if soort in stemmen:
            stemmen[soort] = stemmen[soort] + 1
        else:
            stemmen[soort] = 1
    winnaar = ""
    meeste = 0
    for soort in stemmen:
        if stemmen[soort] > meeste:
            meeste = stemmen[soort]
            winnaar = soort
    return winnaar

fruit = [
    ((8, 8), "appel"), ((9, 8), "appel"), ((7, 7), "appel"),
    ((8, 7), "appel"), ((9, 9), "appel"), ((7, 8), "appel"),
    ((10, 9), "appel"), ((8, 9), "appel"),
    ((18, 4), "banaan"), ((20, 4), "banaan"), ((17, 3), "banaan"),
    ((19, 4), "banaan"), ((16, 4), "banaan"), ((21, 5), "banaan"),
    ((18, 3), "banaan"), ((17, 4), "banaan"),
    ((9, 6), "citroen"), ((10, 6), "citroen"),
    ((8, 6), "citroen"), ((9, 5), "citroen"),
    ((10, 7), "citroen"), ((11, 6), "citroen"),
    ((8, 5), "citroen"), ((10, 5), "citroen"),
]
`;
