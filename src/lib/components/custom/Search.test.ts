// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/svelte";
import Search from "./Search.svelte";
import { RECENTS_KEY } from "$lib/recents";

vi.mock("$lib/dictionary", () => ({
	loadSearchIndex: vi.fn().mockResolvedValue({
		balay: ["B", "house; a dwelling place"],
		abalay: ["A", "to fetch water"],
		nakabalay: ["N", "has a house"]
	}),
	wordUrl: (word: string) => `/?word=${encodeURIComponent(word)}`
}));

vi.mock("svelte-sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() }
}));

vi.mock("mode-watcher", () => ({
	toggleMode: vi.fn()
}));

import { loadSearchIndex } from "$lib/dictionary";
import { goto } from "$app/navigation";
import { toggleMode } from "mode-watcher";
import { toast } from "svelte-sonner";

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

function bigIndex(count: number): Record<string, [string, string]> {
	return Object.fromEntries(
		Array.from({ length: count }, (_, i) => [`abalay${i}`, ["A", `word number ${i} abalay`]])
	);
}

describe("Search", () => {
	it("renders the header", () => {
		render(Search);
		expect(screen.getByText(/IloCo/)).toBeInTheDocument();
	});

	it("shows recents from localStorage and clears them", () => {
		localStorage.setItem(RECENTS_KEY, JSON.stringify(["balay", "abaga"]));
		render(Search);

		expect(screen.getByRole("button", { name: "balay" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "abaga" })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Clear" }));

		expect(screen.queryByRole("button", { name: "balay" })).not.toBeInTheDocument();
		expect(localStorage.getItem(RECENTS_KEY)).toBe("[]");
	});

	it("does not show recents when storage is empty", () => {
		render(Search);
		expect(screen.queryByRole("button", { name: "Clear" })).not.toBeInTheDocument();
	});

	it("searches after an external search event and navigates on select", async () => {
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "balay" }));

		const option = await screen.findByRole("option", { name: /^balay/ });
		expect(loadSearchIndex).toHaveBeenCalled();

		fireEvent.click(option);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith("/?word=balay");
		});
	});

	it("shows a no-results message", async () => {
		vi.mocked(loadSearchIndex).mockResolvedValueOnce({});
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "zzz" }));

		await waitFor(() => {
			expect(screen.getByText(/No words found for/)).toBeInTheDocument();
		});
	});

	it("shows an error message and toast when the index fails to load", async () => {
		vi.mocked(loadSearchIndex).mockRejectedValueOnce(new Error("network down"));
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "balay" }));

		await waitFor(() => {
			expect(screen.getByText("network down")).toBeInTheDocument();
		});
		expect(toast.error).toHaveBeenCalledWith("network down");
	});

	it("reports the total count and when only the first results are shown", async () => {
		vi.mocked(loadSearchIndex).mockResolvedValueOnce(bigIndex(25));
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "abalay" }));

		await waitFor(() => {
			expect(screen.getByText(/Found 25 results/)).toBeInTheDocument();
			expect(screen.getByText(/showing first 20/)).toBeInTheDocument();
		});
	});

	it("reports a single result without pluralization", async () => {
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "nakabalay" }));

		await waitFor(() => {
			expect(screen.getByText("Found 1 result")).toBeInTheDocument();
		});
	});

	it("ignores external search events with an empty detail", async () => {
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "" }));

		await new Promise((r) => setTimeout(r, 350));
		expect(loadSearchIndex).not.toHaveBeenCalled();
	});

	it("opens a recent word and re-orders it to the front", async () => {
		localStorage.setItem(RECENTS_KEY, JSON.stringify(["balay", "abaga"]));
		render(Search);

		fireEvent.click(screen.getByRole("button", { name: "abaga" }));

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith("/?word=abaga");
		});
		expect(JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]")).toEqual(["abaga", "balay"]);
	});

	it("toggles the theme via the theme button", async () => {
		render(Search);

		fireEvent.click(screen.getByRole("button", { name: "Toggle theme" }));

		expect(toggleMode).toHaveBeenCalledOnce();
	});

	it("clears results when the search input is emptied", async () => {
		vi.mocked(loadSearchIndex).mockResolvedValueOnce(bigIndex(3));
		render(Search);
		const input = document.getElementById("search-input") as HTMLInputElement;

		fireEvent.input(input, { target: { value: "abalay" } });

		await waitFor(() => {
			expect(screen.getByRole("option", { name: /abalay0/ })).toBeInTheDocument();
		});

		fireEvent.input(input, { target: { value: "" } });

		await waitFor(() => {
			expect(screen.queryByRole("option", { name: /abalay0/ })).not.toBeInTheDocument();
			expect(screen.queryByText(/Found/)).not.toBeInTheDocument();
		});
	});

	it("saves a selection as a recent word", async () => {
		render(Search);

		window.dispatchEvent(new CustomEvent<string>("iloko:search", { detail: "balay" }));

		const option = await screen.findByRole("option", { name: /^balay/ });
		fireEvent.click(option);

		await waitFor(() => {
			expect(goto).toHaveBeenCalledWith("/?word=balay");
		});
		expect(JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]")).toEqual(["balay"]);
	});
});

describe("Search keyboard shortcuts", () => {
	it("focuses the search input on Ctrl+K", () => {
		render(Search);
		const input = document.getElementById("search-input") as HTMLInputElement;

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));

		expect(document.activeElement).toBe(input);
	});

	it("focuses the search input on Meta+K", () => {
		render(Search);
		const input = document.getElementById("search-input") as HTMLInputElement;

		window.dispatchEvent(new KeyboardEvent("keydown", { key: "K", metaKey: true }));

		expect(document.activeElement).toBe(input);
	});

	it("focuses the search input when / is pressed on a non-editable target", () => {
		render(Search);
		const input = document.getElementById("search-input") as HTMLInputElement;
		const event = new KeyboardEvent("keydown", { key: "/", cancelable: true });

		window.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(true);
		expect(document.activeElement).toBe(input);
	});

	it("does not handle / typed inside the search input", () => {
		render(Search);
		const input = document.getElementById("search-input") as HTMLInputElement;
		input.focus();
		const event = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true });

		input.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(document.activeElement).toBe(input);
	});

	it("ignores unrelated keys", () => {
		render(Search);
		const event = new KeyboardEvent("keydown", { key: "a", cancelable: true });

		window.dispatchEvent(event);

		expect(event.defaultPrevented).toBe(false);
		expect(document.activeElement).not.toBe(document.getElementById("search-input"));
	});
});
