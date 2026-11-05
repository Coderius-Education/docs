// Verborgen code voor de machine-learning-route, fase D (Nim die van zichzelf
// leert): de scoretabel lezen, de beste zet kiezen, en één spel tegen
// zichzelf spelen. Zo staat in de editor alleen het leren. Zie ./index.ts.
export default String.raw`
# Deze functies staan hier al klaar. Het spel is dat van "Nim met een vaste
# strategie": 10 lucifers, pak er 1, 2 of 3, wie de laatste pakt verliest.
import random

def waarde(score, stapel, pak):
    if (stapel, pak) in score:
        return score[(stapel, pak)]
    return 0

def mogelijk(stapel):
    return list(range(1, min(3, stapel) + 1))

def beste_zet(score, stapel):
    beste = 1
    for pak in mogelijk(stapel):
        if waarde(score, stapel, pak) > waarde(score, stapel, beste):
            beste = pak
    return beste

def kies(score, stapel, ontdekken):
    if random.random() < ontdekken:
        return random.choice(mogelijk(stapel))
    return beste_zet(score, stapel)

def speel_tegen_jezelf(score, ontdekken):
    stapel = 10
    beurt = "a"
    zetten = {"a": [], "b": []}
    while stapel > 0:
        pak = kies(score, stapel, ontdekken)
        zetten[beurt].append((stapel, pak))
        stapel = stapel - pak
        verliezer = beurt
        if beurt == "a":
            beurt = "b"
        else:
            beurt = "a"
    return zetten, verliezer
`;
