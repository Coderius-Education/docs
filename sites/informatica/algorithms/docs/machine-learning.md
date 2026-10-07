---
sidebar_position: 15
slug: /machine-learning
sidebar_label: Machine learning
---

# Verder met machine learning

Je hebt dertien algoritmes van idee tot werkende code gebouwd. Wil je door
richting kunstmatige intelligentie, dan is dit de kaart: zes projecten uit
[CS50 AI](https://cs50.harvard.edu/ai/), de gratis AI-cursus van Harvard, en
de korte cursussen van Kaggle. Alles is Engelstalig, en de CS50-projecten
maak je op je eigen computer. Kies wat jou aanspreekt. Je hoeft ze niet
allemaal te doen, en ook niet op volgorde.

## Tic-Tac-Toe

Bekend terrein: [onze minimax-module](/docs/minimax/01-concept) is een
Nederlandse bewerking van dit project. Bij CS50 bouw je dezelfde acht
functies in het echte project, met een klikbare spelinterface eromheen. Je
leert er inhoudelijk weinig nieuws, maar het is de zachtste instap in hoe
CS50 werkt: een specificatie lezen, functies invullen, testen.

[cs50.harvard.edu/ai/projects/0/tictactoe](https://cs50.harvard.edu/ai/projects/0/tictactoe/)

## PageRank

Ook dit algoritme [heb je al gebouwd](/docs/pagerank/01-concept). CS50 voegt
een tweede aanpak toe: in plaats van iteratief rekenen simuleer je een
*random surfer* die willekeurig rondklikt over het web (een Markov-keten) en
telt waar hij uitkomt. Twee wegen naar hetzelfde antwoord.

[cs50.harvard.edu/ai/projects/2/pagerank](https://cs50.harvard.edu/ai/projects/2/pagerank/)

## Crossword

Hier begint het nieuwe. Je krijgt een leeg kruiswoordraster en een
woordenlijst; jouw programma zoekt uit welke woorden passen zonder elkaar in
de weg te zitten. Dat heet een *constraint satisfaction problem*: keuzes
wegstrepen die met elkaar botsen (AC-3) en terugkeren op je schreden als je
vastloopt (backtracking).

[cs50.harvard.edu/ai/projects/3/crossword](https://cs50.harvard.edu/ai/projects/3/crossword/)

## Shopping

Je eerste echte machine learning. Je voorspelt of een webshopbezoeker iets
gaat kopen, op basis van duizenden eerdere bezoeken, met *k-nearest
neighbors* uit scikit-learn. Onderweg leer je waarom "95% goed voorspeld"
weinig hoeft te betekenen, en hoe je een voorspeller wél eerlijk beoordeelt.

[cs50.harvard.edu/ai/projects/4/shopping](https://cs50.harvard.edu/ai/projects/4/shopping/)

## Nim

*Reinforcement learning*: je AI krijgt geen dataset, maar leert het spelletje
Nim door duizenden keren tegen zichzelf te spelen en te onthouden welke
zetten tot winst leidden (Q-learning). Daarna mag jij proberen ervan te
winnen.

[cs50.harvard.edu/ai/projects/4/nim](https://cs50.harvard.edu/ai/projects/4/nim/)

## Traffic

Neurale netwerken. Je traint met TensorFlow een netwerk dat verkeersborden
herkent op foto's, de techniek achter moderne beeldherkenning. Dit is het
zwaarste project van de zes.

[cs50.harvard.edu/ai/projects/5/traffic](https://cs50.harvard.edu/ai/projects/5/traffic/)

## Kaggle: oefenen in de browser

Liever niets installeren? [Kaggle Learn](https://www.kaggle.com/learn) heeft
korte gratis cursussen die volledig in de browser draaien (gratis account
nodig). Begin met
[Intro to Machine Learning](https://www.kaggle.com/learn/intro-to-machine-learning):
in een paar uur bouw je je eerste voorspellende model met beslisbomen.
[Intermediate Machine Learning](https://www.kaggle.com/learn/intermediate-machine-learning)
sluit daar direct op aan.

---

Bij elk CS50-project hoort een gratis hoorcollege dat de theorie uitlegt;
begin daar. De projecten zijn vrij toegankelijk, een certificaat kan maar
hoeft niet.
