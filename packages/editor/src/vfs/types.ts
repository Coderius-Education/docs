import type { RunnerId } from '../runners/types';

export interface Project {
  id: string;
  name: string;
  runnerId: RunnerId;
  entry: string;
  // Pad -> inhoud. Mappen zitten impliciet in de paden ('src/utils.py').
  files: Record<string, string>;
  // Expliciet aangemaakte (nog) lege mappen.
  folders: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSummary {
  id: string;
  name: string;
  runnerId: RunnerId;
  updatedAt: number;
}

export interface ProjectTemplate {
  id: string;
  runnerId: RunnerId;
  name: string;
  description: string;
  entry: string;
  files: Record<string, string>;
}
