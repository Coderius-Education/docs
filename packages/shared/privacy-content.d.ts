// Types voor privacy-content.js (plain CommonJS-data).

export interface PrivacySection {
  id: string;
  heading: string;
  paragraphs: string[];
  list?: string[];
  /** Alinea's die na `list` gerenderd worden (optioneel vervolg op de lijst). */
  trailingParagraphs?: string[];
}

export interface PrivacyContent {
  lastUpdated: string;
  retentionDays: number;
  controller: { schoolName: string; contactEmail: string };
  sections: PrivacySection[];
}

export const PRIVACY_CONTENT: PrivacyContent;
