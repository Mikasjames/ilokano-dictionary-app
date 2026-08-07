// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/svelte";
import BadgeWords from "./BadgeWords.svelte";

import { goto } from "$app/navigation";

beforeEach(() => {
	vi.clearAllMocks();
});

describe("BadgeWords", () => {
	it("renders the title and one badge per entry", () => {
		render(BadgeWords, { title: "Synonyms", wordEntries: ["abaga", "takleng"] });

		expect(screen.getByRole("heading", { name: "Synonyms" })).toBeInTheDocument();
		expect(screen.getByText("abaga")).toBeInTheDocument();
		expect(screen.getByText("takleng")).toBeInTheDocument();
	});

	it("navigates to the word page when a badge is clicked", () => {
		render(BadgeWords, { title: "See Also", wordEntries: ["abaga"] });

		fireEvent.click(screen.getByText("abaga"));

		expect(goto).toHaveBeenCalledWith("/?word=abaga");
	});

	it("calls the clickBadge callback when provided", () => {
		const clickBadge = vi.fn();
		render(BadgeWords, {
			title: "Variations",
			wordEntries: ["abagaan"],
			clickBadge
		});

		fireEvent.click(screen.getByText("abagaan"));

		expect(clickBadge).toHaveBeenCalledWith("abagaan");
		expect(goto).not.toHaveBeenCalled();
	});

	it("encodes special characters in the URL", () => {
		render(BadgeWords, { title: "See Also", wordEntries: ["a b"] });

		fireEvent.click(screen.getByText("a b"));

		expect(goto).toHaveBeenCalledWith("/?word=a%20b");
	});
});
