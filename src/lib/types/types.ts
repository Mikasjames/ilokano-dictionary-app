export interface Definition {
	part_of_speech?: "n." | "v." | "adj." | "adv." | "interj." | "conj." | "prep." | "pron." | "pref." | "suf.";
	definition?: string;
	eng_example?: string;
	ilok_example?: string;
	conjugation?: string;
	origin?: string;
	synonyms?: string[];
	antonyms?: string[];
	variations?: string[];
	cross_references?: string[];
	cross_reference?: string; // Legacy fallback
	common_forms?: string[];
	plural_form?: string;
	phrases?: {
		phrase: string;
		definition: string;
	}[];
	examples?: {
		root: string;
		derivative: string;
		definition: string;
		eng_example?: string;
		ilok_example?: string;
	}[];
}
