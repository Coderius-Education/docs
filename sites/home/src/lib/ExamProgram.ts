// Examenprogramma Informatica havo/vwo (geldig vanaf schooljaar 2019, alleen schoolexamen)
// Bron: src/info/examenprogramma_Informatica_havo-vwo.pdf
// Domein A (Vaardigheden, A1-A13) is bewust weggelaten — die algemene vaardigheden
// zijn niet specifiek genoeg om als tutorial-raakvlak te markeren.

export type ExamDomain = {
	code: string;         // bv. "B1"
	name: string;         // bv. "Algoritmen"
	description: string;  // letterlijke eindtermbeschrijving uit het examenprogramma
	parent?: string;      // hoofddomein-letter (B, C, D, ...)
};

export type ExamMapping = {
	code: string;                       // verwijst naar ExamDomain.code
	strength: "strong" | "weak";
};

export const examDomains: ExamDomain[] = [
	// Domein B: Grondslagen
	{
		code: "B1",
		name: "Algoritmen",
		parent: "B",
		description:
			"De kandidaat kan een oplossingsrichting voor een probleem uitwerken tot een algoritme, daarbij standaardalgoritmen herkennen en gebruiken, en de correctheid en efficiëntie van digitale artefacten onderzoeken via de achterliggende algoritmen.",
	},
	{
		code: "B2",
		name: "Datastructuren",
		parent: "B",
		description:
			"De kandidaat kan verschillende abstracte datastructuren met elkaar vergelijken op elegantie en efficiëntie.",
	},
	{
		code: "B3",
		name: "Automaten",
		parent: "B",
		description:
			"De kandidaat kan eindige automaten gebruiken voor de karakterisering van bepaalde algoritmen.",
	},
	{
		code: "B4",
		name: "Grammatica's",
		parent: "B",
		description:
			"De kandidaat kan grammatica's hanteren als hulpmiddel bij de beschrijving van talen.",
	},

	// Domein C: Informatie
	{
		code: "C1",
		name: "Doelstellingen",
		parent: "C",
		description:
			"De kandidaat kan doelstellingen voor informatie- en gegevensverwerking onderscheiden, waaronder zoeken en bewerken.",
	},
	{
		code: "C2",
		name: "Identificeren",
		parent: "C",
		description:
			"De kandidaat kan informatie en gegevens identificeren in contexten, daarbij rekening houdend met de doelstelling.",
	},
	{
		code: "C3",
		name: "Representeren",
		parent: "C",
		description:
			"De kandidaat kan gegevens representeren in een geschikte datastructuur, daarbij rekening houdend met de doelstelling, en kan daarbij verschillende representaties met elkaar vergelijken op elegantie, efficiëntie en implementeerbaarheid.",
	},
	{
		code: "C4",
		name: "Standaardrepresentaties",
		parent: "C",
		description:
			"De kandidaat kan standaardrepresentaties van numerieke gegevens en media gebruiken en aan elkaar relateren.",
	},
	{
		code: "C5",
		name: "Gestructureerde data",
		parent: "C",
		description:
			"De kandidaat kan een informatiebehoefte vertalen in een zoekopdracht op een verzameling gestructureerde data.",
	},

	// Domein D: Programmeren
	{
		code: "D1",
		name: "Ontwikkelen",
		parent: "D",
		description:
			"De kandidaat kan, voor een gegeven doelstelling, programmacomponenten ontwikkelen in een imperatieve programmeertaal, daarbij programmeertaalconstructies gebruiken die abstractie ondersteunen, en programmacomponenten zodanig structureren dat ze door anderen gemakkelijk te begrijpen en te evalueren zijn.",
	},
	{
		code: "D2",
		name: "Inspecteren en aanpassen",
		parent: "D",
		description:
			"De kandidaat kan structuur en werking van gegeven programmacomponenten uitleggen, en zulke programmacomponenten aanpassen op basis van evaluatie of veranderde eisen.",
	},

	// Domein E: Architectuur
	{
		code: "E1",
		name: "Decompositie",
		parent: "E",
		description:
			"De kandidaat kan de structuur en werking van digitale artefacten uitleggen aan de hand van architectuurelementen, dat wil zeggen in termen van de niveaulagen fysiek, logisch en toepassingen, en in termen van de componenten in deze lagen en hun onderlinge interactie.",
	},
	{
		code: "E2",
		name: "Security",
		parent: "E",
		description:
			"De kandidaat kan enkele security-bedreigingen en veelgebruikte technische maatregelen benoemen en relateren aan architectuurelementen.",
	},

	// Domein F: Interactie
	{
		code: "F1",
		name: "Usability",
		parent: "F",
		description:
			"De kandidaat kan gebruikersinterfaces van digitale artefacten evalueren aan de hand van heuristieken, en vuistregels van goed ontwerp met betrekking tot interfaces toepassen bij ontwerp en ontwikkeling van digitale artefacten.",
	},
	{
		code: "F2",
		name: "Maatschappelijke aspecten",
		parent: "F",
		description:
			"De kandidaat kan de invloed van digitale artefacten op sociale interactie en persoonlijke levenssfeer herkennen en in historisch perspectief plaatsen.",
	},
	{
		code: "F3",
		name: "Privacy",
		parent: "F",
		description:
			"De kandidaat kan redeneren over de gevolgen van de veranderende mogelijkheden van digitale artefacten op de persoonlijke vrijheid.",
	},
	{
		code: "F4",
		name: "Security",
		parent: "F",
		description:
			"De kandidaat kan enkele security-bedreigingen en veelgebruikte socio-technische maatregelen benoemen en deze relateren aan sociale en menselijke factoren.",
	},

	// Keuzethema G: Algoritmiek, berekenbaarheid en logica
	{
		code: "G1",
		name: "Complexiteit van algoritmen",
		parent: "G",
		description:
			"(havo) De kandidaat kan van gegeven algoritmen de complexiteit vergelijken, en kan klassieke 'moeilijke' problemen herkennen en benoemen. (vwo) De kandidaat kan het verschil tussen exponentiële en polynomiale complexiteit uitleggen, kan algoritmen op basis hiervan onderscheiden, en kan klassieke 'moeilijke' problemen herkennen en benoemen.",
	},
	{
		code: "G2",
		name: "Berekenbaarheid",
		parent: "G",
		description:
			"De kandidaat kan berekeningen op verschillende abstractieniveaus karakteriseren en relateren, en kan klassieke onberekenbare problemen herkennen en benoemen.",
	},
	{
		code: "G3",
		name: "Logica",
		parent: "G",
		description:
			"De kandidaat kan eigenschappen van digitale artefacten uitdrukken in logische formules.",
	},

	// Keuzethema H: Databases
	{
		code: "H1",
		name: "Informatiemodellering",
		parent: "H",
		description:
			"De kandidaat kan een informatiemodel opstellen voor een eenvoudige praktische situatie en aan de hand hiervan een database definiëren.",
	},
	{
		code: "H2",
		name: "Database-paradigma's",
		parent: "H",
		description:
			"De kandidaat kan naast het relationele paradigma tenminste één ander database-paradigma beschrijven en kan voor een concrete toepassing de geschiktheid van de betreffende paradigma's afwegen.",
	},
	{
		code: "H3",
		name: "Linked data",
		parent: "H",
		description:
			"De kandidaat kan in een toepassing data uit verschillende databases (databronnen) met elkaar in verband brengen.",
	},

	// Keuzethema I: Cognitive computing
	{
		code: "I1",
		name: "Intelligent gedrag",
		parent: "I",
		description:
			"De kandidaat kan de processen die nodig zijn voor intelligent gedrag beschrijven en kan analyseren hoe deze processen in de informatica ingezet kunnen worden bij het ontwikkelen van digitale artefacten.",
	},
	{
		code: "I2",
		name: "Kenmerken cognitive computing",
		parent: "I",
		description:
			"De kandidaat kan de belangrijkste kenmerken van cognitive computingsystemen uitleggen, en het verschil met traditionele digitale artefacten aangeven en kan van een probleem aangeven of de oplossing ervan zich leent voor een cognitive computing-aanpak.",
	},
	{
		code: "I3",
		name: "Toepassen van cognitive computing",
		parent: "I",
		description:
			"De kandidaat kan een eenvoudige toepassing realiseren met één of meer van de methodes en technologieën uit de cognitive computing.",
	},

	// Keuzethema J: Programmeerparadigma's
	{
		code: "J1",
		name: "Alternatief programmeerparadigma",
		parent: "J",
		description:
			"De kandidaat kan van minimaal één extra programmeerparadigma de kenmerken beschrijven en kan programma's volgens dat paradigma ontwikkelen en evalueren.",
	},
	{
		code: "J2",
		name: "Keuze van een programmeerparadigma",
		parent: "J",
		description:
			"De kandidaat kan voor een gegeven probleem een afweging maken tussen paradigma's voor het oplossen ervan.",
	},

	// Keuzethema K: Computerarchitectuur
	{
		code: "K1",
		name: "Booleaanse algebra",
		parent: "K",
		description: "De kandidaat kan rekenen met formules in Booleaanse algebra.",
	},
	{
		code: "K2",
		name: "Digitale schakelingen",
		parent: "K",
		description: "De kandidaat kan eenvoudige digitale schakelingen op bit-niveau construeren.",
	},
	{
		code: "K3",
		name: "Machinetaal",
		parent: "K",
		description:
			"De kandidaat kan een eenvoudig programma in machinetaal schrijven aan de hand van de beschrijving van een instructieset-architectuur.",
	},
	{
		code: "K4",
		name: "Variatie in computerarchitectuur",
		parent: "K",
		description:
			"De kandidaat kan variatie in computerarchitectuur verklaren in termen van technologische ontwikkelingen en toepassingsdomeinen.",
	},

	// Keuzethema L: Netwerken
	{
		code: "L1",
		name: "Netwerkcommunicatie",
		parent: "L",
		description:
			"De kandidaat kan de manier waarop netwerkcomponenten met elkaar communiceren beschrijven en analyseren, en kan schalingseffecten bij communicatie herkennen, er voorbeelden van geven en de gevolgen ervan uitleggen.",
	},
	{
		code: "L2",
		name: "Internet",
		parent: "L",
		description:
			"De kandidaat kan de basisprincipes van het internet als netwerk uitleggen en aangeven welke gevolgen dit heeft voor toepassingen en voor gebruikers.",
	},
	{
		code: "L3",
		name: "Distributie",
		parent: "L",
		description:
			"De kandidaat kan vormen van samenwerking en verdeling van functies en gegevens in netwerken beschrijven.",
	},
	{
		code: "L4",
		name: "Netwerksecurity",
		parent: "L",
		description:
			"De kandidaat kan gevaren van inbreuk op gedistribueerde functies en gegevens analyseren, en maatregelen adviseren die deze inbreuk tegengaan.",
	},

	// Keuzethema M: Physical computing
	{
		code: "M1",
		name: "Sensoren en actuatoren",
		parent: "M",
		description:
			"De kandidaat kan sensoren en actuatoren waarmee een computersysteem de fysieke omgeving kan waarnemen en aansturen herkennen en functioneel beschrijven.",
	},
	{
		code: "M2",
		name: "Ontwikkeling physical computing componenten",
		parent: "M",
		description:
			"De kandidaat kan fysieke systemen en processen modelleren met het oog op real time besturingsaspecten en kan met behulp van deze modellen, sensoren en actuatoren een computersysteem ontwikkelen om fysieke systemen en processen te bewaken en besturen.",
	},

	// Keuzethema N: Security
	{
		code: "N1",
		name: "Risicoanalyse",
		parent: "N",
		description:
			"De kandidaat kan risico's, bedreigingen en kwetsbaarheden in een ict-toepassing analyseren en kan daarbij zowel technische als menselijke factoren betrekken.",
	},
	{
		code: "N2",
		name: "Maatregelen",
		parent: "N",
		description:
			"De kandidaat kan keuzen voor technische en organisatorische maatregelen ter vergroting van de security verklaren.",
	},

	// Keuzethema O: Usability
	{
		code: "O1",
		name: "Gebruikersinterfaces",
		parent: "O",
		description:
			"De kandidaat kan de werking van gebruikersinterfaces beschrijven en verklaren aan de hand van cognitieve en biologische modellen.",
	},
	{
		code: "O2",
		name: "Gebruikersonderzoek",
		parent: "O",
		description:
			"De kandidaat kan gebruikersinterfaces van digitale artefacten evalueren via gebruikersonderzoek.",
	},
	{
		code: "O3",
		name: "Ontwerp",
		parent: "O",
		description: "De kandidaat kan elementen van een gebruikersinterface ontwerpen.",
	},

	// Keuzethema P: User Experience
	{
		code: "P1",
		name: "Analyse",
		parent: "P",
		description:
			"De kandidaat kan de relatie tussen ontwerpkeuzes van een interactief digitaal artefact en de verwachte cognitieve, gedragsmatige en affectieve veranderingen of ervaringen verklaren.",
	},
	{
		code: "P2",
		name: "Ontwerp",
		parent: "P",
		description:
			"De kandidaat kan voor een digitaal artefact de gebruikersinteractie vormgeven, de ontwerpbeslissingen verantwoorden en voor een eenvoudige toepassing implementeren.",
	},

	// Keuzethema Q: Maatschappelijke en individuele invloed van informatica
	{
		code: "Q1",
		name: "Maatschappelijke invloed",
		parent: "Q",
		description:
			"De kandidaat kan positieve en negatieve effecten van informatica en de genetwerkte samenleving op individueel en sociaal leven verklaren en voorspellen.",
	},
	{
		code: "Q2",
		name: "Juridische aspecten",
		parent: "Q",
		description:
			"De kandidaat kan juridische aspecten van de toepassing van informatica in de samenleving analyseren.",
	},
	{
		code: "Q3",
		name: "Privacy",
		parent: "Q",
		description:
			"De kandidaat kan effecten van technische, juridische en sociale maatregelen voor privacy-gerelateerde kwesties onderzoeken.",
	},
	{
		code: "Q4",
		name: "Cultuur",
		parent: "Q",
		description: "De kandidaat kan redeneren over de invloed van informatica op culturele uitingen.",
	},

	// Keuzethema R: Computational Science
	{
		code: "R1",
		name: "Modelleren",
		parent: "R",
		description:
			"De kandidaat kan aspecten van een andere wetenschappelijke discipline modelleren in computationele termen.",
	},
	{
		code: "R2",
		name: "Simuleren",
		parent: "R",
		description:
			"De kandidaat kan modellen en simulaties construeren en gebruiken voor het onderzoeken van verschijnselen in die andere wetenschap.",
	},
];

export const examDomainCodes: string[] = examDomains.map((d) => d.code);

export const examDomainByCode: Map<string, ExamDomain> = new Map(
	examDomains.map((d) => [d.code, d]),
);

// Hulpfunctie voor tooltip-tekst op een chip
export function formatExamDomainTooltip(code: string): string {
	const d = examDomainByCode.get(code);
	if (!d) return code;
	return `${d.code} — ${d.name}\n\n${d.description}`;
}

// Keuzedomeinen op hoofdletter-niveau — voor compacte filter-chips waarbij de
// subdomeinen alleen in de tooltip zichtbaar zijn.
export type KeuzeDomainGroup = {
	letter: string;       // "G"
	name: string;         // "Algoritmiek, berekenbaarheid en logica"
};

export const keuzeDomainGroups: KeuzeDomainGroup[] = [
	{ letter: "G", name: "Algoritmiek, berekenbaarheid en logica" },
	{ letter: "H", name: "Databases" },
	{ letter: "I", name: "Cognitive computing" },
	{ letter: "J", name: "Programmeerparadigma's" },
	{ letter: "K", name: "Computerarchitectuur" },
	{ letter: "L", name: "Netwerken" },
	{ letter: "M", name: "Physical computing" },
	{ letter: "N", name: "Security" },
	{ letter: "O", name: "Usability" },
	{ letter: "P", name: "User Experience" },
	{ letter: "Q", name: "Maatschappelijke en individuele invloed van informatica" },
	{ letter: "R", name: "Computational Science" },
];

const keuzeDomainGroupByLetter: Map<string, KeuzeDomainGroup> = new Map(
	keuzeDomainGroups.map((g) => [g.letter, g]),
);

// Tooltip voor een hoofdletter-chip: toont alle onderliggende subdomeinen
// met code, naam en eindtermbeschrijving.
export function formatKeuzeDomainTooltip(letter: string): string {
	const group = keuzeDomainGroupByLetter.get(letter);
	if (!group) return letter;
	const subs = examDomains.filter((d) => d.parent === letter);
	const subText = subs
		.map((d) => `${d.code} ${d.name}\n${d.description}`)
		.join("\n\n");
	return `${group.letter} — ${group.name}\n\n${subText}`;
}

const kernParents = new Set(["B", "C", "D", "E", "F"]);

export type CardChip = {
	display: string;
	strength: "strong" | "weak";
	title: string;
};

// Bouw chip-data voor een tutorial-kaart: kerndomeinen worden als subdomein-code
// getoond (B1, C3, …); keuzedomeinen worden samengevoegd tot hun hoofdletter
// (G, H, …) en hun subdomeinen verschijnen alleen in de tooltip.
export function buildCardChips(mappings: ExamMapping[] | undefined): CardChip[] {
	if (!mappings?.length) return [];

	const kernChips: CardChip[] = [];
	const keuzeGroups = new Map<string, ExamMapping[]>();

	for (const m of mappings) {
		const domain = examDomainByCode.get(m.code);
		const parent = domain?.parent ?? "";
		if (kernParents.has(parent)) {
			const strengthLabel = m.strength === "strong" ? "sterk" : "zwak";
			kernChips.push({
				display: m.code,
				strength: m.strength,
				title: `${m.code} — ${domain?.name ?? ""} (${strengthLabel} raakvlak)\n\n${domain?.description ?? ""}`,
			});
		} else if (parent) {
			const arr = keuzeGroups.get(parent) ?? [];
			arr.push(m);
			keuzeGroups.set(parent, arr);
		}
	}

	const keuzeChips: CardChip[] = Array.from(keuzeGroups.entries()).map(
		([letter, ms]) => {
			const strength: "strong" | "weak" = ms.some((m) => m.strength === "strong")
				? "strong"
				: "weak";
			const group = keuzeDomainGroupByLetter.get(letter);
			const header = group
				? `${group.letter} — ${group.name}`
				: letter;
			const overallLabel = strength === "strong" ? "sterk" : "zwak";
			const subText = ms
				.map((m) => {
					const d = examDomainByCode.get(m.code);
					const sLabel = m.strength === "strong" ? "sterk" : "zwak";
					return `${m.code} ${d?.name ?? ""} (${sLabel})\n${d?.description ?? ""}`;
				})
				.join("\n\n");
			return {
				display: letter,
				strength,
				title: `${header} — ${overallLabel} raakvlak\n\n${subText}`,
			};
		},
	);

	return [...kernChips, ...keuzeChips];
}
