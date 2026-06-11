export const knowledgeGraph = {
  concepts: [
    { id: 'basis', label: 'Basis Concepten', description: 'De fundamentele bouwstenen van Python.', maxLevel: 5 },
    { id: 'variabelen', label: 'Variabelen', description: 'Informatie opslaan en hergebruiken.', maxLevel: 5 },
    { id: 'logica', label: 'Logica & Keuzes', description: 'Beslissingen maken in je code.', maxLevel: 4 },
    { id: 'herhaling', label: 'Herhaling (Loops)', description: 'Taken automatiseren door ze te herhalen.', maxLevel: 4 },
    { id: 'functies', label: 'Functies', description: 'Code structureren en herbruikbaar maken.', maxLevel: 4 },
    { id: 'data', label: 'Data Structuren', description: 'Lijsten en collecties van gegevens.', maxLevel: 3 },
  ],
  tutorials: [
    {
      id: 't00',
      title: '00. Introductie',
      impact: []
    },
    {
      id: 't01',
      title: '01. Jouw naam op het scherm',
      impact: [
        { concept: 'basis', depth: 'Je leert de `print()` functie kennen.', level: 1 },
        { concept: 'variabelen', depth: 'Je leert dat tekst (strings) tussen aanhalingstekens moet.', level: 1 }
      ]
    },
    {
      id: 't02',
      title: '02. Jij als variabele',
      impact: [
        { concept: 'variabelen', depth: 'Je leert variabelen aanmaken en waarden overschrijven.', level: 2 },
        { concept: 'basis', depth: 'Je leert invoer vragen met `input()`.', level: 2 }
      ]
    },
    {
      id: 't03',
      title: '03. Rekenmachine',
      impact: [
        { concept: 'basis', depth: 'Je leert rekenen en datatypen zoals integers en floats.', level: 3 },
        { concept: 'variabelen', depth: 'Je leert variabelen gebruiken in berekeningen.', level: 3 }
      ]
    },
    {
      id: 't04',
      title: '04. Slimme berichten',
      impact: [
        { concept: 'logica', depth: 'Je leert `if`-statements gebruiken.', level: 1 },
        { concept: 'variabelen', depth: 'Je leert f-strings gebruiken.', level: 4 }
      ]
    },
    {
      id: 't05',
      title: '05. Ja of nee',
      impact: [
        { concept: 'logica', depth: 'Je begrijpt Booleans en vergelijkingen.', level: 2 }
      ]
    },
    {
      id: 't06',
      title: '06. Loops',
      impact: [
        { concept: 'herhaling', depth: 'Je leert de `for`-loop.', level: 1 },
        { concept: 'logica', depth: 'Je begrijpt inspringen (indentation).', level: 3 }
      ]
    },
    {
      id: 't07',
      title: '07. While-loop',
      impact: [
        { concept: 'herhaling', depth: 'Je leert de `while`-loop.', level: 2 },
        { concept: 'logica', depth: 'Je leert complexe condities.', level: 4 }
      ]
    },
    {
      id: 't08',
      title: '08. Functies',
      impact: [
        { concept: 'functies', depth: 'Je leert je eigen functies maken met `def`.', level: 1 },
        { concept: 'basis', depth: 'Je begrijpt programmastructuur.', level: 4 }
      ]
    },
    {
      id: 't09',
      title: '09. Parameters & Return',
      impact: [
        { concept: 'functies', depth: 'Je leert parameters en return values.', level: 3 },
        { concept: 'variabelen', depth: 'Je leert over scope.', level: 5 }
      ]
    },
    {
      id: 't10',
      title: '10. Lijsten',
      impact: [
        { concept: 'data', depth: 'Je leert meerdere waarden opslaan in een `list`.', level: 1 },
        { concept: 'herhaling', depth: 'Je leert over lijsten loopen.', level: 3 }
      ]
    },
    {
      id: 't11',
      title: '11. Dictionaries',
      impact: [
        { concept: 'data', depth: 'Je leert sleutel-waarde paren in een `dict`.', level: 3 },
        { concept: 'herhaling', depth: 'Je leert complexe herhalingen.', level: 4 }
      ]
    }
  ],
  connections: [
    { from: 'basis', to: 'variabelen' },
    { from: 'variabelen', to: 'logica' },
    { from: 'logica', to: 'herhaling' },
    { from: 'herhaling', to: 'data' },
    { from: 'basis', to: 'functies' },
    { from: 'functies', to: 'logica' }
  ]
};
