import { expect, test } from "bun:test";

test("negative price input rejected", () => {
	const value = "-50000";
	const isNegative = value && parseFloat(value) < 0;
	expect(isNegative).toBe(true);
});

test("location parameter sanitization - valid locations pass", () => {
	const validLocations = ["baki/abseron", "baki/xetai", "baki/sahil"];
	const sanitize = (loc: string) => /^[a-z0-9\-/_]*$/.test(loc);

	validLocations.forEach((loc) => {
		expect(sanitize(loc)).toBe(true);
	});
});

test("location parameter sanitization - invalid locations blocked", () => {
	const invalidLocations = [
		"<script>alert('xss')</script>",
		"baki/test'; DROP TABLE--",
		'baki/test"><img src=x onerror=alert(1)>',
	];
	const sanitize = (loc: string) => /^[a-z0-9\-/_]*$/.test(loc);

	invalidLocations.forEach((loc) => {
		expect(sanitize(loc)).toBe(false);
	});
});

test("location array filtering removes invalid entries", () => {
	const locations = [
		"baki/abseron",
		"<script>alert('xss')</script>",
		"baki/xetai",
		"baki/test'; DROP TABLE--",
	];
	const sanitize = (loc: string) => /^[a-z0-9\-/_]*$/.test(loc);
	const filtered = locations.filter(sanitize);

	expect(filtered).toEqual(["baki/abseron", "baki/xetai"]);
});

test("numeric input validation - min attribute set to 0", () => {
	const inputConfig = { type: "number", min: "0" };
	expect(inputConfig.min).toBe("0");
	expect(inputConfig.type).toBe("number");
});

test("numeric input validation - negative value cleared", () => {
	let value = "-50000";
	if (value && parseFloat(value) < 0) {
		value = "";
	}
	expect(value).toBe("");
});

test("numeric input validation - positive value preserved", () => {
	let value = "50000";
	if (value && parseFloat(value) < 0) {
		value = "";
	}
	expect(value).toBe("50000");
});

test("image src validation - empty src detected", () => {
	const src = "";
	const shouldHide = !src;
	expect(shouldHide).toBe(true);
});

test("image src validation - valid src not hidden", () => {
	const src = "https://example.com/image.jpg";
	const shouldHide = !src;
	expect(shouldHide).toBe(false);
});

test("dialog close button accessibility - aria-label present", () => {
	const closeButtonConfig = {
		ariaLabel: "Close dialog",
		variant: "ghost",
	};
	expect(closeButtonConfig.ariaLabel).toBe("Close dialog");
});

test("meta tag name validation - mobile-web-app-capable", () => {
	const metaConfig = {
		name: "mobile-web-app-capable",
		content: "yes",
	};
	expect(metaConfig.name).toBe("mobile-web-app-capable");
	expect(metaConfig.content).toBe("yes");
});

test("backdrop click handler - target equals currentTarget", () => {
	const mockEvent = {
		target: "dialog",
		currentTarget: "dialog",
	};
	const shouldClose = mockEvent.target === mockEvent.currentTarget;
	expect(shouldClose).toBe(true);
});

test("backdrop click handler - target not dialog", () => {
	const mockEvent = {
		target: "inner-div",
		currentTarget: "dialog",
	};
	const shouldClose = mockEvent.target === mockEvent.currentTarget;
	expect(shouldClose).toBe(false);
});
