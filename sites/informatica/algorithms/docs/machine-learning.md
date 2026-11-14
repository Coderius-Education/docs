---
sidebar_position: 15
slug: /machine-learning
sidebar_label: De route
---

# Machine learning

Een computer die leert van voorbeelden in plaats van regels: dat is machine
learning. De route bouwt dat op in kleine projecten in je browser. Elke fase
eindigt met een opstap: een project uit [CS50 AI](https://cs50.harvard.edu/ai/)
van Harvard, nagebouwd op eigen oefendata.

## De route

| Fase | Projecten | Bij CS50 |
|---|---|---|
| A. AI met regels | [een chatbot](site:algorithms/docs/ml-regels/01-chatbot/01-een-trefwoord), [een spamfilter met regels](site:algorithms/docs/ml-regels/02-spamfilter/01-een-score), [een spamfilter dat leert](site:algorithms/docs/ml-regels/03-spamfilter-leert/01-woorden-tellen) | |
| B. Voorspellen met afstand | [welk fruit is dit?](site:algorithms/docs/ml-afstand/01-dichtstbijzijnde-buur/01-een-afstand), [laat de buren stemmen](site:algorithms/docs/ml-afstand/02-k-buren/01-de-buren-sorteren), [eerlijk testen](site:algorithms/docs/ml-afstand/03-eerlijk-testen/01-oefenen-en-toetsen), opstap: [klaar voor Shopping](site:algorithms/docs/ml-afstand/04-klaar-voor-shopping/01-een-csv-lezen) | Shopping |
| C. Kans en toeval | [een dobbelsteen simuleren](site:algorithms/docs/ml-kans/01-dobbelsteen/01-een-worp), [een surfer die willekeurig klikt](site:algorithms/docs/ml-kans/02-surfer/01-het-web), [PageRank](site:algorithms/docs/pagerank/01-concept), opstap: [op weg naar PageRank](site:algorithms/docs/ml-kans/03-op-weg-naar-pagerank/01-een-kansmodel) | PageRank |
| D. Spellen | [Nim met een vaste strategie](site:algorithms/docs/ml-spellen/01-nim-strategie/01-een-zet), [Nim die van zichzelf leert](site:algorithms/docs/ml-spellen/02-nim-leert/01-een-score-per-zet), opstap: [op weg naar Nim](site:algorithms/docs/ml-spellen/03-op-weg-naar-nim/01-een-klasse), [minimax](site:algorithms/docs/minimax/01-concept) | Nim, Tic-Tac-Toe |
| E. Zoeken | [de buren van een vakje](site:algorithms/docs/ml-zoeken/01-buren/01-een-raster), [de kortste weg met een wachtrij](site:algorithms/docs/ml-zoeken/02-kortste-weg/01-een-wachtrij), opstap: [op weg naar Degrees](site:algorithms/docs/ml-zoeken/03-op-weg-naar-degrees/01-een-netwerk) | Degrees |
| F. Neuronen | [één neuron met gewichten](site:algorithms/docs/ml-neuronen/01-neuron/01-gewichten), [een neuron dat zelf leert](site:algorithms/docs/ml-neuronen/02-neuron-leert/01-de-fout), opstap: [op weg naar Traffic](site:algorithms/docs/ml-neuronen/03-op-weg-naar-traffic/01-een-plaatje) | Traffic |

## Wat moet je al kunnen?

De eerste stap van elk project noemt bovenaan, in een blauw blok, welke
Python het gebruikt en waar je die leert. Per fase staat het hier bij elkaar,
zodat je ziet waar je kunt instappen. Een fase gebruikt ook wat in de fases
van de laatste kolom staat.

### Fase A, B en C

| Fase | Uit de python-cursus | Uit deze cursus |
|---|---|---|
| A | [If en else](site:python/docs/beslissen/05b-if-else), [And, or en elif](site:python/docs/beslissen/05c-and-or-elif), [String-methoden](site:python/docs/tekst/04b-string-methoden), [Lijsten](site:python/docs/data/10a-lijsten-basis), [De for-loop](site:python/docs/herhalen/06a-for-loop), [Dictionaries](site:python/docs/data/11a-dictionaries-basis), [Door een dictionary lopen](site:python/docs/data/11b-itereren-dictionaries) | niets, hier begin je |
| B | [Tuples](site:python/docs/data/tuples), [Return-waarden](site:python/docs/functies/09b-return), [Lijst-methoden](site:python/docs/data/10b-lijst-methoden), [Door een dictionary lopen](site:python/docs/data/11b-itereren-dictionaries), [Modules](site:python/docs/modules/09d-modules); voor Shopping ook [Dictionaries](site:python/docs/data/11a-dictionaries-basis), [Tekst naar getal](site:python/docs/basis/03b-tekst-naar-getal) en [Een tekstbestand lezen](site:python/docs/bestanden/14b-tekstbestand-lezen) | fase A, en [Vind het maximum](site:algorithms/docs/vind-maximum/01-concept) |
| C | [De computer kiest](site:python/docs/projecten/raad-het-getal/stap-4-random), [De for-loop](site:python/docs/herhalen/06a-for-loop), [Delen met rest](site:python/docs/basis/rekenmachine#delen-met-rest), [Een bont bloemenveld](site:python/docs/projecten/bloemenveld/stap-6-lijst), [Geneste dictionaries](site:python/docs/data/11c-geneste-dictionaries); voor de Bouw zelf van de dobbelsteen ook [Om de beurt](site:python/docs/projecten/schildpaddenrace/stap-5-loop-in-loop) en [Booleans en vergelijken](site:python/docs/beslissen/05a-booleans-en-vergelijken); voor de opstap ook [Return-waarden](site:python/docs/functies/09b-return), [De while-loop](site:python/docs/herhalen/while-loop) en [Sets](site:python/docs/data/sets) | fase A; voor de opstap ook [het web als graph](site:algorithms/docs/pagerank/bouwen/03-graph) en [itereren tot het stabiel is](site:algorithms/docs/pagerank/bouwen/06-itereren) |

### Fase D, E en F

| Fase | Uit de python-cursus | Uit deze cursus |
|---|---|---|
| D | [De while-loop](site:python/docs/herhalen/while-loop), [Delen met rest](site:python/docs/basis/rekenmachine#delen-met-rest), [Tuples](site:python/docs/data/tuples), [Return-waarden](site:python/docs/functies/09b-return); voor de opstap ook [Je eerste klasse](site:python/docs/klassen/15a-je-eerste-klasse), [Attributen veranderen](site:python/docs/klassen/15c-attributen-veranderen), [Je eerste methode](site:python/docs/klassen/15d-je-eerste-methode) en [Methoden met return](site:python/docs/klassen/15f-methoden-met-return) | fase A, B en C |
| E | [Lijsten](site:python/docs/data/10a-lijsten-basis), [Tuples](site:python/docs/data/tuples), [Return-waarden](site:python/docs/functies/09b-return), [Om de beurt](site:python/docs/projecten/schildpaddenrace/stap-5-loop-in-loop), [De while-loop](site:python/docs/herhalen/while-loop), [Lijst-methoden](site:python/docs/data/10b-lijst-methoden), [Door een dictionary lopen](site:python/docs/data/11b-itereren-dictionaries); voor de opstap ook [Je eerste klasse](site:python/docs/klassen/15a-je-eerste-klasse), [Je eerste methode](site:python/docs/klassen/15d-je-eerste-methode) en [Methoden met return](site:python/docs/klassen/15f-methoden-met-return) | fase A en D |
| F | [Lijsten](site:python/docs/data/10a-lijsten-basis), [Return-waarden](site:python/docs/functies/09b-return); voor de opstap ook [Een rij uit tekst](site:python/docs/projecten/pixel-art/stap-2-rij), [Een heel plaatje](site:python/docs/projecten/pixel-art/stap-3-plaatje), [Lijst-methoden](site:python/docs/data/10b-lijst-methoden) en [Door een dictionary lopen](site:python/docs/data/11b-itereren-dictionaries) | fase B en E |

## De CS50-projecten

### Drie projecten kiezen

De CS50-projecten zijn Engelstalig, en je maakt ze op je eigen computer. Bij
elk project hoort een gratis hoorcollege dat de theorie uitlegt; begin daar.
In de volgende stappen staan ze in de volgorde van de route. Voor niveau 1
maak je er drie, en welke drie kies je zelf. Traffic is het zwaarste en telt
voor twee. Op welke concepten je docent je beoordeelt, staat bij
[de leerdoelen van niveau 1](site:algorithms/leerdoelen/niveau-1).

Liever eerst oefenen zonder iets te installeren?
[Kaggle Learn](https://www.kaggle.com/learn) heeft korte gratis cursussen
die volledig in de browser draaien (gratis account nodig). Begin met
[Intro to Machine Learning](https://www.kaggle.com/learn/intro-to-machine-learning):
in een paar uur bouw je je eerste voorspellende model met beslisbomen.
[Intermediate Machine Learning](https://www.kaggle.com/learn/intermediate-machine-learning)
sluit daar direct op aan.

### Shopping

Je eerste echte machine learning. Je voorspelt of een webshopbezoeker iets
gaat kopen, op basis van duizenden eerdere bezoeken, met *k-nearest
neighbors* uit scikit-learn. Onderweg leer je waarom "95% goed voorspeld"
weinig hoeft te betekenen, en hoe je een voorspeller wél eerlijk beoordeelt.
Hoe je je erop voorbereidt, staat bij
[aan de slag met Shopping](site:algorithms/docs/ml-afstand/04-klaar-voor-shopping/07-aan-de-slag-met-shopping).

[cs50.harvard.edu/ai/projects/4/shopping](https://cs50.harvard.edu/ai/projects/4/shopping/)

### PageRank

Dit algoritme [bouw je ook hier](site:algorithms/docs/pagerank/01-concept),
in een hoofdstuk dat zwaarder is dan de projecten ervoor.
CS50 voegt een tweede aanpak toe: in plaats van iteratief rekenen simuleer je
een *random surfer* die willekeurig rondklikt over het web (een
Markov-keten) en telt waar hij uitkomt. Twee wegen naar hetzelfde antwoord.
De surfer bouw je eerst in
[een surfer die willekeurig klikt](site:algorithms/docs/ml-kans/02-surfer/01-het-web).
Hoe je je erop voorbereidt, staat bij
[aan de slag met PageRank](site:algorithms/docs/ml-kans/03-op-weg-naar-pagerank/09-aan-de-slag-met-pagerank).

[cs50.harvard.edu/ai/projects/2/pagerank](https://cs50.harvard.edu/ai/projects/2/pagerank/)

### Nim

*Reinforcement learning*: je AI krijgt geen dataset, maar leert het spelletje
Nim door duizenden keren tegen zichzelf te spelen en te onthouden welke
zetten tot winst leidden (Q-learning). Daarna mag jij proberen ervan te
winnen. Hoe je je erop voorbereidt, staat bij
[aan de slag met Nim](site:algorithms/docs/ml-spellen/03-op-weg-naar-nim/08-aan-de-slag-met-nim).

[cs50.harvard.edu/ai/projects/4/nim](https://cs50.harvard.edu/ai/projects/4/nim/)

### Tic-Tac-Toe

[De minimax-module](site:algorithms/docs/minimax/01-concept) van deze cursus is
een Nederlandse bewerking van dit project, en net als PageRank zwaarder dan de
projecten ervoor. Bij CS50 bouw je dezelfde acht
functies in het echte project, met een klikbare spelinterface eromheen. Je
hebt er recursie voor nodig: een functie die zichzelf aanroept.

[cs50.harvard.edu/ai/projects/0/tictactoe](https://cs50.harvard.edu/ai/projects/0/tictactoe/)

### Degrees

Via hoeveel films zijn twee acteurs met elkaar verbonden? Je zoekt de
kortste weg door een netwerk van acteurs en films, met *breadth-first
search*: eerst alles op één stap afstand, dan alles op twee stappen.
Hoe je je erop voorbereidt, staat bij
[aan de slag met Degrees](site:algorithms/docs/ml-zoeken/03-op-weg-naar-degrees/06-aan-de-slag-met-degrees).

[cs50.harvard.edu/ai/projects/0/degrees](https://cs50.harvard.edu/ai/projects/0/degrees/)

### Traffic

Neurale netwerken. Je traint met TensorFlow een netwerk dat verkeersborden
herkent op foto's, de techniek achter moderne beeldherkenning. Dit is het
zwaarste project van de route. Hoe je je erop voorbereidt, staat bij
[aan de slag met Traffic](site:algorithms/docs/ml-neuronen/03-op-weg-naar-traffic/07-aan-de-slag-met-traffic).

[cs50.harvard.edu/ai/projects/5/traffic](https://cs50.harvard.edu/ai/projects/5/traffic/)

### Buiten de route: Crossword

Je krijgt een leeg kruiswoordraster en een woordenlijst; jouw programma
zoekt uit welke woorden passen zonder elkaar in de weg te zitten. Dat heet
een *constraint satisfaction problem*: keuzes wegstrepen die met elkaar
botsen (AC-3) en terugkeren op je schreden als je vastloopt (backtracking).
Het vraagt veel Python voor wat het aan machine learning toevoegt, daarom
staat het niet in de route.

[cs50.harvard.edu/ai/projects/3/crossword](https://cs50.harvard.edu/ai/projects/3/crossword/)
