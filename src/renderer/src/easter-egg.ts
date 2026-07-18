/**
 * Konami-style Easter egg: pressing Up, Up, Down, Down, Left, Right, Left,
 * Right, B, A in series flips the whole app over like a card, revealing a back
 * face with a single button (a freckled cartoon butt) that plays a sound and
 * flips it back. Keys are matched by physical `event.code`, one discrete press at
 * a time (auto-repeat from a held key is ignored), with no timing constraints.
 */

import eggSoundUrl from './assets/easter-egg.wav'

/** The sequence to match, expressed as `KeyboardEvent.code` values. */
export const KONAMI_SEQUENCE: readonly string[] = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA'
]

/**
 * Builds a stateful matcher for `sequence`. Feed each keypress to `press`;
 * it returns true only on the press that completes the full sequence, then
 * resets so the egg can fire again. A mismatch resets progress, restarting at
 * step 1 when the key equals the first step so a fresh attempt is not lost.
 */
export function createSequenceDetector(
  sequence: readonly string[]
): (code: string) => boolean {
  let index = 0
  return (code: string): boolean => {
    if (code === sequence[index]) {
      index += 1
    } else {
      // Restart, honoring the current key as a possible first step.
      index = code === sequence[0] ? 1 : 0
    }
    if (index === sequence.length) {
      index = 0
      return true
    }
    return false
  }
}

/**
 * Wires the Konami detector to the card flip. Completing the sequence flips the
 * app to its back face; the back-face button (a freckled cartoon butt) plays a
 * sound and flips it back. The hidden face is marked `inert`/`aria-hidden` so
 * focus and assistive tech stay on the visible side. Auto-repeat keydown events
 * (a held key) are ignored so the egg is only triggered by discrete presses, and
 * the listener is observe-only (never calls `preventDefault`), leaving other key
 * handling such as the chord filter alone.
 */
export function initEasterEgg(): void {
  const flip = document.getElementById('flip')
  const front = flip?.querySelector<HTMLElement>('.flip-front')
  const back = flip?.querySelector<HTMLElement>('.flip-back')
  const easterEggButton = document.getElementById('easter-egg-btn')
  if (!flip || !front || !back || !easterEggButton) return

  // Created lazily (not at module scope) so the module stays importable outside
  // the DOM, e.g. under Node in unit tests where `Audio` is undefined.
  const eggSound = new Audio(eggSoundUrl)

  const playEggSound = (): void => {
    eggSound.currentTime = 0
    // Ignore rejections (e.g. autoplay restrictions); the flip still works.
    void eggSound.play().catch(() => {})
  }

  const setFlipped = (flipped: boolean): void => {
    flip.classList.toggle('is-flipped', flipped)
    front.toggleAttribute('inert', flipped)
    front.setAttribute('aria-hidden', String(flipped))
    back.toggleAttribute('inert', !flipped)
    back.setAttribute('aria-hidden', String(!flipped))
    // preventScroll: the button starts below the clip window; a default focus()
    // would scroll it into view instantly, skipping the slide-up transition.
    if (flipped) easterEggButton.focus({ preventScroll: true })
  }

  // Start with the back face inert/hidden.
  setFlipped(false)

  const detect = createSequenceDetector(KONAMI_SEQUENCE)
  window.addEventListener(
    'keydown',
    (event) => {
      if (event.repeat) return
      if (detect(event.code)) setFlipped(true)
    },
    true
  )

  easterEggButton.addEventListener('click', () => {
    playEggSound()
    setFlipped(false)
  })
}
