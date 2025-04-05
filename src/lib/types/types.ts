export interface Definition {
	part_of_speech?: "n." | "v." | "adj." | "adv." | "interj.";
	definition?: string;
	eng_example?: string;
	ilok_example?: string;
	conjugation?: string;
	origin?: string;
	synonyms?: string[];
	antonyms?: string[];
	variations?: string[];
	cross_reference?: "";
	common_forms?: [];
	plural_form?: string;
}
