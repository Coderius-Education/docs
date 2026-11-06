// Verborgen code voor de machine-learning-route, fase F: neuron uit "ja of
// nee" en laag uit "een laag" (Op weg naar Traffic, stap 2), precies zoals
// daar. Voor de stap "twee lagen". Zie ./index.ts.
export default String.raw`
# neuron uit "ja of nee" en laag uit "een laag" staan hier al klaar.

def neuron(invoer, gewichten, bias):
    som = bias
    for i in range(len(invoer)):
        som = som + invoer[i] * gewichten[i]
    if som > 0:
        return 1
    return 0

def laag(invoer, alle_gewichten, biases):
    uit = []
    for n in range(len(alle_gewichten)):
        uit.append(neuron(invoer, alle_gewichten[n], biases[n]))
    return uit
`;
