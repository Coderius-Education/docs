// Verborgen code voor de machine-learning-route, fase D (Op weg naar Nim):
// de gang van de muis. Een stap zetten, kijken of de wandeling klaar is, een
// blinde wandeling, en een wandeling waarin de muis uit de editor zelf kiest
// en leert. Zo staat in de editor alleen de klasse Muis. Zie ./index.ts.
export default String.raw`
# Deze functies staan hier al klaar. De gang heeft vijf vakjes, 0 tot en met
# 4. In vakje 0 staat een val, in vakje 4 ligt de kaas, en de muis begint in
# vakje 2. Hij zet steeds een stap naar links of naar rechts.
import random

acties = ["links", "rechts"]

def stap(vakje, actie):
    nieuw = vakje + 1
    if actie == "links":
        nieuw = vakje - 1
    if nieuw == 4:
        return nieuw, 1
    if nieuw == 0:
        return nieuw, -1
    return nieuw, -0.25

def klaar(vakje):
    return vakje == 0 or vakje == 4

# Een blinde wandeling: elke stap een willekeurige kant op. Je krijgt de
# stappen terug, elk als (vakje, actie, nieuw, beloning).
def willekeurige_wandeling():
    vakje = 2
    stappen = []
    while not klaar(vakje):
        actie = random.choice(acties)
        nieuw, beloning = stap(vakje, actie)
        stappen.append((vakje, actie, nieuw, beloning))
        vakje = nieuw
    return stappen

# De muis kiest zelf (muis.kies) en leert na elke stap (muis.leer). Na 20
# stappen geeft hij het op. Je krijgt het vakje terug waar hij eindigt.
def wandel(muis, ontdekken):
    vakje = 2
    stappen = 0
    while not klaar(vakje) and stappen < 20:
        actie = muis.kies(vakje, ontdekken)
        nieuw, beloning = stap(vakje, actie)
        muis.leer(vakje, actie, nieuw, beloning)
        vakje = nieuw
        stappen = stappen + 1
    return vakje
`;
