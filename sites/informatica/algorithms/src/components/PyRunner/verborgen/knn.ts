// Verborgen code voor de machine-learning-route, fase B (laat de buren
// stemmen vanaf "Bekijk de buren", eerlijk testen en klaar voor Shopping):
// afstand en voorspel, precies het antwoord van de opdracht in
// ml-afstand/02-k-buren/03-de-winnaar. Zo staat in de editor alleen het
// testen. Zie ./index.ts.
export default String.raw`
# afstand en voorspel uit "Laat de buren stemmen" staan hier al klaar.

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
`;
