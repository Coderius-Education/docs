---
sidebar_position: 15
slug: /machine-learning
sidebar_label: De route
---

# Machine learning

Een computer die leert van voorbeelden in plaats van regels: dat is machine
learning. De route hieronder bouwt dat op in kleine projecten, die je in je
browser maakt. Elk project zet een klein stuk Python bij wat je al kunt, samen met
één nieuw idee.
Aan het eind van een fase ben je klaar voor een project uit
[CS50 AI](https://cs50.harvard.edu/ai/), de gratis AI-cursus van Harvard.
Op welke concepten je docent je beoordeelt, staat bij
[de leerdoelen van niveau 1](site:algorithms/leerdoelen/niveau-1).

## De route

| Fase | Projecten | Daarna bij CS50 |
|---|---|---|
| A. AI met regels | [een chatbot](site:algorithms/docs/ml-regels/01-chatbot), [een spamfilter met regels](site:algorithms/docs/ml-regels/02-spamfilter), [een spamfilter dat leert](site:algorithms/docs/ml-regels/03-spamfilter-leert) | |
| B. Voorspellen met afstand | [welk fruit is dit?](site:algorithms/docs/ml-afstand/01-dichtstbijzijnde-buur), [laat de buren stemmen](site:algorithms/docs/ml-afstand/02-k-buren), [eerlijk testen](site:algorithms/docs/ml-afstand/03-eerlijk-testen), [klaar voor Shopping](site:algorithms/docs/ml-afstand/04-shopping) | Shopping |
| C. Kans en toeval | [een dobbelsteen simuleren](site:algorithms/docs/ml-kans/01-dobbelsteen), [een surfer die willekeurig klikt](site:algorithms/docs/ml-kans/02-surfer), [PageRank](site:algorithms/docs/pagerank/01-concept) | PageRank |
| D. Spellen | [Nim met een vaste strategie](site:algorithms/docs/ml-spellen/01-nim-strategie), [Nim die van zichzelf leert](site:algorithms/docs/ml-spellen/02-nim-leert), [minimax](site:algorithms/docs/minimax/01-concept) | Nim, Tic-Tac-Toe |
| E. Zoeken | [de buren van een vakje](site:algorithms/docs/ml-zoeken/01-buren), [de kortste weg met een wachtrij](site:algorithms/docs/ml-zoeken/02-kortste-weg) | Degrees |
| F. Neuronen | [één neuron met gewichten](site:algorithms/docs/ml-neuronen/01-neuron), [een neuron dat zelf leert](site:algorithms/docs/ml-neuronen/02-neuron-leert) | Traffic |

PageRank en minimax zijn hoofdstukken van deze cursus, en zwaarder dan de
projecten ervoor. Daar bouw je het algoritme stap voor stap op.

## Wat moet je al kunnen?

Elk project noemt bovenaan, in een blauw blok, welke Python het gebruikt en
waar je die leert. Per fase staat het hieronder bij elkaar, zodat je ziet
waar je kunt instappen. Fase A vraagt alleen de basis van de python-cursus.
Elke fase daarna gebruikt ook wat in de fases van de laatste kolom staat.

| Fase | Uit de python-cursus | Uit deze cursus |
|---|---|---|
| A | [If en else](site:python/docs/beslissen/05b-if-else), [And, or en elif](site:python/docs/beslissen/05c-and-or-elif), [String-methoden](site:python/docs/tekst/04b-string-methoden), [Lijsten](site:python/docs/data/10a-lijsten-basis), [De for-loop](site:python/docs/herhalen/06a-for-loop), [Dictionaries](site:python/docs/data/11a-dictionaries-basis) | niets, hier begin je |
| B | [Tuples](site:python/docs/data/tuples), [Return-waarden](site:python/docs/functies/09b-return), [Lijst-methoden](site:python/docs/data/10b-lijst-methoden), [Modules](site:python/docs/modules/09d-modules); voor Shopping ook [Tekst naar getal](site:python/docs/basis/03b-tekst-naar-getal), [Dictionaries](site:python/docs/data/11a-dictionaries-basis) en [Een tekstbestand lezen](site:python/docs/bestanden/14b-tekstbestand-lezen) | fase A, en [Vind het maximum](site:algorithms/docs/vind-maximum/01-concept) |
| C | [De computer kiest](site:python/docs/projecten/raad-het-getal/stap-4-random), [De for-loop](site:python/docs/herhalen/06a-for-loop), [Delen met rest](site:python/docs/basis/rekenmachine#delen-met-rest), [Een bont bloemenveld](site:python/docs/projecten/bloemenveld/stap-6-lijst), [Geneste dictionaries](site:python/docs/data/11c-geneste-dictionaries); voor de Bouw zelf van de dobbelsteen ook [Om de beurt](site:python/docs/projecten/schildpaddenrace/stap-5-loop-in-loop) en [Booleans en vergelijken](site:python/docs/beslissen/05a-booleans-en-vergelijken) | fase A |
| D | [De while-loop](site:python/docs/herhalen/while-loop), [Delen met rest](site:python/docs/basis/rekenmachine#delen-met-rest), [Tuples](site:python/docs/data/tuples) | fase A en C |
| E | [Lijsten](site:python/docs/data/10a-lijsten-basis), [Tuples](site:python/docs/data/tuples), [Return-waarden](site:python/docs/functies/09b-return), [Om de beurt](site:python/docs/projecten/schildpaddenrace/stap-5-loop-in-loop), [De while-loop](site:python/docs/herhalen/while-loop), [Lijst-methoden](site:python/docs/data/10b-lijst-methoden) | geen, je kunt na fase A instappen |
| F | [Lijsten](site:python/docs/data/10a-lijsten-basis), [Return-waarden](site:python/docs/functies/09b-return) | fase B en E |

## De CS50-projecten

De CS50-projecten zijn Engelstalig, en je maakt ze op je eigen computer. Bij
elk project hoort een gratis hoorcollege dat de theorie uitlegt; begin daar.
Ze staan hier in de volgorde van de route.

### Shopping

Je eerste echte machine learning. Je voorspelt of een webshopbezoeker iets
gaat kopen, op basis van duizenden eerdere bezoeken, met *k-nearest
neighbors* uit scikit-learn. Onderweg leer je waarom "95% goed voorspeld"
weinig hoeft te betekenen, en hoe je een voorspeller wél eerlijk beoordeelt.
Hoe je je erop voorbereidt, staat bij
[klaar voor Shopping](site:algorithms/docs/ml-afstand/04-shopping).

[cs50.harvard.edu/ai/projects/4/shopping](https://cs50.harvard.edu/ai/projects/4/shopping/)

### PageRank

Dit algoritme [bouw je ook hier](site:algorithms/docs/pagerank/01-concept).
CS50 voegt een tweede aanpak toe: in plaats van iteratief rekenen simuleer je
een *random surfer* die willekeurig rondklikt over het web (een
Markov-keten) en telt waar hij uitkomt. Twee wegen naar hetzelfde antwoord.
De surfer bouw je eerst in
[een surfer die willekeurig klikt](site:algorithms/docs/ml-kans/02-surfer).

[cs50.harvard.edu/ai/projects/2/pagerank](https://cs50.harvard.edu/ai/projects/2/pagerank/)

### Nim

*Reinforcement learning*: je AI krijgt geen dataset, maar leert het spelletje
Nim door duizenden keren tegen zichzelf te spelen en te onthouden welke
zetten tot winst leidden (Q-learning). Daarna mag jij proberen ervan te
winnen. Hoe je je erop voorbereidt, staat bij
[Nim die van zichzelf leert](site:algorithms/docs/ml-spellen/02-nim-leert#aan-de-slag-met-nim).

[cs50.harvard.edu/ai/projects/4/nim](https://cs50.harvard.edu/ai/projects/4/nim/)

### Tic-Tac-Toe

[De minimax-module](site:algorithms/docs/minimax/01-concept) van deze cursus is
een Nederlandse bewerking van dit project. Bij CS50 bouw je dezelfde acht
functies in het echte project, met een klikbare spelinterface eromheen. Je
hebt er recursie voor nodig: een functie die zichzelf aanroept.

[cs50.harvard.edu/ai/projects/0/tictactoe](https://cs50.harvard.edu/ai/projects/0/tictactoe/)

### Degrees

Via hoeveel films zijn twee acteurs met elkaar verbonden? Je zoekt de
kortste weg door een netwerk van acteurs en films, met *breadth-first
search*: eerst alles op één stap afstand, dan alles op twee stappen.
Hoe je je erop voorbereidt, staat bij
[de kortste weg met een wachtrij](site:algorithms/docs/ml-zoeken/02-kortste-weg#aan-de-slag-met-degrees).

[cs50.harvard.edu/ai/projects/0/degrees](https://cs50.harvard.edu/ai/projects/0/degrees/)

### Traffic

Neurale netwerken. Je traint met TensorFlow een netwerk dat verkeersborden
herkent op foto's, de techniek achter moderne beeldherkenning. Dit is het
zwaarste project van de route. Hoe je je erop voorbereidt, staat bij
[een neuron dat zelf leert](site:algorithms/docs/ml-neuronen/02-neuron-leert#aan-de-slag-met-traffic).

[cs50.harvard.edu/ai/projects/5/traffic](https://cs50.harvard.edu/ai/projects/5/traffic/)

### Buiten de route: Crossword

Je krijgt een leeg kruiswoordraster en een woordenlijst; jouw programma
zoekt uit welke woorden passen zonder elkaar in de weg te zitten. Dat heet
een *constraint satisfaction problem*: keuzes wegstrepen die met elkaar
botsen (AC-3) en terugkeren op je schreden als je vastloopt (backtracking).
Het vraagt veel Python voor wat het aan machine learning toevoegt, daarom
staat het niet in de route.

[cs50.harvard.edu/ai/projects/3/crossword](https://cs50.harvard.edu/ai/projects/3/crossword/)

## Kaggle: oefenen in de browser

Liever niets installeren? [Kaggle Learn](https://www.kaggle.com/learn) heeft
korte gratis cursussen die volledig in de browser draaien (gratis account
nodig). Begin met
[Intro to Machine Learning](https://www.kaggle.com/learn/intro-to-machine-learning):
in een paar uur bouw je je eerste voorspellende model met beslisbomen.
[Intermediate Machine Learning](https://www.kaggle.com/learn/intermediate-machine-learning)
sluit daar direct op aan.

