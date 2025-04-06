import { browser } from "$app/environment";
import { base } from "$app/paths";

export const trailingSlash = "always";
export const prerender = true;

export const load = async () => {
	if (browser && "serviceWorker" in navigator) {
		navigator.serviceWorker
			.register(`${base}/service-worker.js`, {
				type: "module",
				scope: base || "/"
			})
			.catch(console.error);
	}

	return {};
};
