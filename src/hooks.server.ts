import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Cache JSON/JS/CSS for 1 year
	if (
		event.url.pathname.startsWith("/dictionary/") ||
		event.url.pathname.endsWith(".js") ||
		event.url.pathname.endsWith(".ts") ||
		event.url.pathname.endsWith(".css")
	) {
		response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
	} else {
		// Cache HTML for 1 hour
		response.headers.set("Cache-Control", "public, max-age=3600");
	}

	return response;
};
