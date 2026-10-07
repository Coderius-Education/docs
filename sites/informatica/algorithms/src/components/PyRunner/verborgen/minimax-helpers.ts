// Verborgen code voor de noodoplossing-runner van minimax (bouwsteen 10):
// de negen functies van de cheatsheet, zodat de leerling alleen zijn eigen
// minimax in de editor ziet. Zie ./index.ts.
export default String.raw`
# De negen functies van de cheatsheet staan hier al klaar.
import copy
import math


def initial_state():
    return [[None]*3 for _ in range(3)]
def player(bord):
    x = 0
    o = 0
    for rij in bord:
        x += rij.count("X")
        o += rij.count("O")
    if x == o:
        return "X"
    return "O"
def actions(bord):
    mogelijk = set()
    for i in range(3):
        for j in range(3):
            if bord[i][j] is None:
                mogelijk.add((i, j))
    return mogelijk
def result(bord, zet):
    n = copy.deepcopy(bord)
    i, j = zet
    n[i][j] = player(bord)
    return n
def winner(bord):
    for rij in bord:
        if rij[0] == rij[1] == rij[2] and rij[0] is not None:
            return rij[0]
    for j in range(3):
        if bord[0][j] == bord[1][j] == bord[2][j] and bord[0][j] is not None:
            return bord[0][j]
    if bord[0][0] == bord[1][1] == bord[2][2] and bord[0][0] is not None:
        return bord[0][0]
    if bord[0][2] == bord[1][1] == bord[2][0] and bord[0][2] is not None:
        return bord[0][2]
    return None
def terminal(bord):
    if winner(bord) is not None:
        return True
    for rij in bord:
        for cel in rij:
            if cel is None:
                return False
    return True
def utility(bord):
    w = winner(bord)
    if w == "X":
        return 1
    if w == "O":
        return -1
    return 0
def max_value(bord):
    if terminal(bord):
        return utility(bord)
    v = -math.inf
    for zet in actions(bord):
        v = max(v, min_value(result(bord, zet)))
    return v
def min_value(bord):
    if terminal(bord):
        return utility(bord)
    v = math.inf
    for zet in actions(bord):
        v = min(v, max_value(result(bord, zet)))
    return v
`;
