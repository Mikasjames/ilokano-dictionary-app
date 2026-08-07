import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("$app/environment", () => ({ browser: true }));
vi.mock("$app/navigation", () => ({ goto: vi.fn() }));

if (typeof window !== "undefined") {
	if (!window.matchMedia) {
		window.matchMedia = ((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => false
		})) as typeof window.matchMedia;
	}

	class ResizeObserverStub {
		observe() {}
		unobserve() {}
		disconnect() {}
	}
	(globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;

	if (!Element.prototype.scrollIntoView) {
		Element.prototype.scrollIntoView = () => {};
	}
}
