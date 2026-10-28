// Verborgen code voor de Onderzoek-runner van Dijkstra (10-compleet): de
// twee functies van die pagina, zodat de vragen direct boven de graph staan
// die je aanpast. Met de functies erbij stond de graph acht
// honderd pixels onder de vragen. Zie ./index.ts.
export default String.raw`
def kies_volgende(afstanden, bezocht):
    beste_node = None
    kleinste = float('inf')
    for node, d in afstanden.items():
        if node in bezocht:
            continue
        if d < kleinste:
            kleinste = d
            beste_node = node
    return beste_node


def dijkstra(graph, start):
    afstanden = {}
    for node in graph:
        afstanden[node] = float('inf')
    afstanden[start] = 0
    bezocht = set()
    while True:
        huidige = kies_volgende(afstanden, bezocht)
        if huidige is None:
            break
        bezocht.add(huidige)
        for buur, gewicht in graph[huidige]:
            nieuwe = afstanden[huidige] + gewicht
            if nieuwe < afstanden[buur]:
                afstanden[buur] = nieuwe
    return afstanden
`;
