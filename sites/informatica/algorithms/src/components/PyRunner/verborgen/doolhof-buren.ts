// Verborgen code voor de machine-learning-route, fase E (de kortste weg met
// een wachtrij): buren uit "De buren van een vakje", precies zoals die les
// hem bouwt. Hij leest het doolhof uit de zichtbare code. Zie ./index.ts.
export default String.raw`
# buren uit "De buren van een vakje" staat hier al klaar. Hij gebruikt het
# doolhof uit de editor.

def buren(vakje):
    rij, kolom = vakje
    resultaat = []
    for r, k in [(rij - 1, kolom), (rij + 1, kolom), (rij, kolom - 1), (rij, kolom + 1)]:
        if r >= 0 and r < len(doolhof) and k >= 0 and k < len(doolhof[0]):
            if doolhof[r][k] != "#":
                resultaat.append((r, k))
    return resultaat
`;
