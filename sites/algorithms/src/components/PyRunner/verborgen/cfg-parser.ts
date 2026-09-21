// Verborgen code voor de cfg-runners; zie ./index.ts. String.raw, zodat een
// backslash in de Python-code precies zo bij Python aankomt.
export default String.raw`# De parser-motor van de track over context-vrije grammatica's. Elke
# runner in de cfg-lessen krijgt dit als verborgen code (prop
# verborgen="cfg-parser"): het lexicon en de functies staan klaar, de
# leerling schrijft alleen de grammatica en de zinnen. De bomen die
# ontleed() vindt komen in _coderius_bomen, zodat de runner ze kan tekenen.

LEXICON = """
Adj -> "country" | "dreadful" | "enigmatical" | "little" | "moist" | "red"
Adv -> "down" | "here" | "never"
Conj -> "and" | "until"
Det -> "a" | "an" | "his" | "my" | "the"
N -> "armchair" | "companion" | "day" | "door" | "hand" | "he" | "himself"
N -> "holmes" | "home" | "i" | "mess" | "paint" | "palm" | "pipe" | "she"
N -> "smile" | "thursday" | "walk" | "we" | "word"
P -> "at" | "before" | "in" | "of" | "on" | "to"
V -> "arrived" | "came" | "chuckled" | "had" | "lit" | "said" | "sat"
V -> "smiled" | "tell" | "were"
"""

def lees_grammatica(tekst):
    regels = []
    for regel in tekst.splitlines():
        regel = regel.split("#")[0].strip()
        if not regel:
            continue
        kop, rest = regel.split("->")
        kop = kop.strip()
        for optie in rest.split("|"):
            regels.append((kop, optie.split()))
    return regels

def parse(grammatica, woorden):
    woorden = list(woorden)
    memo = {}
    def combineer(rhs, i, j):
        if len(rhs) == 1:
            resultaten = []
            for boom in deel(rhs[0], i, j):
                resultaten.append([boom])
            return resultaten
        eerste, rest = rhs[0], rhs[1:]
        resultaat = []
        for k in range(i + 1, j):
            for boom1 in deel(eerste, i, k):
                for staart in combineer(rest, k, j):
                    resultaat.append([boom1] + staart)
        return resultaat
    def deel(sym, i, j):
        sleutel = (sym, i, j)
        if sleutel in memo:
            return memo[sleutel]
        memo[sleutel] = []
        bomen = []
        for kop, rhs in grammatica:
            if kop != sym:
                continue
            if len(rhs) == 1 and rhs[0].startswith('"'):
                woord = rhs[0].strip('"')
                if j - i == 1 and woorden[i] == woord:
                    bomen.append((sym, woorden[i]))
                continue
            for kinderen in combineer(rhs, i, j):
                bomen.append((sym,) + tuple(kinderen))
        memo[sleutel] = bomen
        return bomen
    return deel("S", 0, len(woorden))

def toon_boom(boom, inspring=0):
    streep = "  " * inspring
    if len(boom) == 2 and isinstance(boom[1], str):
        print(f"{streep}{boom[0]}: {boom[1]}")
    else:
        print(f"{streep}{boom[0]}")
        for kind in boom[1:]:
            toon_boom(kind, inspring + 1)

def controleer(grammatica_tekst, zinnen, lexicon_extra=""):
    grammatica = lees_grammatica(grammatica_tekst + LEXICON + lexicon_extra)
    alles_goed = True
    for zin in zinnen:
        bomen = parse(grammatica, zin.lower().split())
        if bomen:
            print(f"    OK  ({len(bomen)}x)  {zin}")
        else:
            print(f"    FOUT (0x)  {zin}   <-- parseert nog niet!")
            alles_goed = False
    print()
    if alles_goed:
        print("Gelukt: alle zinnen werken!")
    else:
        print("Nog niet alle zinnen werken.")

_coderius_bomen = []

def ontleed(grammatica_tekst, zin, lexicon_extra=""):
    global _coderius_bomen
    grammatica = lees_grammatica(grammatica_tekst + LEXICON + lexicon_extra)
    print(f"\n=== Boom van: {zin} ===")
    bomen = parse(grammatica, zin.lower().split())
    if not bomen:
        print("Kon de zin niet ontleden.")
        return
    for i, boom in enumerate(bomen, start=1):
        print(f"--- boom {i} ---")
        toon_boom(boom)
    print(f"aantal interpretaties: {len(bomen)}")
    _coderius_bomen = bomen
`;
