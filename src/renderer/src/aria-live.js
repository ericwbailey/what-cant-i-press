/**
 * aria-live.js — announce messages to assistive technology.
 *
 * Framework-free, dependency-free, no build step. Vanilla-JS port of
 * github-app's `src/lib/aria-live.ts` + `src/hooks/useAnnounce.ts`.
 *
 * Usage:
 * import { announce } from "./aria-live.js";
 * announce("Changes saved");
 * announce("Upload failed", { assertive: true });
 *
 * The two global live regions are created lazily on first use and appended to
 * <body> with inline visually-hidden styles, so the host app needs no HTML
 * markup and no CSS (no Tailwind `sr-only`).
 */
const POLITE_REGION_ID = "js-global-screen-reader-notice";
const ASSERTIVE_REGION_ID = "js-global-screen-reader-notice-assertive";
// Equivalent to Tailwind's `sr-only`: visually hidden but read by screen
// readers. Applied inline so the host app needs no stylesheet.
const SR_ONLY_STYLE =
	"position:absolute;width:1px;height:1px;padding:0;margin:-1px;" +
	"overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
/**
 * Find the shared live region, creating and inserting it on first use.
 * @param {string} id
 * @param {"polite" | "assertive"} politeness
 * @returns {HTMLElement | null}
 */
function ensureRegion(id, politeness) {
	let region = document.getElementById(id);
	if (region) return region;
	const parent = document.body || document.documentElement;
	if (!parent) return null;
	region = document.createElement("div");
	region.id = id;
	region.setAttribute("aria-live", politeness);
	region.style.cssText = SR_ONLY_STYLE;
	parent.appendChild(region);
	return region;
}
/**
 * Announce a message update to the screen reader.
 *
 * Re-announcing the same string appends a non-breaking space so the screen
 * reader re-reads it (a live region whose text is unchanged is not re-read).
 *
 * Note: use caution when calling while a modal dialog is open — some screen
 * readers suppress global live-region updates, including through the closing
 * animation. Defer to the after-close hook, or pass a scoped `element` inside
 * the dialog.
 *
 * @param {string} message
 * @param {{ assertive?: boolean, element?: HTMLElement }} [options]
 */
export function announce(message, options) {
	if (typeof document === "undefined") return;
	const assertive = options ? options.assertive : false;
	const element = options ? options.element : undefined;
	const container =
		element ||
		ensureRegion(
			assertive ? ASSERTIVE_REGION_ID : POLITE_REGION_ID,
			assertive ? "assertive" : "polite",
		);
	if (!container) return;
	container.textContent =
		container.textContent === message ? `${message}\u00A0` : message;
}
