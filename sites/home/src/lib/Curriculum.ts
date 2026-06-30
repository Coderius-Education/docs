import { SITES_BY_ID } from "@coderius/shared/sites";
import type { ExamMapping } from "./ExamProgram";

export type Activity = {
	/** Registry-id uit packages/shared/sites.js; bepaalt de link. */
	id: string;
	title: string;
	labels: string[]; // Keep for backward compatibility

	// New categorical fields
	programmingLanguages?: string[];
	projectTypes?: string[];
	operatingSystems?: string[];

	// Examenprogramma-raakvlakken (havo/vwo informatica)
	examDomains?: ExamMapping[];

	level: "Beginner" | "Medium" | "Advanced";
	/** Afgeleid uit de gedeelde registry (SITES_BY_ID[id].url); niet hardcoden. */
	link: string;
	order: {
		vwo: number;
		havo: number;
	};
};

// De cursus-URL's komen uit de gedeelde registry (packages/shared/sites.js), de
// enige bron van waarheid. Zo blijven de homepage-kaarten en de cross-site
// navigatie van de Docusaurus-sites automatisch in sync.
function siteUrl(id: string): string {
	const site = SITES_BY_ID[id];
	if (!site) throw new Error(`Onbekende cursus-id in Curriculum: ${id}`);
	return site.url;
}

type CurriculumEntry = Omit<Activity, "link">;

const entries: CurriculumEntry[] = [
	{
		id: "web",
		title: "Web Development",
		labels: [],
		programmingLanguages: ["HTML", "CSS"],
		projectTypes: ["Web Development"],
		operatingSystems: ["Windows", "Linux", "macOS", "ChromeOS"],
		examDomains: [
			{ code: "C3", strength: "strong" },
			{ code: "C4", strength: "weak" },
			{ code: "D1", strength: "strong" },
			{ code: "F1", strength: "weak" },
		],
		level: "Beginner",
		order: {
			vwo: 1,
			havo: 1,
		}
	},
	{
		id: "python",
		title: "Python",
		labels: [],
		programmingLanguages: ["Python"],
		projectTypes: [],
		operatingSystems: ["Windows", "Linux", "macOS", "ChromeOS"],
		examDomains: [
			{ code: "B1", strength: "weak" },
			{ code: "C5", strength: "weak" },
			{ code: "D1", strength: "strong" },
			{ code: "D2", strength: "strong" },
		],
		level: "Beginner",
		order: {
			vwo: 2,
			havo: 2,
		}
	},
	{
		id: "play",
		title: "Python Play",
		labels: [],
		programmingLanguages: ["Python"],
		projectTypes: ["Game Development"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		examDomains: [
			{ code: "B1", strength: "strong" },
			{ code: "C5", strength: "weak" },
			{ code: "D1", strength: "strong" },
			{ code: "F1", strength: "weak" },
		],
		level: "Beginner",
		order: {
			vwo: 3,
			havo: 3,
		}
	},
	{
		id: "editor",
		title: 'Code Editor',
		labels: [],
		programmingLanguages: [],
		projectTypes: ["VS Code web", "VS Code Python", "git", "GitHub"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		// Geen examDomains: het instrumentarium (editor, git, GitHub) valt onder domein A
		// dat we bewust niet meenemen in de mapping.
		level: "Beginner",
		order: {
			vwo: 2,
			havo: 2,
		}
	},
	{
		id: "robotica",
		title: "Robotica",
		labels: ["Robotics", "Python"],
		programmingLanguages: ["Python"],
		projectTypes: ["Robotics"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		examDomains: [
			{ code: "B1", strength: "weak" },
			{ code: "D1", strength: "strong" },
			{ code: "E1", strength: "weak" },
			{ code: "M1", strength: "strong" },
			{ code: "M2", strength: "strong" },
		],
		level: "Medium",
		order: {
			vwo: 4,
			havo: 4,
		}
	},
	{
		id: "ctf",
		title: 'Capture the Flag',
		labels: [],
		programmingLanguages: [],
		projectTypes: ["Cybersecurity"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		examDomains: [
			{ code: "E2", strength: "strong" },
			{ code: "F2", strength: "weak" },
			{ code: "F3", strength: "weak" },
			{ code: "F4", strength: "weak" },
			{ code: "N1", strength: "strong" },
			{ code: "N2", strength: "strong" },
		],
		level: "Beginner",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
	{
		id: "godot",
		title: "Godot game engine",
		labels: [],
		programmingLanguages: ["GDScript"],
		projectTypes: ["Game Development"],
		operatingSystems: ["Windows", "Linux", "macOS", "ChromeOS"],
		examDomains: [
			{ code: "B1", strength: "weak" },
			{ code: "D1", strength: "strong" },
			{ code: "F1", strength: "strong" },
			{ code: "O3", strength: "weak" },
			{ code: "P2", strength: "strong" },
		],
		level: "Medium",
		order: {
			vwo: 6,
			havo: 6,
		}
	},
	{
		id: "dvwa",
		title: "Vulnerable Web Application",
		labels: ["Cybersecurity", "Web"],
		programmingLanguages: ["Linux Shell"],
		projectTypes: ["Cybersecurity", "Web Development"],
		operatingSystems: ["Windows", "Linux"],
		examDomains: [
			{ code: "E2", strength: "strong" },
			{ code: "L4", strength: "weak" },
			{ code: "N1", strength: "strong" },
			{ code: "N2", strength: "weak" },
		],
		level: "Advanced",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
	{
		id: "fullstack",
		title: "Full stack web development",
		labels: ["Javascript", "Python"],
		programmingLanguages: ["HTML", "CSS", "JavaScript", "Python"],
		projectTypes: ["Web Development"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		examDomains: [
			{ code: "D1", strength: "strong" },
			{ code: "E1", strength: "strong" },
			{ code: "F1", strength: "strong" },
			{ code: "H1", strength: "weak" },
			{ code: "L2", strength: "weak" },
			{ code: "O3", strength: "weak" },
		],
		level: "Advanced",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
	{
		id: "algorithms",
		title: "Algoritmes",
		labels: [],
		programmingLanguages: ["Python"],
		projectTypes: ["Algorithms"],
		operatingSystems: ["Windows", "Linux", "macOS", "ChromeOS"],
		examDomains: [
			{ code: "B1", strength: "strong" },
			{ code: "B2", strength: "strong" },
			{ code: "B4", strength: "weak" },
			{ code: "D1", strength: "weak" },
			{ code: "G1", strength: "weak" },
			{ code: "I1", strength: "weak" },
		],
		level: "Medium",
		order: {
			vwo: 7,
			havo: 7,
		}
	},
	{
		id: "ide",
		title: "Online Editor",
		labels: [],
		programmingLanguages: ["Python", "HTML", "CSS"],
		projectTypes: ["Online Editor"],
		operatingSystems: ["Windows", "Linux", "macOS", "ChromeOS"],
		// Gereedschap (browser-IDE), zoals de Code Editor: valt onder domein A en
		// krijgt daarom geen examDomains-mapping.
		level: "Beginner",
		// TODO(curriculum): juiste plek in de leerlijn bevestigen.
		order: {
			vwo: 1,
			havo: 1,
		}
	},
	{
		id: "embedded",
		title: "Embedded",
		labels: [],
		programmingLanguages: ["C++", "MicroPython"],
		projectTypes: ["Embedded", "Robotics"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		// TODO(curriculum): examDomains-mapping laten invullen door de
		// curriculum-eigenaar (niet verzinnen).
		examDomains: [],
		level: "Medium",
		// TODO(curriculum): juiste plek in de leerlijn bevestigen.
		order: {
			vwo: 4,
			havo: 4,
		}
	},
];

export let curriculum: Activity[] = entries.map((e) => ({
	...e,
	link: siteUrl(e.id),
}));

export let ownCurriculum: Activity[] = curriculum;

export let levelColors: { [key in Activity["level"]]: string } = {
	Beginner: "green",
	Medium: "orange",
	Advanced: "red",
};
