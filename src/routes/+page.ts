import { browser } from "$app/environment";

export async function load({ url }) {
	if (browser) {
		let word = url.searchParams.get("word");
		return { word };
	}
}
