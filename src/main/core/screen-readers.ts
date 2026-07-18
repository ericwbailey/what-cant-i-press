/**
 * Curated screen-reader keyboard commands for JAWS, NVDA, and Narrator (Windows)
 * and VoiceOver (macOS).
 *
 * Screen readers reserve very large numbers of keystrokes while running, none of
 * which any live OS/menu API can enumerate. These readers are therefore injected
 * unconditionally on every scan and every platform, so the auditor always shows
 * "what you can't press" while a screen reader is active — even on a host OS where
 * a given reader does not run, and even when it is not installed.
 *
 * Representation: each command carries a verbatim `keystroke` label rather than a
 * key + modifier pair. The reader key (Insert / Caps Lock / the NVDA key / the
 * VoiceOver VO modifier), numpad keys, and multi-step sequences ("Insert +
 * Spacebar, then S", "VO + M + M") do not fit the modifier model, and the label
 * must render with fixed reader notation regardless of host platform. The
 * aggregator uses the label directly as the display combo and
 * as the dedupe id (segment + appId + keystroke), so a reader that happens to be
 * running cannot produce a second copy.
 *
 * Data is transcribed from the official manuals:
 * - JAWS: support.freedomscientific.com/Content/Documents/Manuals/JAWS/Keystrokes.txt
 * - NVDA: download.nvaccess.org/documentation/userGuide.html (Commands Quick Reference)
 * - Narrator: support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures
 *   (Windows 11 Standard keyboard layout)
 * - VoiceOver: Apple VoiceOver User Guide command reference
 *   (support.apple.com/guide/voiceover); the VO modifier is Control + Option
 *   or Caps Lock
 *
 * Scope: reader-specific commands only, for both the Desktop and Laptop keyboard
 * layouts. Generic Windows shortcuts, touch gestures, and braille-display
 * (dot-chord / rocker) commands are excluded — they are not reader-reserved
 * QWERTY keystrokes. For Narrator, the Windows+Ctrl+Enter start/stop toggle and
 * the bare Ctrl "stop reading" tap are likewise excluded (the former is an OS
 * shortcut already surfaced globally; the latter reserves no chord). For
 * VoiceOver, the full published command set is included; the VO modifier stands
 * for Control + Option (or Caps Lock).
 */

import type { RawShortcut } from '@shared/shortcuts'
import type { RunningApp } from '../providers/types'

const JAWS_APP_ID = 'screenreader.jaws'
const NVDA_APP_ID = 'screenreader.nvda'
const NARRATOR_APP_ID = 'screenreader.narrator'
const VOICEOVER_APP_ID = 'screenreader.voiceover'

interface ReaderCommand {
  keystroke: string
  description: string
}

/** A single-layout (or layout-independent) command. */
function cmd(keystroke: string, description: string): ReaderCommand {
  return { keystroke, description }
}

/**
 * A command that differs between the Desktop and Laptop layouts. Emits one entry
 * when the two layouts share a keystroke, or two distinct entries when they
 * differ, so both reserved keystrokes appear.
 */
function dl(desktop: string, laptop: string, description: string): ReaderCommand[] {
  return desktop === laptop
    ? [{ keystroke: desktop, description }]
    : [
        { keystroke: desktop, description },
        { keystroke: laptop, description }
      ]
}

/** Browse-mode single-letter navigation keys (forward; add Shift for previous). */
function browse(key: string, target: string): ReaderCommand {
  return { keystroke: key, description: `${target} (browse mode; add Shift for previous)` }
}

// ---------------------------------------------------------------------------
// JAWS
// ---------------------------------------------------------------------------

const JAWS_COMMANDS: ReaderCommand[] = [
  // Web browsing (JAWS-specific)
  cmd('Insert + A', 'Read address bar'),
  cmd('Insert + F9', 'List frames'),
  cmd('Insert + F7', 'List links'),
  cmd('Insert + F6', 'List headings'),
  cmd('Insert + F5', 'List form fields'),
  cmd('Insert + F3', 'Virtual HTML features'),
  cmd('Insert + Ctrl + Tab', 'Assign a custom label'),
  cmd('Windows + Ctrl + Equals', 'ARIA drag and drop'),
  cmd('Windows + Ctrl + Dash', 'ARIA live region text filter'),
  cmd('Insert + Spacebar, then X', 'Open the Flexible Web wizard'),
  cmd('Insert + X', 'Temporarily toggle Smart Navigation'),
  cmd('1 through 6', 'Move to heading at levels 1–6 (browse mode)'),

  // Navigation quick keys (browse mode)
  browse('A', 'Next radio button'),
  browse('B', 'Next button'),
  browse('C', 'Next combo box, list box, or tree view'),
  browse('D', 'Next different element'),
  browse('E', 'Next edit box'),
  browse('F', 'Next form control'),
  browse('G', 'Next graphic'),
  browse('H', 'Next heading'),
  browse('I', 'Next list item'),
  browse('J', 'Jump to line'),
  browse('K', 'Next placemarker'),
  browse('L', 'Next list'),
  browse('M', 'Next frame'),
  browse('N', 'Skip past a block of links'),
  browse('O', 'Next article'),
  browse('P', 'Next paragraph'),
  browse('Q', 'Move to the main region'),
  browse('R', 'Next region'),
  browse('S', 'Next same element'),
  browse('T', 'Next table'),
  browse('U', 'Next unvisited link'),
  browse('V', 'Next visited link'),
  browse('X', 'Next check box'),
  browse('Z', 'Next division'),
  browse('Apostrophe', 'Next tab control'),
  browse('Dash', 'Next separator'),
  browse('Slash', 'Next clickable element'),
  browse('Semicolon', 'Next mouse-over element'),
  cmd('Shift + Period', 'Next element'),
  cmd('Shift + Comma', 'Previous element'),

  // Forms (JAWS-specific list commands)
  cmd('Num Pad Plus', 'Exit forms mode'),
  cmd('Insert + Ctrl + Home', 'Move to the first form field'),
  cmd('Insert + Ctrl + End', 'Move to the last form field'),
  cmd('Ctrl + Insert + A', 'List radio buttons'),
  cmd('Ctrl + Insert + B', 'List buttons'),
  cmd('Ctrl + Insert + C', 'List combo boxes'),
  cmd('Ctrl + Insert + E', 'List edit boxes'),
  cmd('Ctrl + Insert + X', 'List check boxes'),

  // Tables
  cmd('F8', 'Select the current table'),
  cmd('Windows + Alt + Down Arrow', 'Move to the next table row'),
  cmd('Windows + Alt + Up Arrow', 'Move to the prior table row'),
  cmd('Windows + Comma', 'Read the current table row'),
  cmd('Windows + Alt + Right Arrow', 'Move to the next table column'),
  cmd('Windows + Alt + Left Arrow', 'Move to the prior table column'),
  cmd('Windows + Period', 'Read the current table column'),
  cmd('Alt + Ctrl + Right Arrow', 'Move to the next cell in the row'),
  cmd('Alt + Ctrl + Left Arrow', 'Move to the prior cell in the row'),
  cmd('Alt + Ctrl + Down Arrow', 'Move to the cell below'),
  cmd('Alt + Ctrl + Up Arrow', 'Move to the cell above'),
  cmd('Ctrl + Windows + J', 'Jump to a table cell'),
  cmd('Ctrl + Windows + Shift + J', 'Return to the previous cell'),

  // PlaceMarkers
  cmd('Ctrl + Windows + K', 'Set a temporary placemarker'),
  cmd('Ctrl + Shift + K', 'Add, delete, edit, or rename a permanent placemarker'),
  cmd('Alt + Windows + K', 'Return to a placemarker in Word'),
  cmd('Insert + Spacebar, then M', 'Select from a placemarker to the cursor'),

  // Elements
  cmd('Shift + Insert + F1', 'Display the current element'),
  cmd('Ctrl + Shift + Insert + F1', 'Display detailed element info'),
  cmd('Insert + Ctrl + Enter', 'Activate the mouse-over for an element'),

  // Reading text (Desktop / Laptop)
  ...dl('Num Pad 5', 'Caps Lock + Comma', 'Say character'),
  ...dl('Num Pad 5 twice quickly', 'Caps Lock + Comma twice quickly', 'Say character phonetically'),
  ...dl('Left Arrow', 'Caps Lock + M', 'Say prior character'),
  ...dl('Right Arrow', 'Caps Lock + Period', 'Say next character'),
  ...dl('Insert + Num Pad 5', 'Caps Lock + K', 'Say word'),
  ...dl('Insert + Num Pad 5 twice quickly', 'Caps Lock + K twice quickly', 'Spell word'),
  ...dl('Insert + Left Arrow', 'Caps Lock + J', 'Say prior word'),
  ...dl('Insert + Right Arrow', 'Caps Lock + L', 'Say next word'),
  ...dl('Insert + Up Arrow', 'Caps Lock + I', 'Say line'),
  ...dl('Insert + Up Arrow twice quickly', 'Caps Lock + I twice quickly', 'Spell line'),
  ...dl('Up Arrow', 'Caps Lock + U', 'Say prior line'),
  ...dl('Down Arrow', 'Caps Lock + O', 'Say next line'),
  ...dl('Alt + Num Pad 5', 'Caps Lock + H', 'Say sentence'),
  ...dl('Alt + Num Pad Minus', 'Caps Lock + Y', 'Say prior sentence'),
  ...dl('Alt + Num Pad Plus', 'Caps Lock + N', 'Say next sentence'),
  ...dl('Ctrl + Num Pad 5', 'Caps Lock + Ctrl + I', 'Say paragraph'),
  ...dl('Ctrl + Up Arrow', 'Caps Lock + Ctrl + U', 'Say prior paragraph'),
  ...dl('Ctrl + Down Arrow', 'Caps Lock + Ctrl + O', 'Say next paragraph'),
  ...dl('Insert + Home', 'Caps Lock + Shift + J', 'Say to cursor'),
  ...dl('Insert + Page Up', 'Caps Lock + Shift + L', 'Say from cursor'),
  ...dl('Insert + Down Arrow', 'Caps Lock + A', 'Say all'),
  ...dl('Insert + 5', 'Caps Lock + 5', 'Say color'),
  cmd('Alt + Ctrl + Page Up', 'Temporarily increase voice rate'),
  cmd('Alt + Ctrl + Page Down', 'Temporarily decrease voice rate'),
  cmd('Alt + Windows + Ctrl + Page Up', 'Permanently increase voice rate'),
  cmd('Alt + Windows + Ctrl + Page Down', 'Permanently decrease voice rate'),
  ...dl('Ctrl + Insert + Down Arrow', 'Caps Lock + Ctrl + Down Arrow', 'Start skim reading'),
  ...dl(
    'Ctrl + Shift + Insert + Down Arrow',
    'Caps Lock + Ctrl + Shift + Down Arrow',
    'Change skim reading preferences'
  ),
  ...dl(
    'Insert + Spacebar, then S',
    'Caps Lock + Spacebar, then S',
    'Cycle full, on-demand, and mute speech'
  ),
  ...dl(
    'Insert + Spacebar, then Shift + S',
    'Caps Lock + Spacebar, then Shift + S',
    'Toggle speech on demand or mute'
  ),

  // Informational (Desktop / Laptop)
  ...dl('Insert + F', 'Caps Lock + F', 'Say font'),
  ...dl('Insert + T', 'Caps Lock + T', 'Say window title'),
  ...dl('Insert + Tab', 'Caps Lock + Tab', 'Say window prompt and text'),
  ...dl('Ctrl + Insert + F', 'Caps Lock + Ctrl + F', 'JAWS Find'),
  ...dl('Insert + F3', 'Caps Lock + F3', 'JAWS Find Next'),
  ...dl('Insert + Shift + F3', 'Caps Lock + Shift + F3', 'JAWS Find Previous'),
  ...dl('Insert + End', 'Caps Lock + Shift + Y', 'Say top line of window'),
  ...dl('Insert + Page Down', 'Caps Lock + Shift + N', 'Say bottom line of window'),
  ...dl('Insert + Shift + Down Arrow', 'Caps Lock + Shift + A', 'Say selected text'),
  ...dl('Ctrl + Insert + V', 'Caps Lock + Ctrl + V', 'Get application version'),

  // Cursors and mouse (Desktop / Laptop)
  ...dl('Num Pad Plus', 'Caps Lock + Semicolon', 'Activate the PC cursor'),
  ...dl('Num Pad Minus', 'Caps Lock + P', 'Activate the JAWS cursor'),
  ...dl('Shift + Num Pad Plus', 'Caps Lock + Shift + Semicolon', 'Activate the touch cursor'),
  ...dl('Insert + Num Pad Plus', 'Caps Lock + Apostrophe', 'Route PC cursor to JAWS cursor'),
  ...dl('Insert + Num Pad Minus', 'Caps Lock + Left Bracket', 'Route JAWS cursor to PC cursor'),
  ...dl('Num Pad Slash', 'Caps Lock + 8', 'Left mouse button'),
  ...dl('Num Pad Star', 'Caps Lock + 9', 'Right mouse button'),
  ...dl('Ctrl + Insert + Num Pad Slash', 'Caps Lock + Ctrl + 8', 'Drag and drop'),
  ...dl('Insert + R', 'Caps Lock + R', 'Restrict the JAWS cursor'),

  // Dialog boxes (Desktop / Laptop)
  ...dl('Insert + E', 'Caps Lock + E', 'Say the default button'),
  ...dl('Insert + B', 'Caps Lock + B', 'Read window from top to bottom'),
  ...dl('Insert + C', 'Caps Lock + C', 'Read the word in context'),
  ...dl('Shift + Num Pad 5', 'Caps Lock + Shift + Comma', 'Say the current control hot key'),

  // Help (Desktop / Laptop)
  ...dl('Insert + Spacebar, then J', 'Caps Lock + Spacebar, then J', 'JAWS command search'),
  ...dl('Insert + F1', 'Caps Lock + F1', 'Context-sensitive help'),
  ...dl('Insert + 1', 'Caps Lock + 1', 'Keyboard help mode'),
  ...dl('Insert + H', 'Caps Lock + Ctrl + Shift + H', 'Hot key help'),
  ...dl('Insert + W', 'Caps Lock + W', 'Windows key help'),

  // Miscellaneous (Desktop / Laptop)
  ...dl('Insert + J', 'Caps Lock + Ctrl + Shift + J', 'Open the JAWS window'),
  ...dl('Insert + Escape', 'Caps Lock + Escape', 'Refresh the screen'),
  ...dl('Insert + V', 'Caps Lock + V', 'Quick settings'),
  ...dl('Insert + F2', 'Caps Lock + F2', 'Run JAWS manager'),
  ...dl('Insert + F4', 'Caps Lock + F4', 'Shut down JAWS'),
  ...dl('Insert + F10', 'Caps Lock + F10', 'Window list dialog'),
  ...dl('Insert + F11', 'Caps Lock + F11', 'Select a system tray icon'),
  ...dl('Insert + F12', 'Caps Lock + F12', 'Say the system time'),
  ...dl('Insert + G', 'Caps Lock + G', 'Graphics labeler'),
  ...dl('Ctrl + Insert + G', 'Caps Lock + Ctrl + G', 'Auto graphics labeler'),
  ...dl('Insert + 3', 'Caps Lock + 3', 'Pass the next key through'),
  ...dl('Alt + Insert + W', 'Alt + Caps Lock + W', 'Virtualize the window'),
  ...dl('Insert + Shift + V', 'Caps Lock + Shift + V', 'Virtualize the current control'),
  ...dl('Alt + Insert + S', 'Alt + Caps Lock + S', 'Select a scheme'),
  cmd('Ctrl + Windows + L', 'Select a language'),
  ...dl('Ctrl + Insert + S', 'Caps Lock + Ctrl + S', 'Select a voice profile'),
  ...dl('Ctrl + Insert + 1 through 0', 'Caps Lock + Ctrl + 1 through 0', 'Read list view columns 1–10'),
  ...dl('Insert + Windows + C', 'Caps Lock + Windows + C', 'Copy selected text to the FSClipboard'),
  ...dl('Insert + Spacebar, then H', 'Caps Lock + Spacebar, then H', 'Show speech history'),
  ...dl('Insert + Spacebar, then D', 'Caps Lock + Spacebar, then D', 'Toggle audio ducking'),
  ...dl('Insert + Spacebar, then Z', 'Caps Lock + Spacebar, then Z', 'Toggle default mode'),
  ...dl('Insert + Spacebar, then F11', 'Caps Lock + Spacebar, then F11', 'Toggle screen shade'),

  // Frames
  cmd('Ctrl + Shift + Left Bracket', 'Frame: get top left'),
  cmd('Ctrl + Shift + Right Bracket', 'Frame: get bottom right'),
  cmd('Ctrl + Shift + Left Bracket twice quickly', 'Frame: set to window'),

  // JAWS Tandem
  cmd('Insert + Alt + T', 'End a JAWS Tandem session'),
  cmd('Insert + Alt + Tab', 'Toggle between target and controller desktop'),
  cmd('Insert + Ctrl + Shift + V', 'Toggle video on the controller'),

  // Research It
  ...dl('Insert + Spacebar, then R', 'Caps Lock + Spacebar, then R', 'Open Research It'),
  ...dl('Insert + Windows + R', 'Caps Lock + Windows + R', 'Research It primary lookup'),

  // Convenient OCR (Desktop / Laptop)
  ...dl(
    'Insert + Spacebar, then O, then A',
    'Caps Lock + Spacebar, then O, then A',
    'OCR: acquire from camera or scanner'
  ),
  ...dl(
    'Insert + Spacebar, then O, then F',
    'Caps Lock + Spacebar, then O, then F',
    'OCR: recognize the selected image file'
  ),
  ...dl(
    'Insert + Spacebar, then O, then D',
    'Caps Lock + Spacebar, then O, then D',
    'OCR: recognize the current PDF'
  ),
  ...dl(
    'Insert + Spacebar, then O, then W',
    'Caps Lock + Spacebar, then O, then W',
    'OCR: recognize the current window'
  ),
  ...dl(
    'Insert + Spacebar, then O, then S',
    'Caps Lock + Spacebar, then O, then S',
    'OCR: recognize the entire screen'
  ),
  ...dl(
    'Insert + Spacebar, then O, then C',
    'Caps Lock + Spacebar, then O, then C',
    'OCR: recognize the selected control'
  ),
  ...dl(
    'Insert + Spacebar, then O, then Q',
    'Caps Lock + Spacebar, then O, then Q',
    'OCR: cancel recognition'
  ),

  // Picture Smart (Desktop / Laptop)
  ...dl(
    'Insert + Spacebar, then P, then A',
    'Caps Lock + Spacebar, then P, then A',
    'Picture Smart: describe from camera or scanner'
  ),
  ...dl(
    'Insert + Spacebar, then P, then F',
    'Caps Lock + Spacebar, then P, then F',
    'Picture Smart: describe the selected image file'
  ),
  ...dl(
    'Insert + Spacebar, then P, then B',
    'Caps Lock + Spacebar, then P, then B',
    'Picture Smart: describe the clipboard image'
  ),
  ...dl(
    'Insert + Spacebar, then P, then C',
    'Caps Lock + Spacebar, then P, then C',
    'Picture Smart: describe the current control'
  ),

  // Mouse Echo (Desktop / Laptop)
  ...dl(
    'Insert + Spacebar, then E, then O',
    'Caps Lock + Spacebar, then E, then O',
    'Mouse echo: toggle'
  )
]

// ---------------------------------------------------------------------------
// NVDA (the NVDA modifier key is shown as "NVDA")
// ---------------------------------------------------------------------------

const NVDA_COMMANDS: ReaderCommand[] = [
  // Basic
  cmd('Ctrl + Alt + N', 'Start or restart NVDA'),
  cmd('NVDA + N', 'Open the NVDA menu'),
  cmd('NVDA + 1', 'Toggle input help mode'),
  cmd('NVDA + Q', 'Quit NVDA'),
  cmd('NVDA + F2', 'Pass the next key through'),
  ...dl('NVDA + Shift + S', 'NVDA + Shift + Z', 'Toggle application sleep mode'),

  // Reporting system information
  cmd('NVDA + F12', 'Report the date and time'),
  cmd('NVDA + Shift + B', 'Report battery status'),
  cmd('NVDA + C', 'Report clipboard text'),

  // Speech modes
  cmd('NVDA + S', 'Cycle speech mode'),

  // System focus
  cmd('NVDA + Tab', 'Report the current focus'),
  cmd('NVDA + T', 'Report the title'),
  cmd('NVDA + B', 'Read the active window'),
  ...dl('NVDA + End', 'NVDA + Shift + End', 'Report the status bar'),
  ...dl('Shift + Num Pad 2', 'NVDA + Ctrl + Shift + Period', 'Report the shortcut key of the focus'),

  // System caret
  ...dl('NVDA + Down Arrow', 'NVDA + A', 'Say all'),
  ...dl('NVDA + Up Arrow', 'NVDA + L', 'Read the current line'),
  ...dl('NVDA + Shift + Up Arrow', 'NVDA + Shift + S', 'Read the current text selection'),
  cmd('NVDA + F', 'Report text formatting'),
  cmd('NVDA + K', 'Report link destination'),
  ...dl('NVDA + Num Pad Delete', 'NVDA + Delete', 'Report caret location'),
  cmd('Alt + Down Arrow', 'Move to the next sentence'),
  cmd('Alt + Up Arrow', 'Move to the previous sentence'),

  // Table navigation
  cmd('Ctrl + Alt + Left Arrow', 'Move to the previous column'),
  cmd('Ctrl + Alt + Right Arrow', 'Move to the next column'),
  cmd('Ctrl + Alt + Up Arrow', 'Move to the previous row'),
  cmd('Ctrl + Alt + Down Arrow', 'Move to the next row'),
  cmd('Ctrl + Alt + Home', 'Move to the first column'),
  cmd('Ctrl + Alt + End', 'Move to the last column'),
  cmd('Ctrl + Alt + Page Up', 'Move to the first row'),
  cmd('Ctrl + Alt + Page Down', 'Move to the last row'),
  cmd('NVDA + Ctrl + Alt + Down Arrow', 'Say all in the current column'),
  cmd('NVDA + Ctrl + Alt + Right Arrow', 'Say all in the current row'),
  cmd('NVDA + Ctrl + Alt + Up Arrow', 'Read the entire current column'),
  cmd('NVDA + Ctrl + Alt + Left Arrow', 'Read the entire current row'),

  // Object navigation (Desktop / Laptop)
  ...dl('NVDA + Num Pad 5', 'NVDA + Shift + O', 'Report the current object'),
  ...dl('NVDA + Num Pad 8', 'NVDA + Shift + Up Arrow', 'Move to the containing object'),
  ...dl('NVDA + Num Pad 4', 'NVDA + Shift + Left Arrow', 'Move to the previous object'),
  ...dl('NVDA + Num Pad 9', 'NVDA + Shift + Left Bracket', 'Move to the previous object (flattened)'),
  ...dl('NVDA + Num Pad 6', 'NVDA + Shift + Right Arrow', 'Move to the next object'),
  ...dl('NVDA + Num Pad 3', 'NVDA + Shift + Right Bracket', 'Move to the next object (flattened)'),
  ...dl('NVDA + Num Pad 2', 'NVDA + Shift + Down Arrow', 'Move to the first contained object'),
  ...dl('NVDA + Num Pad Minus', 'NVDA + Backspace', 'Move to the focus object'),
  ...dl('NVDA + Num Pad Enter', 'NVDA + Enter', 'Activate the current navigator object'),
  ...dl('NVDA + Shift + Num Pad Minus', 'NVDA + Shift + Backspace', 'Move focus to the navigator object'),
  ...dl('NVDA + Shift + Num Pad Delete', 'NVDA + Shift + Delete', 'Report the review cursor location'),

  // Reviewing text (Desktop / Laptop)
  ...dl('Shift + Num Pad 7', 'NVDA + Ctrl + Home', 'Move to the top line in review'),
  ...dl('Num Pad 7', 'NVDA + Up Arrow', 'Move to the previous line in review'),
  ...dl('Num Pad 8', 'NVDA + Shift + Period', 'Report the current line in review'),
  ...dl('Num Pad 9', 'NVDA + Down Arrow', 'Move to the next line in review'),
  ...dl('Shift + Num Pad 9', 'NVDA + Ctrl + End', 'Move to the bottom line in review'),
  ...dl('Num Pad 4', 'NVDA + Ctrl + Left Arrow', 'Move to the previous word in review'),
  ...dl('Num Pad 5', 'NVDA + Ctrl + Period', 'Report the current word in review'),
  ...dl('Num Pad 6', 'NVDA + Ctrl + Right Arrow', 'Move to the next word in review'),
  ...dl('Shift + Num Pad 1', 'NVDA + Home', 'Move to the start of the line in review'),
  ...dl('Num Pad 1', 'NVDA + Left Arrow', 'Move to the previous character in review'),
  ...dl('Num Pad 2', 'NVDA + Period', 'Report the current character in review'),
  ...dl('Num Pad 3', 'NVDA + Right Arrow', 'Move to the next character in review'),
  ...dl('Shift + Num Pad 3', 'NVDA + End', 'Move to the end of the line in review'),
  ...dl('NVDA + Page Up', 'NVDA + Shift + Page Up', 'Move to the previous page in review'),
  ...dl('NVDA + Page Down', 'NVDA + Shift + Page Down', 'Move to the next page in review'),
  cmd('NVDA + Alt + Home', 'Move to the start of the selection in review'),
  cmd('NVDA + Alt + End', 'Move to the end of the selection in review'),
  ...dl('Num Pad Plus', 'NVDA + Shift + A', 'Say all with the review cursor'),
  cmd('NVDA + F9', 'Mark the start of a selection from the review cursor'),
  cmd('NVDA + F10', 'Select and copy to the review cursor'),
  cmd('NVDA + Shift + F', 'Report formatting at the review cursor'),

  // Review modes (Desktop / Laptop)
  ...dl('NVDA + Num Pad 7', 'NVDA + Page Up', 'Switch to the next review mode'),
  ...dl('NVDA + Num Pad 1', 'NVDA + Page Down', 'Switch to the previous review mode'),

  // Mouse (Desktop / Laptop)
  ...dl('Num Pad Slash', 'NVDA + Left Bracket', 'Left mouse button click'),
  ...dl('Shift + Num Pad Slash', 'NVDA + Ctrl + Left Bracket', 'Lock or unlock the left mouse button'),
  ...dl('Num Pad Star', 'NVDA + Right Bracket', 'Right mouse button click'),
  ...dl('Shift + Num Pad Star', 'NVDA + Ctrl + Right Bracket', 'Lock or unlock the right mouse button'),
  ...dl('NVDA + Num Pad Slash', 'NVDA + Shift + M', 'Move the mouse to the navigator object'),
  ...dl('NVDA + Num Pad Star', 'NVDA + Shift + N', 'Move the navigator to the object under the mouse'),

  // Browse mode
  cmd('NVDA + Spacebar', 'Toggle between browse mode and focus mode'),
  cmd('NVDA + F5', 'Refresh the browse mode document'),
  cmd('NVDA + Ctrl + F', 'Find text'),
  cmd('NVDA + F3', 'Find next'),
  cmd('NVDA + Shift + F3', 'Find previous'),
  cmd('NVDA + Shift + Spacebar', 'Toggle single-letter navigation'),
  cmd('NVDA + F7', 'Open the elements list'),
  cmd('NVDA + Ctrl + Spacebar', 'Move to the containing browse mode document'),
  cmd('NVDA + Shift + F10', 'Toggle native selection mode'),

  // Single-letter navigation (browse mode)
  browse('H', 'Next heading'),
  browse('1 through 6', 'Next heading at levels 1–6'),
  browse('L', 'Next list'),
  browse('I', 'Next list item'),
  browse('T', 'Next table'),
  browse('K', 'Next link'),
  browse('N', 'Next non-linked text'),
  browse('F', 'Next form field'),
  browse('U', 'Next unvisited link'),
  browse('V', 'Next visited link'),
  browse('E', 'Next edit field'),
  browse('B', 'Next button'),
  browse('X', 'Next check box'),
  browse('C', 'Next combo box'),
  browse('R', 'Next radio button'),
  browse('Q', 'Next block quote'),
  browse('S', 'Next separator'),
  browse('M', 'Next frame'),
  browse('G', 'Next graphic'),
  browse('D', 'Next landmark'),
  browse('O', 'Next embedded object'),
  browse('A', 'Next annotation'),
  browse('P', 'Next paragraph'),
  browse('W', 'Next spelling error'),
  cmd('Comma', 'Move past the end of the container (browse mode)'),
  cmd('Shift + Comma', 'Move to the start of the container (browse mode)'),

  // Math and vision
  cmd('NVDA + Alt + M', 'Interact with math content'),
  cmd('NVDA + Ctrl + Escape', 'Toggle the screen curtain'),
  cmd('NVDA + R', 'Recognize the current object with Windows OCR'),

  // Application-specific (NVDA-provided)
  cmd('NVDA + Shift + C', 'Word/Excel: set column headers'),
  cmd('NVDA + Shift + R', 'Word/Excel: set row headers'),
  cmd('NVDA + Alt + C', 'Word/Excel: report comments or notes'),
  cmd('Ctrl + Shift + S', 'PowerPoint: toggle speaker notes'),
  cmd('Ctrl + Shift + R', 'foobar2000: report remaining time'),
  cmd('Ctrl + Shift + E', 'foobar2000: report elapsed time'),
  cmd('Ctrl + Shift + T', 'foobar2000: report track length'),
  cmd('NVDA + Ctrl + 1 through 4', 'Miranda IM: report a recent message'),
  cmd('Ctrl + Shift + A', 'Poedit: report notes for translators'),
  cmd('Ctrl + Shift + C', 'Poedit: report the comment window'),
  cmd('Ctrl + Shift + O', 'Poedit: report the old source text'),
  cmd('Ctrl + Shift + W', 'Poedit: report the translation warning'),

  // Configuration
  cmd('NVDA + Ctrl + G', 'Open general settings'),
  cmd('NVDA + Ctrl + V', 'Open speech settings'),
  cmd('NVDA + P', 'Cycle the symbol / punctuation level'),
  cmd('NVDA + Ctrl + S', 'Select a synthesizer'),
  ...dl('NVDA + Ctrl + Right Arrow', 'NVDA + Shift + Ctrl + Right Arrow', 'Move to the next synth setting'),
  ...dl('NVDA + Ctrl + Left Arrow', 'NVDA + Shift + Ctrl + Left Arrow', 'Move to the previous synth setting'),
  ...dl('NVDA + Ctrl + Up Arrow', 'NVDA + Shift + Ctrl + Up Arrow', 'Increment the current synth setting'),
  ...dl('NVDA + Ctrl + Down Arrow', 'NVDA + Shift + Ctrl + Down Arrow', 'Decrement the current synth setting'),
  cmd('NVDA + Alt + T', 'Cycle the braille mode'),
  cmd('NVDA + Ctrl + T', 'Cycle where braille is tethered'),
  cmd('NVDA + Ctrl + A', 'Select a braille display'),
  cmd('NVDA + Ctrl + U', 'Open audio settings'),
  cmd('NVDA + Shift + D', 'Cycle the audio ducking mode'),
  cmd('NVDA + Alt + S', 'Cycle the sound split mode'),
  cmd('NVDA + Ctrl + K', 'Open keyboard settings'),
  cmd('NVDA + 2', 'Toggle speaking of typed characters'),
  cmd('NVDA + 3', 'Toggle speaking of typed words'),
  cmd('NVDA + 4', 'Toggle speaking of command keys'),
  cmd('NVDA + Ctrl + M', 'Open mouse settings'),
  cmd('NVDA + M', 'Toggle mouse tracking'),
  cmd('NVDA + 7', 'Toggle whether review follows system focus'),
  cmd('NVDA + 6', 'Toggle whether review follows the system caret'),
  cmd('NVDA + Ctrl + O', 'Open object presentation settings'),
  cmd('NVDA + U', 'Cycle progress bar output'),
  cmd('NVDA + 5', 'Toggle reporting of dynamic content changes'),
  cmd('NVDA + Ctrl + B', 'Open browse mode settings'),
  cmd('NVDA + V', 'Toggle use of screen layout'),
  cmd('NVDA + Ctrl + D', 'Open document formatting settings'),
  cmd('NVDA + D', 'Report the summary of annotation details'),
  cmd('NVDA + Ctrl + C', 'Save the configuration'),
  cmd('NVDA + Ctrl + R', 'Revert the configuration'),
  cmd('NVDA + Ctrl + P', 'Open the configuration profiles dialog'),

  // Remote access and tools
  cmd('NVDA + Alt + R', 'Toggle the remote access connection'),
  cmd('NVDA + Alt + Tab', 'Toggle control of a remote machine'),
  cmd('NVDA + F1', 'Open the log viewer'),
  cmd('NVDA + Ctrl + Shift + F1', 'Copy a fragment of the log'),
  cmd('NVDA + Ctrl + F3', 'Reload plugins'),
  cmd('NVDA + Ctrl + F1', 'Report the loaded app module and executable')
]

// ---------------------------------------------------------------------------
// Narrator
// ---------------------------------------------------------------------------
//
// The "Narrator" token is the Narrator key (Caps Lock or Insert by default,
// configurable). It is left literal, like the "NVDA" key, and rendered as its
// own chip. "Plus"/"Minus" are the physical +/- keys pressed without Shift
// (per the manual's note); numeric-keypad variants use "Num Pad Plus/Minus/5".
const NARRATOR_COMMANDS: ReaderCommand[] = [
  // General
  cmd('Narrator + Escape', 'Exit Narrator'),
  cmd('Narrator + 1', 'Toggle input learning'),
  cmd('Narrator + Right Arrow', 'Move to next item'),
  cmd('Narrator + Left Arrow', 'Move to previous item'),
  cmd('Narrator + Page Up', 'Change view'),
  cmd('Ctrl + Narrator + Up Arrow', 'Change view'),
  cmd('Narrator + Page Down', 'Change view'),
  cmd('Ctrl + Narrator + Down Arrow', 'Change view'),
  cmd('Narrator + F1', 'Show commands list'),
  cmd('Narrator + F2', 'Show commands for current item'),
  cmd('Narrator + Enter', 'Do primary action'),
  cmd('Narrator + Ctrl + Enter', 'Toggle search mode'),
  cmd('Narrator + Backslash', 'Read the status bar in apps such as Word, Excel, and PowerPoint'),
  cmd('Narrator + F12', 'Read current time and date'),
  cmd('Narrator + Shift + B', 'Read Battery and Network status'),
  cmd('Narrator + Alt + B', 'Toggle braille viewer'),
  cmd('Narrator + Ctrl + C', 'Toggle Screen curtain'),
  cmd('Narrator + Ctrl + D', 'Describe image using an online service or get the webpage source of a link'),
  cmd('Narrator + S', 'Get a webpage summary'),
  cmd('Narrator + S twice quickly', 'Get webpage summary and popular links dialog box'),
  cmd('Narrator + Shift + S', 'Speech off'),
  cmd('Narrator + Alt + F', 'Provide Narrator feedback'),
  cmd('Narrator + Z', 'Lock Narrator key'),
  cmd('Narrator + Ctrl + F12', 'Toggle developer mode'),
  cmd('Narrator + 3', 'Pass keys to application'),
  cmd('Narrator + 4', 'Change capitalization reading mode'),
  cmd('Narrator + Alt + M', 'Toggle mouse mode'),
  cmd('Narrator + H', 'Turn on or off Outlook column header reading'),

  // Adjust speech
  cmd('Ctrl + Narrator + Plus', 'Increase voice volume'),
  cmd('Ctrl + Narrator + Num Pad Plus', 'Increase voice volume'),
  cmd('Ctrl + Narrator + Minus', 'Decrease voice volume'),
  cmd('Ctrl + Narrator + Num Pad Minus', 'Decrease voice volume'),
  cmd('Narrator + Plus', 'Increase voice speed'),
  cmd('Narrator + Minus', 'Decrease voice speed'),
  cmd('Narrator + Alt + Plus', 'Move to the next voice'),
  cmd('Narrator + Alt + Num Pad Plus', 'Move to the next voice'),
  cmd('Narrator + Alt + Minus', 'Move to the previous voice'),
  cmd('Narrator + Alt + Num Pad Minus', 'Move to the previous voice'),
  cmd('Narrator + Alt + Left Bracket', 'Change to the prior punctuation reading mode'),
  cmd('Narrator + Alt + Right Bracket', 'Change to the next punctuation reading mode'),
  cmd('Narrator + V', 'Increase verbosity mode'),
  cmd('Narrator + Shift + V', 'Decrease verbosity mode'),
  cmd('Narrator + 2', 'Toggle character reading'),
  cmd('Narrator + Slash', 'Read context'),
  cmd('Narrator + Alt + Slash', 'Set read context verbosity'),
  cmd('Narrator + Ctrl + Slash', 'Change read context order'),

  // Read and work with text
  cmd('Narrator + Tab', 'Read item'),
  cmd('Narrator + Num Pad 5', 'Read item'),
  cmd('Narrator + Tab twice quickly', 'Read item spelled out'),
  cmd('Narrator + Num Pad 5 twice quickly', 'Read item spelled out'),
  cmd('Narrator + K twice quickly', 'Read item spelled out'),
  cmd('Narrator + Ctrl + Num Pad 5 twice quickly', 'Read item spelled out'),
  cmd('Narrator + 0', 'Read item advanced'),
  cmd('Narrator + T', 'Read window title'),
  cmd('Narrator + W', 'Read window'),
  cmd('Narrator + X', 'Re-hear what Narrator spoke last'),
  cmd('Narrator + Ctrl + X', 'Copy last spoken phrase to clipboard'),
  cmd('Narrator + Alt + X', 'Open speech recap window for history and live transcription'),
  cmd('Narrator + R', 'Read from cursor'),
  cmd('Ctrl + Narrator + R', 'Start reading document'),
  cmd('Narrator + Down Arrow', 'Start reading document'),
  cmd('Narrator + C', 'Read document'),
  cmd('Narrator + Shift + J', 'Read text from start to cursor'),
  cmd('Narrator + Alt + Home', 'Read text from start to cursor'),
  cmd('Ctrl + Narrator + U', 'Read previous page'),
  cmd('Ctrl + Narrator + I', 'Read current page'),
  cmd('Ctrl + Narrator + O', 'Read next page'),
  cmd('Ctrl + Narrator + J', 'Read previous paragraph'),
  cmd('Ctrl + Narrator + K', 'Read current paragraph'),
  cmd('Ctrl + Narrator + L', 'Read next paragraph'),
  cmd('Narrator + Ctrl + M', 'Read previous sentence'),
  cmd('Narrator + Ctrl + Comma', 'Read current sentence'),
  cmd('Narrator + Ctrl + Period', 'Read next sentence'),
  cmd('Narrator + U', 'Read previous line'),
  cmd('Narrator + I', 'Read current line'),
  cmd('Narrator + Up Arrow', 'Read current line'),
  cmd('Narrator + O', 'Read next line'),
  cmd('Narrator + J', 'Read previous word'),
  cmd('Ctrl + Narrator + Left Arrow', 'Read previous word'),
  cmd('Narrator + K', 'Read current word'),
  cmd('Ctrl + Narrator + Num Pad 5', 'Read current word'),
  cmd('Narrator + L', 'Read next word'),
  cmd('Ctrl + Narrator + Right Arrow', 'Read next word'),
  cmd('Narrator + M', 'Read previous character'),
  cmd('Narrator + Comma', 'Read current character'),
  cmd('Num Pad 5', 'Read current character'),
  cmd('Narrator + Period', 'Read next character'),
  cmd('Narrator + F', 'Read next group of formatting information'),
  cmd('Narrator + Shift + F', 'Read previous group of formatting information'),
  cmd('Narrator + B', 'Move to beginning of text'),
  cmd('Ctrl + Narrator + Home', 'Move to beginning of text'),
  cmd('Narrator + E', 'Move to end of text'),
  cmd('Ctrl + Narrator + End', 'Move to end of text'),
  cmd('Narrator + Shift + Down Arrow', 'Read selection'),
  cmd('Narrator + Shift + Down Arrow twice quickly', 'Spell selection'),

  // Navigate tables
  cmd('Ctrl + Alt + Home', 'Jump to first cell in table'),
  cmd('Ctrl + Alt + End', 'Jump to last cell in table'),
  cmd('Ctrl + Alt + Right Arrow', 'Jump to next cell in row'),
  cmd('Ctrl + Alt + Left Arrow', 'Jump to previous cell in row'),
  cmd('Ctrl + Alt + Down Arrow', 'Jump to next cell in column'),
  cmd('Ctrl + Alt + Up Arrow', 'Jump to previous cell in column'),
  cmd('Ctrl + Shift + Alt + Left Arrow', 'Read current row header'),
  cmd('Ctrl + Shift + Alt + Up Arrow', 'Read current column header'),
  cmd('Ctrl + Shift + Alt + Right Arrow', 'Read current row'),
  cmd('Ctrl + Shift + Alt + Down Arrow', 'Read current column'),
  cmd('Ctrl + Shift + Alt + Slash', 'Read which row and column Narrator is in'),
  cmd('Ctrl + Shift + Alt + Num Pad 5', 'Read which row and column Narrator is in'),
  cmd('Ctrl + Alt + Page Up', 'Jump to table cell'),
  cmd('Ctrl + Alt + Page Down', 'Jump to cell contents'),

  // Narrator focus commands
  cmd('Narrator + Home', 'Move to first item in window'),
  cmd('Narrator + End', 'Move to last item in window'),
  cmd('Narrator + Backspace', 'Go back one item'),
  cmd('Narrator + N', 'Move to main landmark'),
  cmd('Narrator + Left Bracket', 'Move Narrator cursor to system cursor'),
  cmd('Narrator + Num Pad Minus', 'Move Narrator cursor to system cursor'),
  cmd('Narrator + Apostrophe', 'Set focus to item'),
  cmd('Narrator + Num Pad Plus', 'Set focus to item'),
  cmd('Narrator + A', 'Jump to linked item'),
  cmd('Narrator + Shift + A', 'Jump to annotated content'),
  cmd('Narrator + Alt + Up Arrow', 'Navigate to parent (when structural navigation is provided)'),
  cmd('Narrator + Alt + Right Arrow', 'Navigate to next sibling (when structural navigation is provided)'),
  cmd('Narrator + Alt + Left Arrow', 'Navigate to previous sibling (when structural navigation is provided)'),
  cmd('Narrator + Alt + Down Arrow', 'Navigate to first child (when structural navigation is provided)'),
  cmd('Narrator + F7', 'List of links'),
  cmd('Narrator + F5', 'List of landmarks'),
  cmd('Narrator + F6', 'List of headings'),
  cmd('Narrator + Ctrl + F', 'Narrator Find'),
  cmd('Narrator + F3', 'Continue Find forward'),
  cmd('Narrator + Shift + F3', 'Continue Find backward')
]

// ---------------------------------------------------------------------------
// VoiceOver (macOS)
// ---------------------------------------------------------------------------
// "VO" is the VoiceOver modifier (Control + Option, or Caps Lock). Each keystroke
// is stored in readable text form (Command, Space, arrows as "Left Arrow", ...);
// the renderer symbolizes it to the macOS glyph face (⌘, ␣, ←, ...) for display.
// Repeated tokens (e.g. "VO + M + M") are multi-press sequences. Where two
// commands share a keystroke, the aggregator keeps the first by dedupe id.
const VOICEOVER_COMMANDS: ReaderCommand[] = [
  cmd('VO + Command + Space', 'Actions'),
  cmd('VO + Function + (', 'Adjust Braille Window'),
  cmd('VO + Function + )', 'Adjust Caption Window'),
  cmd('VO + Function + 11', 'Application Chooser'),
  cmd('VO + Command + ,', 'Audio Graph Scrub Left'),
  cmd('VO + Command + .', 'Audio Graph Scrub Right'),
  cmd('VO + Function + @', 'Bring Window to Front'),
  cmd('VO + Caps Lock + Space', 'Click Mouse'),
  cmd('VO + Command + Escape', 'Close Window'),
  cmd('VO + Shift + C', 'Copy Last Phrase to Clipboard'),
  cmd('VO + -', 'Decrease System Volume'),
  cmd('VO + Command + 0', 'Describe Item at Hot Spot 0'),
  cmd('VO + Command + 1', 'Describe Item at Hot Spot 1'),
  cmd('VO + Command + 2', 'Describe Item at Hot Spot 2'),
  cmd('VO + Command + 3', 'Describe Item at Hot Spot 3'),
  cmd('VO + Command + 4', 'Describe Item at Hot Spot 4'),
  cmd('VO + Command + 5', 'Describe Item at Hot Spot 5'),
  cmd('VO + Command + 6', 'Describe Item at Hot Spot 6'),
  cmd('VO + Command + 7', 'Describe Item at Hot Spot 7'),
  cmd('VO + Command + 8', 'Describe Item at Hot Spot 8'),
  cmd('VO + Command + 9', 'Describe Item at Hot Spot 9'),
  cmd('VO + Function + 5', 'Describe Item in Mouse Pointer'),
  cmd('VO + Function + 3', 'Describe Item in VoiceOver Cursor'),
  cmd('VO + Function + 4', 'Describe Item with Keyboard Focus'),
  cmd('VO + Function + 5 + 5', 'Describe Mouse Pointer Location (from Top-Left of Screen)'),
  cmd('VO + Function + 5 + 5 + 5', 'Describe Mouse Pointer Location (from Top-Left of Window)'),
  cmd('VO + Function + 1', 'Describe Open Applications'),
  cmd('VO + Command + Function + 3 + 3', 'Describe Position of Item in VoiceOver Cursor'),
  cmd('VO + Command + Function + 2 + 2', 'Describe Position of Window'),
  cmd('VO + Command + Function + 3', 'Describe Size of Item in VoiceOver Cursor'),
  cmd('VO + Command + Function + 2', 'Describe Size of Window'),
  cmd('VO + Function + 2', 'Describe Window'),
  cmd('VO + Shift + Space + Space', 'Double Click Mouse'),
  cmd('VO + >', 'Drop Marked Item after VoiceOver Cursor'),
  cmd('VO + <', 'Drop Marked Item before VoiceOver Cursor'),
  cmd('VO + .', 'Drop Marked Item on VoiceOver Cursor'),
  cmd('VO + Escape', 'Escape'),
  cmd('VO + F', 'Find'),
  cmd('VO + Command + Q', 'Find Next Block Quote'),
  cmd('VO + Command + W', 'Find Next Block Quote Same Level'),
  cmd('VO + Command + B', 'Find Next Bold Text'),
  cmd('VO + Command + K', 'Find Next Color Change'),
  cmd('VO + Command + Y', 'Find Next Color Column'),
  cmd('VO + Command + J', 'Find Next Color Control'),
  cmd('VO + Command + Y', 'Find Next Column'),
  cmd('VO + Command + D', 'Find Next Different Item'),
  cmd('VO + Command + O', 'Find Next Font Change'),
  cmd('VO + Command + F', 'Find Next Frame'),
  cmd('VO + Command + H', 'Find Next Heading'),
  cmd('VO + Command + M', 'Find Next Heading Same Level'),
  cmd('VO + Command + G', 'Find Next Image'),
  cmd('VO + Command + I', 'Find Next Italic Text'),
  cmd('VO + Command + S', 'Find Next Item or Text with Same Attributes'),
  cmd('VO + Command + N', 'Find Next Landmark'),
  cmd('VO + Command + L', 'Find Next Link'),
  cmd('VO + Command + X', 'Find Next List'),
  cmd('VO + Command + E', 'Find Next Misspelled Word'),
  cmd('VO + Command + P', 'Find Next Plain Text'),
  cmd('VO + G', 'Find Next Searched Text'),
  cmd('VO + Down Arrow', 'Find Next Searched Text in History'),
  cmd('VO + Command + T', 'Find Next Table'),
  cmd('VO + Command + C', 'Find Next Text with Different Attributes'),
  cmd('VO + Command + U', 'Find Next Underlined Text'),
  cmd('VO + Command + V', 'Find Next Visited Link'),
  cmd('VO + Command + Shift + Q', 'Find Previous Block Quote'),
  cmd('VO + Command + Shift + W', 'Find Previous Block Quote Same Level'),
  cmd('VO + Command + Shift + B', 'Find Previous Bold Text'),
  cmd('VO + Command + Shift + K', 'Find Previous Color Change'),
  cmd('VO + Command + Shift + Y', 'Find Previous Column'),
  cmd('VO + Command + Shift + J', 'Find Previous Control'),
  cmd('VO + Command + Shift + D', 'Find Previous Different Item'),
  cmd('VO + Command + Shift + O', 'Find Previous Font Change'),
  cmd('VO + Command + Shift + F', 'Find Previous Frame'),
  cmd('VO + Command + Shift + H', 'Find Previous Heading'),
  cmd('VO + Command + Shift + M', 'Find Previous Heading Same Level'),
  cmd('VO + Command + Shift + G', 'Find Previous Image'),
  cmd('VO + Command + Shift + I', 'Find Previous Italic Text'),
  cmd('VO + Command + Shift + S', 'Find Previous Item or Text with Same Attributes'),
  cmd('VO + Command + Shift + N', 'Find Previous Landmark'),
  cmd('VO + Command + Shift + L', 'Find Previous Link'),
  cmd('VO + Command + Shift + X', 'Find Previous List'),
  cmd('VO + Command + Shift + E', 'Find Previous Misspelled Word'),
  cmd('VO + Command + Shift + P', 'Find Previous Plain Text'),
  cmd('VO + Shift + G', 'Find Previous Searched Text'),
  cmd('VO + Up Arrow + F', 'Find Previous Searched Text in History'),
  cmd('VO + Command + Shift + T', 'Find Previous Table'),
  cmd('VO + Command + Shift + C', 'Find Previous Text with Different Attributes'),
  cmd('VO + Command + Shift + U', 'Find Previous Underlined Text'),
  cmd('VO + Command + Shift + V', 'Find Previous Visited Link'),
  cmd('VO + Return', 'Find Text Entered in Search Field'),
  cmd('VO + Page Down', 'Go Down One Page'),
  cmd('VO + Shift + Left Arrow', 'Go Left a Bit'),
  cmd('VO + Shift + Page Up', 'Go Left One Page'),
  cmd('VO + Shift + Right Arrow', 'Go Right a Bit'),
  cmd('VO + Shift + Page Down', 'Go Right One Page'),
  cmd('VO + Home', 'Go to Beginning'),
  cmd('VO + Command + End', 'Go to Bottom of Window'),
  cmd('VO + Shift + D', 'Go to Desktop'),
  cmd('VO + D', 'Go to Dock'),
  cmd('VO + End', 'Go to End'),
  cmd('VO + J', 'Go to Linked Item'),
  cmd('VO + M', 'Go to Menu Bar'),
  cmd('VO + Command + ]', 'Go to Next Custom Window Spot'),
  cmd('VO + ]', 'Go to Next Window Spot'),
  cmd('VO + Shift + J', 'Go to Popup Item'),
  cmd('VO + Command + [', 'Go to Previous Custom Window Spot'),
  cmd('VO + [', 'Go to Previous Window Spot'),
  cmd('VO + M + M', 'Go to Status Menus'),
  cmd('VO + Command + Home', 'Go to Top of Window'),
  cmd('VO + Shift + Home', 'Go to Visible Beginning'),
  cmd('VO + Shift + End', 'Go to Visible End'),
  cmd('VO + Page Up', 'Go Up One Page'),
  cmd('VO + Tab', 'Ignore Next Keypress'),
  cmd('VO + =', 'Increase System volume'),
  cmd('VO + Caps Lock + S', 'Interact with Scroll Bar'),
  cmd('VO + Vertical Bar', 'Item Chooser'),
  cmd('VO + Vertical Bar', 'Jump to Header'),
  cmd('VO + 0', 'Jump to Item at Hot Spot 0'),
  cmd('VO + 1', 'Jump to Item at Hot Spot 1'),
  cmd('VO + 2', 'Jump to Item at Hot Spot 2'),
  cmd('VO + 3', 'Jump to Item at Hot Spot 3'),
  cmd('VO + 4', 'Jump to Item at Hot Spot 4'),
  cmd('VO + 5', 'Jump to Item at Hot Spot 5'),
  cmd('VO + 6', 'Jump to Item at Hot Spot 6'),
  cmd('VO + 7', 'Jump to Item at Hot Spot 7'),
  cmd('VO + 8', 'Jump to Item at Hot Spot 8'),
  cmd('VO + 9', 'Jump to Item at Hot Spot 9'),
  cmd('VO + Caps Lock + Escape', 'Jump to Top Level'),
  cmd('VO + K', 'Keyboard Help'),
  cmd('VO + /', 'Label Item'),
  cmd('VO + ,', 'Mark Item to Drag and Drop'),
  cmd('VO + Command + )', 'Monitor Item at Hot Spot 0'),
  cmd('VO + Command + !', 'Monitor Item at Hot Spot 1'),
  cmd('VO + Command + @', 'Monitor Item at Hot Spot 2'),
  cmd('VO + Command + #', 'Monitor Item at Hot Spot 3'),
  cmd('VO + Command + $', 'Monitor Item at Hot Spot 4'),
  cmd('VO + Command + %', 'Monitor Item at Hot Spot 5'),
  cmd('VO + Command + ^', 'Monitor Item at Hot Spot 6'),
  cmd('VO + Command + &', 'Monitor Item at Hot Spot 7'),
  cmd('VO + Command + *', 'Monitor Item at Hot Spot 8'),
  cmd('VO + Command + (', 'Monitor Item at Hot Spot 9'),
  cmd('VO + Command + /', 'More Content'),
  cmd('VO + Command + Shift + Space', 'Mouse Down'),
  cmd('VO + Command + Shift + Space', 'Mouse Up'),
  cmd('VO + Shift + Down Arrow', 'Move Down a Bit'),
  cmd('VO + Command + Down Arrow', 'Move Down in Rotor'),
  cmd('VO + 8', 'Move Item to Bottom Center Section'),
  cmd('VO + 7', 'Move Item to Bottom Left Section'),
  cmd('VO + 9', 'Move Item to Bottom Right Section'),
  cmd('VO + 5', 'Move Item to Middle Center Section'),
  cmd('VO + 4', 'Move Item to Middle Left Section'),
  cmd('VO + 6', 'Move Item to Middle Right Section'),
  cmd('VO + 2', 'Move Item to Top Center Section'),
  cmd('VO + 1', 'Move Item to Top Left Section'),
  cmd('VO + 3', 'Move Item to Top Right Section'),
  cmd('VO + Command + Function + 5', 'Move Keyboard Focus to VoiceOver Cursor'),
  cmd('VO + Left Arrow', 'Move Left'),
  cmd('VO + Command + Function + 4', 'Move Mouse Pointer to VoiceOver Cursor'),
  cmd('VO + }', 'Move to Next Hot Spot'),
  cmd('VO + Command + \\', 'Move to Parent Row'),
  cmd('VO + {', 'Move to Previous Hot Spot'),
  cmd('VO + Up Arrow', 'Move Up'),
  cmd('VO + Command + Up Arrow', 'Move Up in Rotor'),
  cmd('VO + Function + $', 'Move VoiceOver Cursor to Keyboard Focus'),
  cmd('VO + Function + %', 'Move VoiceOver Cursor to Mouse Pointer'),
  cmd('VO + X', 'Open Activity Chooser'),
  cmd('VO + H + H', 'Open Commands Menu'),
  cmd('VO + Shift + O', 'Open Control Center'),
  cmd('VO + Shift + F', 'Open Find Commands Menu'),
  cmd('VO + Shift + X', 'Open Hot Spots Chooser'),
  cmd('VO + Command + Shift + Right Arrow', 'Open Next Speech Attribute Guide'),
  cmd('VO + O', 'Open Notification Center'),
  cmd('VO + Command + Shift + Left Arrow', 'Open Previous Speech Attribute Guide'),
  cmd('VO + Command + Function + 8', 'Open Quick Start Tutorial'),
  cmd('VO + Shift + M', 'Open Shortcut Menu'),
  cmd('VO + N + N', 'Open the Announcement History Menu'),
  cmd('VO + N', 'Open the Notifications Menu'),
  cmd('VO + V', 'Open Verbosity Rotor'),
  cmd('VO + H', 'Open VoiceOver Help Menu'),
  cmd('VO + Function + 8', 'Open VoiceOver Utility'),
  cmd('VO + Space', 'Perform Action for Item'),
  cmd('VO + X + X', 'Previous Activity'),
  cmd('VO + C + C', 'Read Column Description from Current Cell'),
  cmd('VO + A', 'Read Contents of VoiceOver Cursor'),
  cmd('VO + Shift + W', 'Read Contents of Window'),
  cmd('VO + C', 'Read Current Character'),
  cmd('VO + C + C', 'Read Current Character Phonetically'),
  cmd('VO + W + W', 'Read Current Item Alphabetically'),
  cmd('VO + W + W + W', 'Read Current Item Phonetically'),
  cmd('VO + L', 'Read Current Line'),
  cmd('VO + P', 'Read Current Paragraph'),
  cmd('VO + S', 'Read Current Sentence'),
  cmd('VO + W', 'Read Current Word'),
  cmd('VO + W + W', 'Read Current Word Alphabetically'),
  cmd('VO + W + W + W', 'Read Current Word Phonetically'),
  cmd('VO + B', 'Read from Beginning to VoiceOver Cursor'),
  cmd('VO + C', 'Read Header Description'),
  cmd('VO + Shift + H', 'Read Help Tag for Item'),
  cmd('VO + Shift + L', 'Read Image Description for Item'),
  cmd('VO + Shift + Right Arrow', 'Read Next Character'),
  cmd('VO + Down Arrow', 'Read Next Line'),
  cmd('VO + Shift + Page Down', 'Read Next Paragraph'),
  cmd('VO + Command + Page Down', 'Read Next Sentence'),
  cmd('VO + Right Arrow', 'Read Next Word'),
  cmd('VO + Shift + Left Arrow', 'Read Previous Character'),
  cmd('VO + Up Arrow', 'Read Previous Line'),
  cmd('VO + Shift + Page Up', 'Read Previous Paragraph'),
  cmd('VO + Command + Page Up', 'Read Previous Sentence'),
  cmd('VO + Left Arrow', 'Read Previous Word'),
  cmd('VO + Shift + T', 'Read Row and Column Numbers'),
  cmd('VO + R + R', 'Read Row Description from Current Cell'),
  cmd('VO + R', 'Read Row Header Description'),
  cmd('VO + Function + 6', 'Read Selected Text or Item'),
  cmd('VO + Shift + T + T', 'Read Table Dimensions'),
  cmd('VO + T', 'Read Text Attributes'),
  cmd('VO + W', 'Read Visible Text'),
  cmd('VO + Shift + N', 'Read VoiceOver Hint'),
  cmd('VO + Command + {', 'Remove from Window Spots'),
  cmd('VO + Z', 'Repeat Last Phrase'),
  cmd('VO + Command + Left Arrow', 'Rotate Left'),
  cmd('VO + Command + Right Arrow', 'Rotate Right'),
  cmd('VO + U', 'Rotor'),
  cmd('VO + Shift + Z', 'Save Last Phrase to Desktop as Audio File'),
  cmd('VO + )', 'Save or Remove Item at Hot Spot 0'),
  cmd('VO + !', 'Save or Remove Item at Hot Spot 1'),
  cmd('VO + @', 'Save or Remove Item at Hot Spot 2'),
  cmd('VO + #', 'Save or Remove Item at Hot Spot 3'),
  cmd('VO + $', 'Save or Remove Item at Hot Spot 4'),
  cmd('VO + %', 'Save or Remove Item at Hot Spot 5'),
  cmd('VO + ^', 'Save or Remove Item at Hot Spot 6'),
  cmd('VO + &', 'Save or Remove Item at Hot Spot 7'),
  cmd('VO + *', 'Save or Remove Item at Hot Spot 8'),
  cmd('VO + (', 'Save or Remove Item at Hot Spot 9'),
  cmd('VO + Return', 'Select Item'),
  cmd('VO + Command + Shift + Down Arrow', 'Select Next Option Down in Speech Attribute Guide'),
  cmd('VO + Command + Shift + Up Arrow', 'Select Next Option Up in Speech Attribute Guide'),
  cmd('VO + Shift + A', 'Select Text in VoiceOver Cursor'),
  cmd('VO + Command + }', 'Set as a Window Spot'),
  cmd('VO + Command + Function + 9', 'Show or Hide the Braille Window'),
  cmd('VO + Command + Function + 0', 'Show or Hide the Caption Window'),
  cmd('VO + Command + Function + -', 'Show or Hide VoiceOver Visuals'),
  cmd('VO + Function + 7', 'Speak the Time and Date'),
  cmd('VO + Function + 7 + 7 + 7', 'Speak Wifi Status'),
  cmd('VO + Shift + Down Arrow', 'Start Interacting with Item'),
  cmd('VO + Command + `', 'Start Moving Item'),
  cmd('VO + `', 'Start Moving Window'),
  cmd('VO + Command + ~', 'Start Resizing Item'),
  cmd('VO + ~', 'Start Resizing Window'),
  cmd('VO + Shift + Up Arrow', 'Stop Interacting with Item'),
  cmd('VO + Function + 0', 'Tile Visuals'),
  cmd('VO + Shift + Q', 'Toggle Arrow-Key Quick Nav On or Off'),
  cmd('VO + Y', 'Toggle Braille Keyboard Input On or Off'),
  cmd('VO + Function + #', 'Toggle Cursor Tracking On or Off'),
  cmd('VO + \\', 'Toggle Disclosure Triangle Open or Closed'),
  cmd('VO + Shift + Y', 'Toggle Keyboard Braille Access'),
  cmd('VO + Command + Return', 'Toggle Multiple Selection On or Off'),
  cmd('VO + Clear', 'Toggle NumPad Key Commands On or Off'),
  cmd('VO + Shift + K', 'Toggle Option Key Commands On or Off'),
  cmd('VO + Function + _', 'Toggle Screen Curtain On or Off'),
  cmd('VO + Q', 'Toggle Single-Key Quick Nav On or Off'),
  cmd('VO + Command + =', 'Toggle Table Interactability'),
  cmd('VO + ;', 'Toggle the VO Modifier Lock On or Off'),
  cmd('VO + ?', 'User Guide'),
  cmd('VO + Function + 2 + 2', 'Window Chooser')
]

/** Builds the raw shortcuts for one reader. */
function readerRaws(appId: string, appName: string, commands: ReaderCommand[]): RawShortcut[] {
  return commands.map((c) => ({
    key: '',
    modifiers: [],
    origin: 'app',
    segment: 'screen-reader',
    source: 'curated',
    appId,
    appName,
    description: c.description,
    enabled: true,
    keystroke: c.keystroke
  }))
}

/**
 * Returns the full JAWS, NVDA, Narrator, and VoiceOver command sets as raw
 * shortcuts. Emitted unconditionally on every scan and every platform; the
 * aggregator dedupes by id so a running reader is not shown twice.
 */
export function getScreenReaderShortcuts(): RawShortcut[] {
  return [
    ...readerRaws(JAWS_APP_ID, 'JAWS', JAWS_COMMANDS),
    ...readerRaws(NVDA_APP_ID, 'NVDA', NVDA_COMMANDS),
    ...readerRaws(NARRATOR_APP_ID, 'Narrator', NARRATOR_COMMANDS),
    ...readerRaws(VOICEOVER_APP_ID, 'VoiceOver', VOICEOVER_COMMANDS)
  ]
}

const SCREEN_READER_IDENTIFIERS = ['jfw', 'jaws', 'nvda', 'nvda_service', 'narrator', 'voiceover']

/**
 * Whether a running app is a screen reader. Used to skip its menu bar during the
 * app scan, so a running JAWS/NVDA cannot create a second reader disclosure that
 * competes with the always-injected curated set.
 */
export function isScreenReaderApp(app: RunningApp): boolean {
  const id = app.id.toLowerCase()
  const name = app.name.toLowerCase()
  return SCREEN_READER_IDENTIFIERS.some(
    (token) => id === token || id.includes(token) || name.includes(token)
  )
}
