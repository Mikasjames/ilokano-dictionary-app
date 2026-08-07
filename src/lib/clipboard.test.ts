import { describe, it, expect, vi, afterEach } from "vitest";
import { copyText } from "./clipboard";

const originalNavigator = globalThis.navigator;
const originalDocument = globalThis.document;

function setNavigator(value: unknown) {
	Object.defineProperty(globalThis, "navigator", {
		value,
		configurable: true,
		writable: true
	});
}

function setDocument(value: unknown) {
	Object.defineProperty(globalThis, "document", {
		value,
		configurable: true,
		writable: true
	});
}

afterEach(() => {
	if (originalNavigator === undefined) {
		Reflect.deleteProperty(globalThis, "navigator");
	} else {
		Object.defineProperty(globalThis, "navigator", {
			value: originalNavigator,
			configurable: true,
			writable: true
		});
	}
	if (originalDocument === undefined) {
		Reflect.deleteProperty(globalThis, "document");
	} else {
		Object.defineProperty(globalThis, "document", {
			value: originalDocument,
			configurable: true,
			writable: true
		});
	}
	vi.restoreAllMocks();
});

describe("copyText", () => {
	it("uses the async clipboard API when available", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		setNavigator({ clipboard: { writeText } });

		await copyText("abalayan");

		expect(writeText).toHaveBeenCalledOnce();
		expect(writeText).toHaveBeenCalledWith("abalayan");
	});

	it("falls back to execCommand without a clipboard API", async () => {
		const execCommand = vi.fn().mockReturnValue(true);
		const select = vi.fn();
		const textarea = { value: "", select, style: {} as Record<string, string> };
		setNavigator({});
		setDocument({
			createElement: vi.fn(() => textarea),
			execCommand,
			body: { appendChild: vi.fn(), removeChild: vi.fn() }
		});

		await copyText("balay");

		expect(document.createElement).toHaveBeenCalledWith("textarea");
		expect(textarea.value).toBe("balay");
		expect(textarea.style.position).toBe("fixed");
		expect(select).toHaveBeenCalledOnce();
		expect(execCommand).toHaveBeenCalledWith("copy");
		expect(document.body.appendChild).toHaveBeenCalledWith(textarea);
		expect(document.body.removeChild).toHaveBeenCalledWith(textarea);
	});

	it("resolves when the fallback copy fails", async () => {
		const execCommand = vi.fn().mockReturnValue(false);
		setNavigator({});
		setDocument({
			createElement: vi.fn(() => ({ value: "", select: vi.fn(), style: {} })),
			execCommand,
			body: { appendChild: vi.fn(), removeChild: vi.fn() }
		});

		await expect(copyText("hi")).resolves.toBeUndefined();
	});
});
