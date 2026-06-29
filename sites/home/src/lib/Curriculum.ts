import type { ExamMapping } from "./ExamProgram";

export type Activity = {
	title: string;
	labels: string[]; // Keep for backward compatibility

	// New categorical fields
	programmingLanguages?: string[];
	projectTypes?: string[];
	operatingSystems?: string[];

	// Examenprogramma-raakvlakken (havo/vwo informatica)
	examDomains?: ExamMapping[];

	level: "Beginner" | "Medium" | "Advanced";
	link: string;
	order: {
		vwo: number;
		havo: number;
	};
};

export let curriculum: Activity[] = [
	{
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
		link: "https://web.coderius.nl/",
		order: {
			vwo: 1,
			havo: 1,
		}
	},
	{
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
		link: "https://python.coderius.nl/",
		order: {
			vwo: 2,
			havo: 2,
		}
	},
	{
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
		link: "https://play.coderius.nl/",
		order: {
			vwo: 3,
			havo: 3,
		}
	},
	{
		title: 'Code Editor',
		labels: [],
		programmingLanguages: [],
		projectTypes: ["VS Code web", "VS Code Python", "git", "GitHub"],
		operatingSystems: ["Windows", "Linux", "macOS"],
		// Geen examDomains: het instrumentarium (editor, git, GitHub) valt onder domein A
		// dat we bewust niet meenemen in de mapping.
		level: "Beginner",
		link: "https://editor.coderius.nl/",
		order: {
			vwo: 2,
			havo: 2,
		}
	},
	{
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
		link: "https://robotica.coderius.nl/",
		order: {
			vwo: 4,
			havo: 4,
		}
	},
	{
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
		link: "https://ctf.coderius.nl/",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
	{
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
		link: "https://godot.coderius.nl/",
		order: {
			vwo: 6,
			havo: 6,
		}
	},
	{
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
		link: "https://dvwa.coderius.nl/",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
		{
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
		link: "https://fullstack.coderius.nl/",
		order: {
			vwo: 5,
			havo: 5,
		}
	},
	{
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
		link: "https://algoritmes.coderius.nl/",
		order: {
			vwo: 7,
			havo: 7,
		}
	},
];

export let ownCurriculum: Activity[] = curriculum;

export let levelColors: { [key in Activity["level"]]: string } = {
	Beginner: "green",
	Medium: "orange",
	Advanced: "red",
};
