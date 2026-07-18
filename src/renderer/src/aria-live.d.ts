/**
 * Ambient type declarations for the framework-free `aria-live.js` module.
 * The module is authored in plain JS; the renderer typechecks under `strict`
 * with `allowJs` off, so this sibling declaration lets `main.ts` import
 * `./aria-live.js` with types. Vite still bundles the real `.js`.
 */
export interface AnnounceOptions {
  assertive?: boolean
  element?: HTMLElement
}

export function announce(message: string, options?: AnnounceOptions): void
