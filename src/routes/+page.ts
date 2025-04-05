export async function load({ url }) {
	let word = url.searchParams.get("word");
	return { word };
}
