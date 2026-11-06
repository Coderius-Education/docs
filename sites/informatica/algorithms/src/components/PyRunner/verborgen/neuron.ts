// Verborgen code voor de machine-learning-route, fase F: de functie neuron
// uit "Eén neuron met gewichten" (stap "ja of nee"), precies zoals daar. Zo
// staat in de editors van "Een neuron dat zelf leert" en "Op weg naar
// Traffic" alleen het leren of de laag. Zie ./index.ts.
export default String.raw`
# neuron uit "ja of nee" staat hier al klaar.

def neuron(invoer, gewichten, bias):
    som = bias
    for i in range(len(invoer)):
        som = som + invoer[i] * gewichten[i]
    if som > 0:
        return 1
    return 0
`;
