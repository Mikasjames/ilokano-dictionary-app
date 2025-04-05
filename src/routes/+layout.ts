import { browser } from "$app/environment";
export const trailingSlash = "always";
export const load = async () => {
	if (browser && "serviceWorker" in navigator) {
		navigator.serviceWorker
			.register("../service-worker.js", {
				type: "module",
				scope: "/"
			})
			.catch(console.error);
	}

	return {};
};
