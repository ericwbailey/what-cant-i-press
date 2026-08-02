// AUTO-GENERATED bundle of web/demo.js + filters + data. Do not edit; run npm run web:build.
"use strict";
(() => {
  // web/filters/text-filter.js
  var TEXT_ALIAS_GROUPS = [
    ["fn", "function"],
    ["ctrl", "control", "\u2303"],
    ["alt", "opt", "option", "\u2325"],
    ["shift", "\u21E7"],
    ["cmd", "command", "\u2318"],
    ["caps", "caps lock"],
    ["win", "windows"],
    ["return", "enter", "\u21A9", "\u2305"],
    ["esc", "escape", "\u238B"],
    ["tab", "\u21E5"],
    ["space", "spacebar"],
    ["delete", "backspace", "\u232B"],
    ["del", "forward delete", "\u2326"],
    ["up", "\u2191"],
    ["down", "dwn", "\u2193"],
    ["left", "lft", "\u2190"],
    ["right", "rght", "\u2192"],
    ["home", "\u2196"],
    ["end", "\u2198"],
    ["page up", "pg up", "pgup", "\u21DE"],
    ["page down", "pg dn", "pg down", "pgdn", "\u21DF"],
    ["clear", "\u2327"],
    ["settings", "preferences", "prefs"]
  ];
  var READER_KEY_ALIASES = [
    { triggers: ["insert"], comboTerms: ["nvda", "na + ", "om + "] },
    { triggers: ["caps lock", "caps"], comboTerms: ["vo", "na + ", "om + "] }
  ];
  function normalizeSeparators(s) {
    return s.replace(/, then /g, " ").replace(/ \+ /g, " ").replace(/(?<=\w)\+(?=\w)/g, " ").replace(/\s+/g, " ").trim();
  }
  var READER_NAME_ALIASES = [{ triggers: ["na"], appName: "Narrator" }];
  function queryClauses(query) {
    const key = normalizeSeparators(query);
    for (const alias of READER_NAME_ALIASES) {
      if (alias.triggers.includes(key)) return [{ kind: "app", appName: alias.appName.toLowerCase() }];
    }
    const clauses = [{ kind: "text", term: key }];
    for (const group of TEXT_ALIAS_GROUPS) {
      if (group.includes(key)) {
        for (const term of group) if (term !== key) clauses.push({ kind: "text", term });
      }
    }
    for (const alias of READER_KEY_ALIASES) {
      if (alias.triggers.includes(key)) {
        for (const term of alias.comboTerms) clauses.push({ kind: "combo", term });
      }
    }
    return clauses;
  }
  var searchTextCache = /* @__PURE__ */ new WeakMap();
  function searchTextFor(shortcut) {
    var _a, _b;
    const cached = searchTextCache.get(shortcut);
    if (cached) return cached;
    const combo = shortcut.comboLabel.toLowerCase();
    const appName = ((_a = shortcut.appName) != null ? _a : "").toLowerCase();
    const hay = normalizeSeparators(
      `${combo} ${appName} ${((_b = shortcut.description) != null ? _b : "").toLowerCase()}`
    );
    const text = { combo, appName, hay };
    searchTextCache.set(shortcut, text);
    return text;
  }
  function matchesQuery(shortcut, clauses) {
    const { combo, appName, hay } = searchTextFor(shortcut);
    for (const clause of clauses) {
      const hit = clause.kind === "combo" ? combo.includes(clause.term) : clause.kind === "app" ? appName === clause.appName : hay.includes(clause.term);
      if (hit) return true;
    }
    return false;
  }
  function filterShortcutsByText(shortcuts, rawQuery) {
    const query = rawQuery.trim().toLowerCase();
    const clauses = queryClauses(query);
    return shortcuts.filter((shortcut) => matchesQuery(shortcut, clauses));
  }

  // web/filters/chord-filter.js
  var MODIFIERS = ["function", "control", "option", "shift", "command", "super"];
  var MODIFIER_ORDER = new Map(MODIFIERS.map((m, i) => [m, i]));
  function canonicalizeModifiers(modifiers) {
    const seen = /* @__PURE__ */ new Set();
    for (const m of modifiers) {
      if (MODIFIER_ORDER.has(m)) seen.add(m);
    }
    return [...seen].sort((a, b) => {
      var _a, _b;
      return ((_a = MODIFIER_ORDER.get(a)) != null ? _a : 0) - ((_b = MODIFIER_ORDER.get(b)) != null ? _b : 0);
    });
  }
  function normalizeKeyToken(raw) {
    if (!raw) return "";
    if (raw === " ") return "Space";
    if (raw.length === 1) return raw.toUpperCase();
    return raw;
  }
  var CODE_TO_TOKEN = {
    Enter: "Return",
    NumpadEnter: "Enter",
    Tab: "Tab",
    Space: "Space",
    Escape: "Escape",
    Backspace: "Delete",
    Delete: "ForwardDelete",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    ArrowUp: "Up",
    ArrowDown: "Down",
    Home: "Home",
    End: "End",
    PageUp: "PageUp",
    PageDown: "PageDown",
    Minus: "-",
    Equal: "=",
    BracketLeft: "[",
    BracketRight: "]",
    Backslash: "\\",
    Semicolon: ";",
    Quote: "'",
    Comma: ",",
    Period: ".",
    Slash: "/",
    Backquote: "`",
    NumpadDivide: "/",
    NumpadMultiply: "*",
    NumpadSubtract: "-",
    NumpadAdd: "+",
    NumpadDecimal: "."
  };
  var MODIFIER_CODES = /* @__PURE__ */ new Set([
    "MetaLeft",
    "MetaRight",
    "ControlLeft",
    "ControlRight",
    "AltLeft",
    "AltRight",
    "ShiftLeft",
    "ShiftRight",
    "CapsLock",
    "Fn",
    "FnLock"
  ]);
  function tokenFromCode(event) {
    const code = event.code;
    if (MODIFIER_CODES.has(code)) return "";
    const mapped = CODE_TO_TOKEN[code];
    if (mapped) return mapped;
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return code.slice(6);
    if (/^F[0-9]{1,2}$/.test(code)) return code;
    return normalizeKeyToken(event.key);
  }
  function modifiersFromEvent(event, fnHeld2 = false) {
    const mods = [];
    if (event.metaKey) mods.push("command");
    if (event.ctrlKey) mods.push("control");
    if (event.altKey) mods.push("option");
    if (event.shiftKey) mods.push("shift");
    const fnState = typeof event.getModifierState === "function" && event.getModifierState("Fn");
    if (fnHeld2 || fnState) mods.push("function");
    return canonicalizeModifiers(mods);
  }
  var LABEL_MODIFIERS = {
    command: "command",
    cmd: "command",
    "\u2318": "command",
    windows: "super",
    win: "super",
    super: "super",
    control: "control",
    ctrl: "control",
    "\u2303": "control",
    option: "option",
    opt: "option",
    alt: "option",
    "\u2325": "option",
    shift: "shift",
    "\u21E7": "shift",
    function: "function",
    fn: "function"
  };
  var LABEL_KEY_ALIASES = {
    spacebar: "Space",
    space: "Space",
    apostrophe: "'",
    quote: "'",
    dash: "-",
    minus: "-",
    hyphen: "-",
    equals: "=",
    equal: "=",
    plus: "+",
    slash: "/",
    backslash: "\\",
    semicolon: ";",
    comma: ",",
    period: ".",
    grave: "`",
    backtick: "`"
  };
  function labelToken(piece) {
    var _a, _b;
    const lower = piece.toLowerCase();
    return (_b = (_a = LABEL_MODIFIERS[lower]) != null ? _a : LABEL_KEY_ALIASES[lower]) != null ? _b : normalizeKeyToken(piece);
  }
  function comboTokenSet(shortcut) {
    var _a;
    if (shortcut.key !== void 0 && shortcut.key !== "") {
      return /* @__PURE__ */ new Set([...(_a = shortcut.modifiers) != null ? _a : [], shortcut.key]);
    }
    const tokens = /* @__PURE__ */ new Set();
    for (const step of shortcut.comboLabel.split(",")) {
      for (const piece of step.split("+")) {
        const trimmed = piece.trim();
        if (trimmed) tokens.add(labelToken(trimmed));
      }
    }
    return tokens;
  }
  function matchesChord(shortcut, chord2) {
    const tokens = comboTokenSet(shortcut);
    for (const modifier of chord2.modifiers) if (!tokens.has(modifier)) return false;
    return chord2.key === "" || tokens.has(chord2.key);
  }
  function filterShortcutsByChord(shortcuts, chord2) {
    if (!chord2) return shortcuts;
    return shortcuts.filter((shortcut) => matchesChord(shortcut, chord2));
  }

  // web/data/shortcuts-data.js
  var SHORTCUT_GROUPS = [
    {
      "app": "JAWS",
      "appId": "screenreader.jaws",
      "note": "JAWS key is Insert by default - assumes Desktop keyboard layout",
      "manualUrl": "https://support.freedomscientific.com/Content/Documents/Manuals/JAWS/Keystrokes.txt",
      "commands": [
        {
          "keystroke": "Insert + A",
          "description": "Read address bar"
        },
        {
          "keystroke": "Insert + F9",
          "description": "List frames"
        },
        {
          "keystroke": "Insert + F7",
          "description": "List links"
        },
        {
          "keystroke": "Insert + F6",
          "description": "List headings"
        },
        {
          "keystroke": "Insert + F5",
          "description": "List form fields"
        },
        {
          "keystroke": "Insert + F3",
          "description": "Virtual HTML features"
        },
        {
          "keystroke": "Insert + Ctrl + Tab",
          "description": "Assign a custom label"
        },
        {
          "keystroke": "Windows + Ctrl + Equals",
          "description": "ARIA drag and drop"
        },
        {
          "keystroke": "Windows + Ctrl + Dash",
          "description": "ARIA live region text filter"
        },
        {
          "keystroke": "Insert + Spacebar, then X",
          "description": "Open the Flexible Web wizard"
        },
        {
          "keystroke": "Insert + X",
          "description": "Temporarily toggle Smart Navigation"
        },
        {
          "keystroke": "1 through 6",
          "description": "Move to heading at levels 1\u20136 (browse mode)"
        },
        {
          "keystroke": "A",
          "description": "Next radio button (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "B",
          "description": "Next button (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "C",
          "description": "Next combo box, list box, or tree view (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "D",
          "description": "Next different element (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "E",
          "description": "Next edit box (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "F",
          "description": "Next form control (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "G",
          "description": "Next graphic (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "H",
          "description": "Next heading (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "I",
          "description": "Next list item (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "J",
          "description": "Jump to line (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "K",
          "description": "Next placemarker (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "L",
          "description": "Next list (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "M",
          "description": "Next frame (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "N",
          "description": "Skip past a block of links (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "O",
          "description": "Next article (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "P",
          "description": "Next paragraph (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Q",
          "description": "Move to the main region (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "R",
          "description": "Next region (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "S",
          "description": "Next same element (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "T",
          "description": "Next table (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "U",
          "description": "Next unvisited link (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "V",
          "description": "Next visited link (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "X",
          "description": "Next check box (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Z",
          "description": "Next division (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Apostrophe",
          "description": "Next tab control (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Dash",
          "description": "Next separator (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Slash",
          "description": "Next clickable element (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Semicolon",
          "description": "Next mouse-over element (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Shift + Period",
          "description": "Next element"
        },
        {
          "keystroke": "Shift + Comma",
          "description": "Previous element"
        },
        {
          "keystroke": "Num Pad Plus",
          "description": "Exit forms mode"
        },
        {
          "keystroke": "Insert + Ctrl + Home",
          "description": "Move to the first form field"
        },
        {
          "keystroke": "Insert + Ctrl + End",
          "description": "Move to the last form field"
        },
        {
          "keystroke": "Ctrl + Insert + A",
          "description": "List radio buttons"
        },
        {
          "keystroke": "Ctrl + Insert + B",
          "description": "List buttons"
        },
        {
          "keystroke": "Ctrl + Insert + C",
          "description": "List combo boxes"
        },
        {
          "keystroke": "Ctrl + Insert + E",
          "description": "List edit boxes"
        },
        {
          "keystroke": "Ctrl + Insert + X",
          "description": "List check boxes"
        },
        {
          "keystroke": "F8",
          "description": "Select the current table"
        },
        {
          "keystroke": "Windows + Alt + Down Arrow",
          "description": "Move to the next table row"
        },
        {
          "keystroke": "Windows + Alt + Up Arrow",
          "description": "Move to the prior table row"
        },
        {
          "keystroke": "Windows + Comma",
          "description": "Read the current table row"
        },
        {
          "keystroke": "Windows + Alt + Right Arrow",
          "description": "Move to the next table column"
        },
        {
          "keystroke": "Windows + Alt + Left Arrow",
          "description": "Move to the prior table column"
        },
        {
          "keystroke": "Windows + Period",
          "description": "Read the current table column"
        },
        {
          "keystroke": "Alt + Ctrl + Right Arrow",
          "description": "Move to the next cell in the row"
        },
        {
          "keystroke": "Alt + Ctrl + Left Arrow",
          "description": "Move to the prior cell in the row"
        },
        {
          "keystroke": "Alt + Ctrl + Down Arrow",
          "description": "Move to the cell below"
        },
        {
          "keystroke": "Alt + Ctrl + Up Arrow",
          "description": "Move to the cell above"
        },
        {
          "keystroke": "Ctrl + Windows + J",
          "description": "Jump to a table cell"
        },
        {
          "keystroke": "Ctrl + Windows + Shift + J",
          "description": "Return to the previous cell"
        },
        {
          "keystroke": "Ctrl + Windows + K",
          "description": "Set a temporary placemarker"
        },
        {
          "keystroke": "Ctrl + Shift + K",
          "description": "Add, delete, edit, or rename a permanent placemarker"
        },
        {
          "keystroke": "Alt + Windows + K",
          "description": "Return to a placemarker in Word"
        },
        {
          "keystroke": "Insert + Spacebar, then M",
          "description": "Select from a placemarker to the cursor"
        },
        {
          "keystroke": "Shift + Insert + F1",
          "description": "Display the current element"
        },
        {
          "keystroke": "Ctrl + Shift + Insert + F1",
          "description": "Display detailed element info"
        },
        {
          "keystroke": "Insert + Ctrl + Enter",
          "description": "Activate the mouse-over for an element"
        },
        {
          "keystroke": "Num Pad 5",
          "description": "Say character"
        },
        {
          "keystroke": "Caps Lock + Comma",
          "description": "Say character"
        },
        {
          "keystroke": "Num Pad 5 twice quickly",
          "description": "Say character phonetically"
        },
        {
          "keystroke": "Caps Lock + Comma twice quickly",
          "description": "Say character phonetically"
        },
        {
          "keystroke": "Left Arrow",
          "description": "Say prior character"
        },
        {
          "keystroke": "Caps Lock + M",
          "description": "Say prior character"
        },
        {
          "keystroke": "Right Arrow",
          "description": "Say next character"
        },
        {
          "keystroke": "Caps Lock + Period",
          "description": "Say next character"
        },
        {
          "keystroke": "Insert + Num Pad 5",
          "description": "Say word"
        },
        {
          "keystroke": "Caps Lock + K",
          "description": "Say word"
        },
        {
          "keystroke": "Insert + Num Pad 5 twice quickly",
          "description": "Spell word"
        },
        {
          "keystroke": "Caps Lock + K twice quickly",
          "description": "Spell word"
        },
        {
          "keystroke": "Insert + Left Arrow",
          "description": "Say prior word"
        },
        {
          "keystroke": "Caps Lock + J",
          "description": "Say prior word"
        },
        {
          "keystroke": "Insert + Right Arrow",
          "description": "Say next word"
        },
        {
          "keystroke": "Caps Lock + L",
          "description": "Say next word"
        },
        {
          "keystroke": "Insert + Up Arrow",
          "description": "Say line"
        },
        {
          "keystroke": "Caps Lock + I",
          "description": "Say line"
        },
        {
          "keystroke": "Insert + Up Arrow twice quickly",
          "description": "Spell line"
        },
        {
          "keystroke": "Caps Lock + I twice quickly",
          "description": "Spell line"
        },
        {
          "keystroke": "Up Arrow",
          "description": "Say prior line"
        },
        {
          "keystroke": "Caps Lock + U",
          "description": "Say prior line"
        },
        {
          "keystroke": "Down Arrow",
          "description": "Say next line"
        },
        {
          "keystroke": "Caps Lock + O",
          "description": "Say next line"
        },
        {
          "keystroke": "Alt + Num Pad 5",
          "description": "Say sentence"
        },
        {
          "keystroke": "Caps Lock + H",
          "description": "Say sentence"
        },
        {
          "keystroke": "Alt + Num Pad Minus",
          "description": "Say prior sentence"
        },
        {
          "keystroke": "Caps Lock + Y",
          "description": "Say prior sentence"
        },
        {
          "keystroke": "Alt + Num Pad Plus",
          "description": "Say next sentence"
        },
        {
          "keystroke": "Caps Lock + N",
          "description": "Say next sentence"
        },
        {
          "keystroke": "Ctrl + Num Pad 5",
          "description": "Say paragraph"
        },
        {
          "keystroke": "Caps Lock + Ctrl + I",
          "description": "Say paragraph"
        },
        {
          "keystroke": "Ctrl + Up Arrow",
          "description": "Say prior paragraph"
        },
        {
          "keystroke": "Caps Lock + Ctrl + U",
          "description": "Say prior paragraph"
        },
        {
          "keystroke": "Ctrl + Down Arrow",
          "description": "Say next paragraph"
        },
        {
          "keystroke": "Caps Lock + Ctrl + O",
          "description": "Say next paragraph"
        },
        {
          "keystroke": "Insert + Home",
          "description": "Say to cursor"
        },
        {
          "keystroke": "Caps Lock + Shift + J",
          "description": "Say to cursor"
        },
        {
          "keystroke": "Insert + Page Up",
          "description": "Say from cursor"
        },
        {
          "keystroke": "Caps Lock + Shift + L",
          "description": "Say from cursor"
        },
        {
          "keystroke": "Insert + Down Arrow",
          "description": "Say all"
        },
        {
          "keystroke": "Caps Lock + A",
          "description": "Say all"
        },
        {
          "keystroke": "Insert + 5",
          "description": "Say color"
        },
        {
          "keystroke": "Caps Lock + 5",
          "description": "Say color"
        },
        {
          "keystroke": "Alt + Ctrl + Page Up",
          "description": "Temporarily increase voice rate"
        },
        {
          "keystroke": "Alt + Ctrl + Page Down",
          "description": "Temporarily decrease voice rate"
        },
        {
          "keystroke": "Alt + Windows + Ctrl + Page Up",
          "description": "Permanently increase voice rate"
        },
        {
          "keystroke": "Alt + Windows + Ctrl + Page Down",
          "description": "Permanently decrease voice rate"
        },
        {
          "keystroke": "Ctrl + Insert + Down Arrow",
          "description": "Start skim reading"
        },
        {
          "keystroke": "Caps Lock + Ctrl + Down Arrow",
          "description": "Start skim reading"
        },
        {
          "keystroke": "Ctrl + Shift + Insert + Down Arrow",
          "description": "Change skim reading preferences"
        },
        {
          "keystroke": "Caps Lock + Ctrl + Shift + Down Arrow",
          "description": "Change skim reading preferences"
        },
        {
          "keystroke": "Insert + Spacebar, then S",
          "description": "Cycle full, on-demand, and mute speech"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then S",
          "description": "Cycle full, on-demand, and mute speech"
        },
        {
          "keystroke": "Insert + Spacebar, then Shift + S",
          "description": "Toggle speech on demand or mute"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then Shift + S",
          "description": "Toggle speech on demand or mute"
        },
        {
          "keystroke": "Insert + F",
          "description": "Say font"
        },
        {
          "keystroke": "Caps Lock + F",
          "description": "Say font"
        },
        {
          "keystroke": "Insert + T",
          "description": "Say window title"
        },
        {
          "keystroke": "Caps Lock + T",
          "description": "Say window title"
        },
        {
          "keystroke": "Insert + Tab",
          "description": "Say window prompt and text"
        },
        {
          "keystroke": "Caps Lock + Tab",
          "description": "Say window prompt and text"
        },
        {
          "keystroke": "Ctrl + Insert + F",
          "description": "JAWS Find"
        },
        {
          "keystroke": "Caps Lock + Ctrl + F",
          "description": "JAWS Find"
        },
        {
          "keystroke": "Insert + F3",
          "description": "JAWS Find Next"
        },
        {
          "keystroke": "Caps Lock + F3",
          "description": "JAWS Find Next"
        },
        {
          "keystroke": "Insert + Shift + F3",
          "description": "JAWS Find Previous"
        },
        {
          "keystroke": "Caps Lock + Shift + F3",
          "description": "JAWS Find Previous"
        },
        {
          "keystroke": "Insert + End",
          "description": "Say top line of window"
        },
        {
          "keystroke": "Caps Lock + Shift + Y",
          "description": "Say top line of window"
        },
        {
          "keystroke": "Insert + Page Down",
          "description": "Say bottom line of window"
        },
        {
          "keystroke": "Caps Lock + Shift + N",
          "description": "Say bottom line of window"
        },
        {
          "keystroke": "Insert + Shift + Down Arrow",
          "description": "Say selected text"
        },
        {
          "keystroke": "Caps Lock + Shift + A",
          "description": "Say selected text"
        },
        {
          "keystroke": "Ctrl + Insert + V",
          "description": "Get application version"
        },
        {
          "keystroke": "Caps Lock + Ctrl + V",
          "description": "Get application version"
        },
        {
          "keystroke": "Num Pad Plus",
          "description": "Activate the PC cursor"
        },
        {
          "keystroke": "Caps Lock + Semicolon",
          "description": "Activate the PC cursor"
        },
        {
          "keystroke": "Num Pad Minus",
          "description": "Activate the JAWS cursor"
        },
        {
          "keystroke": "Caps Lock + P",
          "description": "Activate the JAWS cursor"
        },
        {
          "keystroke": "Shift + Num Pad Plus",
          "description": "Activate the touch cursor"
        },
        {
          "keystroke": "Caps Lock + Shift + Semicolon",
          "description": "Activate the touch cursor"
        },
        {
          "keystroke": "Insert + Num Pad Plus",
          "description": "Route PC cursor to JAWS cursor"
        },
        {
          "keystroke": "Caps Lock + Apostrophe",
          "description": "Route PC cursor to JAWS cursor"
        },
        {
          "keystroke": "Insert + Num Pad Minus",
          "description": "Route JAWS cursor to PC cursor"
        },
        {
          "keystroke": "Caps Lock + Left Bracket",
          "description": "Route JAWS cursor to PC cursor"
        },
        {
          "keystroke": "Num Pad Slash",
          "description": "Left mouse button"
        },
        {
          "keystroke": "Caps Lock + 8",
          "description": "Left mouse button"
        },
        {
          "keystroke": "Num Pad Star",
          "description": "Right mouse button"
        },
        {
          "keystroke": "Caps Lock + 9",
          "description": "Right mouse button"
        },
        {
          "keystroke": "Ctrl + Insert + Num Pad Slash",
          "description": "Drag and drop"
        },
        {
          "keystroke": "Caps Lock + Ctrl + 8",
          "description": "Drag and drop"
        },
        {
          "keystroke": "Insert + R",
          "description": "Restrict the JAWS cursor"
        },
        {
          "keystroke": "Caps Lock + R",
          "description": "Restrict the JAWS cursor"
        },
        {
          "keystroke": "Insert + E",
          "description": "Say the default button"
        },
        {
          "keystroke": "Caps Lock + E",
          "description": "Say the default button"
        },
        {
          "keystroke": "Insert + B",
          "description": "Read window from top to bottom"
        },
        {
          "keystroke": "Caps Lock + B",
          "description": "Read window from top to bottom"
        },
        {
          "keystroke": "Insert + C",
          "description": "Read the word in context"
        },
        {
          "keystroke": "Caps Lock + C",
          "description": "Read the word in context"
        },
        {
          "keystroke": "Shift + Num Pad 5",
          "description": "Say the current control hot key"
        },
        {
          "keystroke": "Caps Lock + Shift + Comma",
          "description": "Say the current control hot key"
        },
        {
          "keystroke": "Insert + Spacebar, then J",
          "description": "JAWS command search"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then J",
          "description": "JAWS command search"
        },
        {
          "keystroke": "Insert + F1",
          "description": "Context-sensitive help"
        },
        {
          "keystroke": "Caps Lock + F1",
          "description": "Context-sensitive help"
        },
        {
          "keystroke": "Insert + 1",
          "description": "Keyboard help mode"
        },
        {
          "keystroke": "Caps Lock + 1",
          "description": "Keyboard help mode"
        },
        {
          "keystroke": "Insert + H",
          "description": "Hot key help"
        },
        {
          "keystroke": "Caps Lock + Ctrl + Shift + H",
          "description": "Hot key help"
        },
        {
          "keystroke": "Insert + W",
          "description": "Windows key help"
        },
        {
          "keystroke": "Caps Lock + W",
          "description": "Windows key help"
        },
        {
          "keystroke": "Insert + J",
          "description": "Open the JAWS window"
        },
        {
          "keystroke": "Caps Lock + Ctrl + Shift + J",
          "description": "Open the JAWS window"
        },
        {
          "keystroke": "Insert + Escape",
          "description": "Refresh the screen"
        },
        {
          "keystroke": "Caps Lock + Escape",
          "description": "Refresh the screen"
        },
        {
          "keystroke": "Insert + V",
          "description": "Quick settings"
        },
        {
          "keystroke": "Caps Lock + V",
          "description": "Quick settings"
        },
        {
          "keystroke": "Insert + F2",
          "description": "Run JAWS manager"
        },
        {
          "keystroke": "Caps Lock + F2",
          "description": "Run JAWS manager"
        },
        {
          "keystroke": "Insert + F4",
          "description": "Shut down JAWS"
        },
        {
          "keystroke": "Caps Lock + F4",
          "description": "Shut down JAWS"
        },
        {
          "keystroke": "Insert + F10",
          "description": "Window list dialog"
        },
        {
          "keystroke": "Caps Lock + F10",
          "description": "Window list dialog"
        },
        {
          "keystroke": "Insert + F11",
          "description": "Select a system tray icon"
        },
        {
          "keystroke": "Caps Lock + F11",
          "description": "Select a system tray icon"
        },
        {
          "keystroke": "Insert + F12",
          "description": "Say the system time"
        },
        {
          "keystroke": "Caps Lock + F12",
          "description": "Say the system time"
        },
        {
          "keystroke": "Insert + G",
          "description": "Graphics labeler"
        },
        {
          "keystroke": "Caps Lock + G",
          "description": "Graphics labeler"
        },
        {
          "keystroke": "Ctrl + Insert + G",
          "description": "Auto graphics labeler"
        },
        {
          "keystroke": "Caps Lock + Ctrl + G",
          "description": "Auto graphics labeler"
        },
        {
          "keystroke": "Insert + 3",
          "description": "Pass the next key through"
        },
        {
          "keystroke": "Caps Lock + 3",
          "description": "Pass the next key through"
        },
        {
          "keystroke": "Alt + Insert + W",
          "description": "Virtualize the window"
        },
        {
          "keystroke": "Alt + Caps Lock + W",
          "description": "Virtualize the window"
        },
        {
          "keystroke": "Insert + Shift + V",
          "description": "Virtualize the current control"
        },
        {
          "keystroke": "Caps Lock + Shift + V",
          "description": "Virtualize the current control"
        },
        {
          "keystroke": "Alt + Insert + S",
          "description": "Select a scheme"
        },
        {
          "keystroke": "Alt + Caps Lock + S",
          "description": "Select a scheme"
        },
        {
          "keystroke": "Ctrl + Windows + L",
          "description": "Select a language"
        },
        {
          "keystroke": "Ctrl + Insert + S",
          "description": "Select a voice profile"
        },
        {
          "keystroke": "Caps Lock + Ctrl + S",
          "description": "Select a voice profile"
        },
        {
          "keystroke": "Ctrl + Insert + 1 through 0",
          "description": "Read list view columns 1\u201310"
        },
        {
          "keystroke": "Caps Lock + Ctrl + 1 through 0",
          "description": "Read list view columns 1\u201310"
        },
        {
          "keystroke": "Insert + Windows + C",
          "description": "Copy selected text to the FSClipboard"
        },
        {
          "keystroke": "Caps Lock + Windows + C",
          "description": "Copy selected text to the FSClipboard"
        },
        {
          "keystroke": "Insert + Spacebar, then H",
          "description": "Show speech history"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then H",
          "description": "Show speech history"
        },
        {
          "keystroke": "Insert + Spacebar, then D",
          "description": "Toggle audio ducking"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then D",
          "description": "Toggle audio ducking"
        },
        {
          "keystroke": "Insert + Spacebar, then Z",
          "description": "Toggle default mode"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then Z",
          "description": "Toggle default mode"
        },
        {
          "keystroke": "Insert + Spacebar, then F11",
          "description": "Toggle screen shade"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then F11",
          "description": "Toggle screen shade"
        },
        {
          "keystroke": "Ctrl + Shift + Left Bracket",
          "description": "Frame: get top left"
        },
        {
          "keystroke": "Ctrl + Shift + Right Bracket",
          "description": "Frame: get bottom right"
        },
        {
          "keystroke": "Ctrl + Shift + Left Bracket twice quickly",
          "description": "Frame: set to window"
        },
        {
          "keystroke": "Insert + Alt + T",
          "description": "End a JAWS Tandem session"
        },
        {
          "keystroke": "Insert + Alt + Tab",
          "description": "Toggle between target and controller desktop"
        },
        {
          "keystroke": "Insert + Ctrl + Shift + V",
          "description": "Toggle video on the controller"
        },
        {
          "keystroke": "Insert + Spacebar, then R",
          "description": "Open Research It"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then R",
          "description": "Open Research It"
        },
        {
          "keystroke": "Insert + Windows + R",
          "description": "Research It primary lookup"
        },
        {
          "keystroke": "Caps Lock + Windows + R",
          "description": "Research It primary lookup"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then A",
          "description": "OCR: acquire from camera or scanner"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then A",
          "description": "OCR: acquire from camera or scanner"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then F",
          "description": "OCR: recognize the selected image file"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then F",
          "description": "OCR: recognize the selected image file"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then D",
          "description": "OCR: recognize the current PDF"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then D",
          "description": "OCR: recognize the current PDF"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then W",
          "description": "OCR: recognize the current window"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then W",
          "description": "OCR: recognize the current window"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then S",
          "description": "OCR: recognize the entire screen"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then S",
          "description": "OCR: recognize the entire screen"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then C",
          "description": "OCR: recognize the selected control"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then C",
          "description": "OCR: recognize the selected control"
        },
        {
          "keystroke": "Insert + Spacebar, then O, then Q",
          "description": "OCR: cancel recognition"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then O, then Q",
          "description": "OCR: cancel recognition"
        },
        {
          "keystroke": "Insert + Spacebar, then P, then A",
          "description": "Picture Smart: describe from camera or scanner"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then P, then A",
          "description": "Picture Smart: describe from camera or scanner"
        },
        {
          "keystroke": "Insert + Spacebar, then P, then F",
          "description": "Picture Smart: describe the selected image file"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then P, then F",
          "description": "Picture Smart: describe the selected image file"
        },
        {
          "keystroke": "Insert + Spacebar, then P, then B",
          "description": "Picture Smart: describe the clipboard image"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then P, then B",
          "description": "Picture Smart: describe the clipboard image"
        },
        {
          "keystroke": "Insert + Spacebar, then P, then C",
          "description": "Picture Smart: describe the current control"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then P, then C",
          "description": "Picture Smart: describe the current control"
        },
        {
          "keystroke": "Insert + Spacebar, then E, then O",
          "description": "Mouse echo: toggle"
        },
        {
          "keystroke": "Caps Lock + Spacebar, then E, then O",
          "description": "Mouse echo: toggle"
        }
      ]
    },
    {
      "app": "NVDA",
      "appId": "screenreader.nvda",
      "note": "NVDA key is Insert by default - assumes Desktop keyboard layout",
      "manualUrl": "https://download.nvaccess.org/documentation/userGuide.html",
      "commands": [
        {
          "keystroke": "Ctrl + Alt + N",
          "description": "Start or restart NVDA"
        },
        {
          "keystroke": "NVDA + N",
          "description": "Open the NVDA menu"
        },
        {
          "keystroke": "NVDA + 1",
          "description": "Toggle input help mode"
        },
        {
          "keystroke": "NVDA + Q",
          "description": "Quit NVDA"
        },
        {
          "keystroke": "NVDA + F2",
          "description": "Pass the next key through"
        },
        {
          "keystroke": "NVDA + Shift + S",
          "description": "Toggle application sleep mode"
        },
        {
          "keystroke": "NVDA + Shift + Z",
          "description": "Toggle application sleep mode"
        },
        {
          "keystroke": "NVDA + F12",
          "description": "Report the date and time"
        },
        {
          "keystroke": "NVDA + Shift + B",
          "description": "Report battery status"
        },
        {
          "keystroke": "NVDA + C",
          "description": "Report clipboard text"
        },
        {
          "keystroke": "NVDA + S",
          "description": "Cycle speech mode"
        },
        {
          "keystroke": "NVDA + Tab",
          "description": "Report the current focus"
        },
        {
          "keystroke": "NVDA + T",
          "description": "Report the title"
        },
        {
          "keystroke": "NVDA + B",
          "description": "Read the active window"
        },
        {
          "keystroke": "NVDA + End",
          "description": "Report the status bar"
        },
        {
          "keystroke": "NVDA + Shift + End",
          "description": "Report the status bar"
        },
        {
          "keystroke": "Shift + Num Pad 2",
          "description": "Report the shortcut key of the focus"
        },
        {
          "keystroke": "NVDA + Ctrl + Shift + Period",
          "description": "Report the shortcut key of the focus"
        },
        {
          "keystroke": "NVDA + Down Arrow",
          "description": "Say all"
        },
        {
          "keystroke": "NVDA + A",
          "description": "Say all"
        },
        {
          "keystroke": "NVDA + Up Arrow",
          "description": "Read the current line"
        },
        {
          "keystroke": "NVDA + L",
          "description": "Read the current line"
        },
        {
          "keystroke": "NVDA + Shift + Up Arrow",
          "description": "Read the current text selection"
        },
        {
          "keystroke": "NVDA + Shift + S",
          "description": "Read the current text selection"
        },
        {
          "keystroke": "NVDA + F",
          "description": "Report text formatting"
        },
        {
          "keystroke": "NVDA + K",
          "description": "Report link destination"
        },
        {
          "keystroke": "NVDA + Num Pad Delete",
          "description": "Report caret location"
        },
        {
          "keystroke": "NVDA + Delete",
          "description": "Report caret location"
        },
        {
          "keystroke": "Alt + Down Arrow",
          "description": "Move to the next sentence"
        },
        {
          "keystroke": "Alt + Up Arrow",
          "description": "Move to the previous sentence"
        },
        {
          "keystroke": "Ctrl + Alt + Left Arrow",
          "description": "Move to the previous column"
        },
        {
          "keystroke": "Ctrl + Alt + Right Arrow",
          "description": "Move to the next column"
        },
        {
          "keystroke": "Ctrl + Alt + Up Arrow",
          "description": "Move to the previous row"
        },
        {
          "keystroke": "Ctrl + Alt + Down Arrow",
          "description": "Move to the next row"
        },
        {
          "keystroke": "Ctrl + Alt + Home",
          "description": "Move to the first column"
        },
        {
          "keystroke": "Ctrl + Alt + End",
          "description": "Move to the last column"
        },
        {
          "keystroke": "Ctrl + Alt + Page Up",
          "description": "Move to the first row"
        },
        {
          "keystroke": "Ctrl + Alt + Page Down",
          "description": "Move to the last row"
        },
        {
          "keystroke": "NVDA + Ctrl + Alt + Down Arrow",
          "description": "Say all in the current column"
        },
        {
          "keystroke": "NVDA + Ctrl + Alt + Right Arrow",
          "description": "Say all in the current row"
        },
        {
          "keystroke": "NVDA + Ctrl + Alt + Up Arrow",
          "description": "Read the entire current column"
        },
        {
          "keystroke": "NVDA + Ctrl + Alt + Left Arrow",
          "description": "Read the entire current row"
        },
        {
          "keystroke": "NVDA + Num Pad 5",
          "description": "Report the current object"
        },
        {
          "keystroke": "NVDA + Shift + O",
          "description": "Report the current object"
        },
        {
          "keystroke": "NVDA + Num Pad 8",
          "description": "Move to the containing object"
        },
        {
          "keystroke": "NVDA + Shift + Up Arrow",
          "description": "Move to the containing object"
        },
        {
          "keystroke": "NVDA + Num Pad 4",
          "description": "Move to the previous object"
        },
        {
          "keystroke": "NVDA + Shift + Left Arrow",
          "description": "Move to the previous object"
        },
        {
          "keystroke": "NVDA + Num Pad 9",
          "description": "Move to the previous object (flattened)"
        },
        {
          "keystroke": "NVDA + Shift + Left Bracket",
          "description": "Move to the previous object (flattened)"
        },
        {
          "keystroke": "NVDA + Num Pad 6",
          "description": "Move to the next object"
        },
        {
          "keystroke": "NVDA + Shift + Right Arrow",
          "description": "Move to the next object"
        },
        {
          "keystroke": "NVDA + Num Pad 3",
          "description": "Move to the next object (flattened)"
        },
        {
          "keystroke": "NVDA + Shift + Right Bracket",
          "description": "Move to the next object (flattened)"
        },
        {
          "keystroke": "NVDA + Num Pad 2",
          "description": "Move to the first contained object"
        },
        {
          "keystroke": "NVDA + Shift + Down Arrow",
          "description": "Move to the first contained object"
        },
        {
          "keystroke": "NVDA + Num Pad Minus",
          "description": "Move to the focus object"
        },
        {
          "keystroke": "NVDA + Backspace",
          "description": "Move to the focus object"
        },
        {
          "keystroke": "NVDA + Num Pad Enter",
          "description": "Activate the current navigator object"
        },
        {
          "keystroke": "NVDA + Enter",
          "description": "Activate the current navigator object"
        },
        {
          "keystroke": "NVDA + Shift + Num Pad Minus",
          "description": "Move focus to the navigator object"
        },
        {
          "keystroke": "NVDA + Shift + Backspace",
          "description": "Move focus to the navigator object"
        },
        {
          "keystroke": "NVDA + Shift + Num Pad Delete",
          "description": "Report the review cursor location"
        },
        {
          "keystroke": "NVDA + Shift + Delete",
          "description": "Report the review cursor location"
        },
        {
          "keystroke": "Shift + Num Pad 7",
          "description": "Move to the top line in review"
        },
        {
          "keystroke": "NVDA + Ctrl + Home",
          "description": "Move to the top line in review"
        },
        {
          "keystroke": "Num Pad 7",
          "description": "Move to the previous line in review"
        },
        {
          "keystroke": "NVDA + Up Arrow",
          "description": "Move to the previous line in review"
        },
        {
          "keystroke": "Num Pad 8",
          "description": "Report the current line in review"
        },
        {
          "keystroke": "NVDA + Shift + Period",
          "description": "Report the current line in review"
        },
        {
          "keystroke": "Num Pad 9",
          "description": "Move to the next line in review"
        },
        {
          "keystroke": "NVDA + Down Arrow",
          "description": "Move to the next line in review"
        },
        {
          "keystroke": "Shift + Num Pad 9",
          "description": "Move to the bottom line in review"
        },
        {
          "keystroke": "NVDA + Ctrl + End",
          "description": "Move to the bottom line in review"
        },
        {
          "keystroke": "Num Pad 4",
          "description": "Move to the previous word in review"
        },
        {
          "keystroke": "NVDA + Ctrl + Left Arrow",
          "description": "Move to the previous word in review"
        },
        {
          "keystroke": "Num Pad 5",
          "description": "Report the current word in review"
        },
        {
          "keystroke": "NVDA + Ctrl + Period",
          "description": "Report the current word in review"
        },
        {
          "keystroke": "Num Pad 6",
          "description": "Move to the next word in review"
        },
        {
          "keystroke": "NVDA + Ctrl + Right Arrow",
          "description": "Move to the next word in review"
        },
        {
          "keystroke": "Shift + Num Pad 1",
          "description": "Move to the start of the line in review"
        },
        {
          "keystroke": "NVDA + Home",
          "description": "Move to the start of the line in review"
        },
        {
          "keystroke": "Num Pad 1",
          "description": "Move to the previous character in review"
        },
        {
          "keystroke": "NVDA + Left Arrow",
          "description": "Move to the previous character in review"
        },
        {
          "keystroke": "Num Pad 2",
          "description": "Report the current character in review"
        },
        {
          "keystroke": "NVDA + Period",
          "description": "Report the current character in review"
        },
        {
          "keystroke": "Num Pad 3",
          "description": "Move to the next character in review"
        },
        {
          "keystroke": "NVDA + Right Arrow",
          "description": "Move to the next character in review"
        },
        {
          "keystroke": "Shift + Num Pad 3",
          "description": "Move to the end of the line in review"
        },
        {
          "keystroke": "NVDA + End",
          "description": "Move to the end of the line in review"
        },
        {
          "keystroke": "NVDA + Page Up",
          "description": "Move to the previous page in review"
        },
        {
          "keystroke": "NVDA + Shift + Page Up",
          "description": "Move to the previous page in review"
        },
        {
          "keystroke": "NVDA + Page Down",
          "description": "Move to the next page in review"
        },
        {
          "keystroke": "NVDA + Shift + Page Down",
          "description": "Move to the next page in review"
        },
        {
          "keystroke": "NVDA + Alt + Home",
          "description": "Move to the start of the selection in review"
        },
        {
          "keystroke": "NVDA + Alt + End",
          "description": "Move to the end of the selection in review"
        },
        {
          "keystroke": "Num Pad Plus",
          "description": "Say all with the review cursor"
        },
        {
          "keystroke": "NVDA + Shift + A",
          "description": "Say all with the review cursor"
        },
        {
          "keystroke": "NVDA + F9",
          "description": "Mark the start of a selection from the review cursor"
        },
        {
          "keystroke": "NVDA + F10",
          "description": "Select and copy to the review cursor"
        },
        {
          "keystroke": "NVDA + Shift + F",
          "description": "Report formatting at the review cursor"
        },
        {
          "keystroke": "NVDA + Num Pad 7",
          "description": "Switch to the next review mode"
        },
        {
          "keystroke": "NVDA + Page Up",
          "description": "Switch to the next review mode"
        },
        {
          "keystroke": "NVDA + Num Pad 1",
          "description": "Switch to the previous review mode"
        },
        {
          "keystroke": "NVDA + Page Down",
          "description": "Switch to the previous review mode"
        },
        {
          "keystroke": "Num Pad Slash",
          "description": "Left mouse button click"
        },
        {
          "keystroke": "NVDA + Left Bracket",
          "description": "Left mouse button click"
        },
        {
          "keystroke": "Shift + Num Pad Slash",
          "description": "Lock or unlock the left mouse button"
        },
        {
          "keystroke": "NVDA + Ctrl + Left Bracket",
          "description": "Lock or unlock the left mouse button"
        },
        {
          "keystroke": "Num Pad Star",
          "description": "Right mouse button click"
        },
        {
          "keystroke": "NVDA + Right Bracket",
          "description": "Right mouse button click"
        },
        {
          "keystroke": "Shift + Num Pad Star",
          "description": "Lock or unlock the right mouse button"
        },
        {
          "keystroke": "NVDA + Ctrl + Right Bracket",
          "description": "Lock or unlock the right mouse button"
        },
        {
          "keystroke": "NVDA + Num Pad Slash",
          "description": "Move the mouse to the navigator object"
        },
        {
          "keystroke": "NVDA + Shift + M",
          "description": "Move the mouse to the navigator object"
        },
        {
          "keystroke": "NVDA + Num Pad Star",
          "description": "Move the navigator to the object under the mouse"
        },
        {
          "keystroke": "NVDA + Shift + N",
          "description": "Move the navigator to the object under the mouse"
        },
        {
          "keystroke": "NVDA + Spacebar",
          "description": "Toggle between browse mode and focus mode"
        },
        {
          "keystroke": "NVDA + F5",
          "description": "Refresh the browse mode document"
        },
        {
          "keystroke": "NVDA + Ctrl + F",
          "description": "Find text"
        },
        {
          "keystroke": "NVDA + F3",
          "description": "Find next"
        },
        {
          "keystroke": "NVDA + Shift + F3",
          "description": "Find previous"
        },
        {
          "keystroke": "NVDA + Shift + Spacebar",
          "description": "Toggle single-letter navigation"
        },
        {
          "keystroke": "NVDA + F7",
          "description": "Open the elements list"
        },
        {
          "keystroke": "NVDA + Ctrl + Spacebar",
          "description": "Move to the containing browse mode document"
        },
        {
          "keystroke": "NVDA + Shift + F10",
          "description": "Toggle native selection mode"
        },
        {
          "keystroke": "H",
          "description": "Next heading (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "1 through 6",
          "description": "Next heading at levels 1\u20136 (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "L",
          "description": "Next list (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "I",
          "description": "Next list item (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "T",
          "description": "Next table (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "K",
          "description": "Next link (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "N",
          "description": "Next non-linked text (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "F",
          "description": "Next form field (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "U",
          "description": "Next unvisited link (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "V",
          "description": "Next visited link (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "E",
          "description": "Next edit field (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "B",
          "description": "Next button (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "X",
          "description": "Next check box (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "C",
          "description": "Next combo box (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "R",
          "description": "Next radio button (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Q",
          "description": "Next block quote (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "S",
          "description": "Next separator (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "M",
          "description": "Next frame (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "G",
          "description": "Next graphic (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "D",
          "description": "Next landmark (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "O",
          "description": "Next embedded object (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "A",
          "description": "Next annotation (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "P",
          "description": "Next paragraph (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "W",
          "description": "Next spelling error (browse mode; add Shift for previous)"
        },
        {
          "keystroke": "Comma",
          "description": "Move past the end of the container (browse mode)"
        },
        {
          "keystroke": "Shift + Comma",
          "description": "Move to the start of the container (browse mode)"
        },
        {
          "keystroke": "NVDA + Alt + M",
          "description": "Interact with math content"
        },
        {
          "keystroke": "NVDA + Ctrl + Escape",
          "description": "Toggle the screen curtain"
        },
        {
          "keystroke": "NVDA + R",
          "description": "Recognize the current object with Windows OCR"
        },
        {
          "keystroke": "NVDA + Shift + C",
          "description": "Word/Excel: set column headers"
        },
        {
          "keystroke": "NVDA + Shift + R",
          "description": "Word/Excel: set row headers"
        },
        {
          "keystroke": "NVDA + Alt + C",
          "description": "Word/Excel: report comments or notes"
        },
        {
          "keystroke": "Ctrl + Shift + S",
          "description": "PowerPoint: toggle speaker notes"
        },
        {
          "keystroke": "Ctrl + Shift + R",
          "description": "foobar2000: report remaining time"
        },
        {
          "keystroke": "Ctrl + Shift + E",
          "description": "foobar2000: report elapsed time"
        },
        {
          "keystroke": "Ctrl + Shift + T",
          "description": "foobar2000: report track length"
        },
        {
          "keystroke": "NVDA + Ctrl + 1 through 4",
          "description": "Miranda IM: report a recent message"
        },
        {
          "keystroke": "Ctrl + Shift + A",
          "description": "Poedit: report notes for translators"
        },
        {
          "keystroke": "Ctrl + Shift + C",
          "description": "Poedit: report the comment window"
        },
        {
          "keystroke": "Ctrl + Shift + O",
          "description": "Poedit: report the old source text"
        },
        {
          "keystroke": "Ctrl + Shift + W",
          "description": "Poedit: report the translation warning"
        },
        {
          "keystroke": "NVDA + Ctrl + G",
          "description": "Open general settings"
        },
        {
          "keystroke": "NVDA + Ctrl + V",
          "description": "Open speech settings"
        },
        {
          "keystroke": "NVDA + P",
          "description": "Cycle the symbol / punctuation level"
        },
        {
          "keystroke": "NVDA + Ctrl + S",
          "description": "Select a synthesizer"
        },
        {
          "keystroke": "NVDA + Ctrl + Right Arrow",
          "description": "Move to the next synth setting"
        },
        {
          "keystroke": "NVDA + Shift + Ctrl + Right Arrow",
          "description": "Move to the next synth setting"
        },
        {
          "keystroke": "NVDA + Ctrl + Left Arrow",
          "description": "Move to the previous synth setting"
        },
        {
          "keystroke": "NVDA + Shift + Ctrl + Left Arrow",
          "description": "Move to the previous synth setting"
        },
        {
          "keystroke": "NVDA + Ctrl + Up Arrow",
          "description": "Increment the current synth setting"
        },
        {
          "keystroke": "NVDA + Shift + Ctrl + Up Arrow",
          "description": "Increment the current synth setting"
        },
        {
          "keystroke": "NVDA + Ctrl + Down Arrow",
          "description": "Decrement the current synth setting"
        },
        {
          "keystroke": "NVDA + Shift + Ctrl + Down Arrow",
          "description": "Decrement the current synth setting"
        },
        {
          "keystroke": "NVDA + Alt + T",
          "description": "Cycle the braille mode"
        },
        {
          "keystroke": "NVDA + Ctrl + T",
          "description": "Cycle where braille is tethered"
        },
        {
          "keystroke": "NVDA + Ctrl + A",
          "description": "Select a braille display"
        },
        {
          "keystroke": "NVDA + Ctrl + U",
          "description": "Open audio settings"
        },
        {
          "keystroke": "NVDA + Shift + D",
          "description": "Cycle the audio ducking mode"
        },
        {
          "keystroke": "NVDA + Alt + S",
          "description": "Cycle the sound split mode"
        },
        {
          "keystroke": "NVDA + Ctrl + K",
          "description": "Open keyboard settings"
        },
        {
          "keystroke": "NVDA + 2",
          "description": "Toggle speaking of typed characters"
        },
        {
          "keystroke": "NVDA + 3",
          "description": "Toggle speaking of typed words"
        },
        {
          "keystroke": "NVDA + 4",
          "description": "Toggle speaking of command keys"
        },
        {
          "keystroke": "NVDA + Ctrl + M",
          "description": "Open mouse settings"
        },
        {
          "keystroke": "NVDA + M",
          "description": "Toggle mouse tracking"
        },
        {
          "keystroke": "NVDA + 7",
          "description": "Toggle whether review follows system focus"
        },
        {
          "keystroke": "NVDA + 6",
          "description": "Toggle whether review follows the system caret"
        },
        {
          "keystroke": "NVDA + Ctrl + O",
          "description": "Open object presentation settings"
        },
        {
          "keystroke": "NVDA + U",
          "description": "Cycle progress bar output"
        },
        {
          "keystroke": "NVDA + 5",
          "description": "Toggle reporting of dynamic content changes"
        },
        {
          "keystroke": "NVDA + Ctrl + B",
          "description": "Open browse mode settings"
        },
        {
          "keystroke": "NVDA + V",
          "description": "Toggle use of screen layout"
        },
        {
          "keystroke": "NVDA + Ctrl + D",
          "description": "Open document formatting settings"
        },
        {
          "keystroke": "NVDA + D",
          "description": "Report the summary of annotation details"
        },
        {
          "keystroke": "NVDA + Ctrl + C",
          "description": "Save the configuration"
        },
        {
          "keystroke": "NVDA + Ctrl + R",
          "description": "Revert the configuration"
        },
        {
          "keystroke": "NVDA + Ctrl + P",
          "description": "Open the configuration profiles dialog"
        },
        {
          "keystroke": "NVDA + Alt + R",
          "description": "Toggle the remote access connection"
        },
        {
          "keystroke": "NVDA + Alt + Tab",
          "description": "Toggle control of a remote machine"
        },
        {
          "keystroke": "NVDA + F1",
          "description": "Open the log viewer"
        },
        {
          "keystroke": "NVDA + Ctrl + Shift + F1",
          "description": "Copy a fragment of the log"
        },
        {
          "keystroke": "NVDA + Ctrl + F3",
          "description": "Reload plugins"
        },
        {
          "keystroke": "NVDA + Ctrl + F1",
          "description": "Report the loaded app module and executable"
        }
      ]
    },
    {
      "app": "Narrator",
      "appId": "screenreader.narrator",
      "note": "Narrator key (NA) is Insert or Caps Lock by default",
      "manualUrl": "https://support.microsoft.com/en-us/accessibility/windows/narrator/appendix-b-narrator-keyboard-commands-and-touch-gestures",
      "commands": [
        {
          "keystroke": "NA + Escape",
          "description": "Exit Narrator"
        },
        {
          "keystroke": "NA + 1",
          "description": "Toggle input learning"
        },
        {
          "keystroke": "NA + Right Arrow",
          "description": "Move to next item"
        },
        {
          "keystroke": "NA + Left Arrow",
          "description": "Move to previous item"
        },
        {
          "keystroke": "NA + Page Up",
          "description": "Change view"
        },
        {
          "keystroke": "Ctrl + NA + Up Arrow",
          "description": "Change view"
        },
        {
          "keystroke": "NA + Page Down",
          "description": "Change view"
        },
        {
          "keystroke": "Ctrl + NA + Down Arrow",
          "description": "Change view"
        },
        {
          "keystroke": "NA + F1",
          "description": "Show commands list"
        },
        {
          "keystroke": "NA + F2",
          "description": "Show commands for current item"
        },
        {
          "keystroke": "NA + Enter",
          "description": "Do primary action"
        },
        {
          "keystroke": "NA + Ctrl + Enter",
          "description": "Toggle search mode"
        },
        {
          "keystroke": "NA + Backslash",
          "description": "Read the status bar in apps such as Word, Excel, and PowerPoint"
        },
        {
          "keystroke": "NA + F12",
          "description": "Read current time and date"
        },
        {
          "keystroke": "NA + Shift + B",
          "description": "Read Battery and Network status"
        },
        {
          "keystroke": "NA + Alt + B",
          "description": "Toggle braille viewer"
        },
        {
          "keystroke": "NA + Ctrl + C",
          "description": "Toggle Screen curtain"
        },
        {
          "keystroke": "NA + Ctrl + D",
          "description": "Describe image using an online service or get the webpage source of a link"
        },
        {
          "keystroke": "NA + S",
          "description": "Get a webpage summary"
        },
        {
          "keystroke": "NA + S twice quickly",
          "description": "Get webpage summary and popular links dialog box"
        },
        {
          "keystroke": "NA + Shift + S",
          "description": "Speech off"
        },
        {
          "keystroke": "NA + Alt + F",
          "description": "Provide Narrator feedback"
        },
        {
          "keystroke": "NA + Z",
          "description": "Lock Narrator key"
        },
        {
          "keystroke": "NA + Ctrl + F12",
          "description": "Toggle developer mode"
        },
        {
          "keystroke": "NA + 3",
          "description": "Pass keys to application"
        },
        {
          "keystroke": "NA + 4",
          "description": "Change capitalization reading mode"
        },
        {
          "keystroke": "NA + Alt + M",
          "description": "Toggle mouse mode"
        },
        {
          "keystroke": "NA + H",
          "description": "Turn on or off Outlook column header reading"
        },
        {
          "keystroke": "Ctrl + NA + Plus",
          "description": "Increase voice volume"
        },
        {
          "keystroke": "Ctrl + NA + Num Pad Plus",
          "description": "Increase voice volume"
        },
        {
          "keystroke": "Ctrl + NA + Minus",
          "description": "Decrease voice volume"
        },
        {
          "keystroke": "Ctrl + NA + Num Pad Minus",
          "description": "Decrease voice volume"
        },
        {
          "keystroke": "NA + Plus",
          "description": "Increase voice speed"
        },
        {
          "keystroke": "NA + Minus",
          "description": "Decrease voice speed"
        },
        {
          "keystroke": "NA + Alt + Plus",
          "description": "Move to the next voice"
        },
        {
          "keystroke": "NA + Alt + Num Pad Plus",
          "description": "Move to the next voice"
        },
        {
          "keystroke": "NA + Alt + Minus",
          "description": "Move to the previous voice"
        },
        {
          "keystroke": "NA + Alt + Num Pad Minus",
          "description": "Move to the previous voice"
        },
        {
          "keystroke": "NA + Alt + Left Bracket",
          "description": "Change to the prior punctuation reading mode"
        },
        {
          "keystroke": "NA + Alt + Right Bracket",
          "description": "Change to the next punctuation reading mode"
        },
        {
          "keystroke": "NA + V",
          "description": "Increase verbosity mode"
        },
        {
          "keystroke": "NA + Shift + V",
          "description": "Decrease verbosity mode"
        },
        {
          "keystroke": "NA + 2",
          "description": "Toggle character reading"
        },
        {
          "keystroke": "NA + Slash",
          "description": "Read context"
        },
        {
          "keystroke": "NA + Alt + Slash",
          "description": "Set read context verbosity"
        },
        {
          "keystroke": "NA + Ctrl + Slash",
          "description": "Change read context order"
        },
        {
          "keystroke": "NA + Tab",
          "description": "Read item"
        },
        {
          "keystroke": "NA + Num Pad 5",
          "description": "Read item"
        },
        {
          "keystroke": "NA + Tab twice quickly",
          "description": "Read item spelled out"
        },
        {
          "keystroke": "NA + Num Pad 5 twice quickly",
          "description": "Read item spelled out"
        },
        {
          "keystroke": "NA + K twice quickly",
          "description": "Read item spelled out"
        },
        {
          "keystroke": "NA + Ctrl + Num Pad 5 twice quickly",
          "description": "Read item spelled out"
        },
        {
          "keystroke": "NA + 0",
          "description": "Read item advanced"
        },
        {
          "keystroke": "NA + T",
          "description": "Read window title"
        },
        {
          "keystroke": "NA + W",
          "description": "Read window"
        },
        {
          "keystroke": "NA + X",
          "description": "Re-hear what Narrator spoke last"
        },
        {
          "keystroke": "NA + Ctrl + X",
          "description": "Copy last spoken phrase to clipboard"
        },
        {
          "keystroke": "NA + Alt + X",
          "description": "Open speech recap window for history and live transcription"
        },
        {
          "keystroke": "NA + R",
          "description": "Read from cursor"
        },
        {
          "keystroke": "Ctrl + NA + R",
          "description": "Start reading document"
        },
        {
          "keystroke": "NA + Down Arrow",
          "description": "Start reading document"
        },
        {
          "keystroke": "NA + C",
          "description": "Read document"
        },
        {
          "keystroke": "NA + Shift + J",
          "description": "Read text from start to cursor"
        },
        {
          "keystroke": "NA + Alt + Home",
          "description": "Read text from start to cursor"
        },
        {
          "keystroke": "Ctrl + NA + U",
          "description": "Read previous page"
        },
        {
          "keystroke": "Ctrl + NA + I",
          "description": "Read current page"
        },
        {
          "keystroke": "Ctrl + NA + O",
          "description": "Read next page"
        },
        {
          "keystroke": "Ctrl + NA + J",
          "description": "Read previous paragraph"
        },
        {
          "keystroke": "Ctrl + NA + K",
          "description": "Read current paragraph"
        },
        {
          "keystroke": "Ctrl + NA + L",
          "description": "Read next paragraph"
        },
        {
          "keystroke": "NA + Ctrl + M",
          "description": "Read previous sentence"
        },
        {
          "keystroke": "NA + Ctrl + Comma",
          "description": "Read current sentence"
        },
        {
          "keystroke": "NA + Ctrl + Period",
          "description": "Read next sentence"
        },
        {
          "keystroke": "NA + U",
          "description": "Read previous line"
        },
        {
          "keystroke": "NA + I",
          "description": "Read current line"
        },
        {
          "keystroke": "NA + Up Arrow",
          "description": "Read current line"
        },
        {
          "keystroke": "NA + O",
          "description": "Read next line"
        },
        {
          "keystroke": "NA + J",
          "description": "Read previous word"
        },
        {
          "keystroke": "Ctrl + NA + Left Arrow",
          "description": "Read previous word"
        },
        {
          "keystroke": "NA + K",
          "description": "Read current word"
        },
        {
          "keystroke": "Ctrl + NA + Num Pad 5",
          "description": "Read current word"
        },
        {
          "keystroke": "NA + L",
          "description": "Read next word"
        },
        {
          "keystroke": "Ctrl + NA + Right Arrow",
          "description": "Read next word"
        },
        {
          "keystroke": "NA + M",
          "description": "Read previous character"
        },
        {
          "keystroke": "NA + Comma",
          "description": "Read current character"
        },
        {
          "keystroke": "Num Pad 5",
          "description": "Read current character"
        },
        {
          "keystroke": "NA + Period",
          "description": "Read next character"
        },
        {
          "keystroke": "NA + F",
          "description": "Read next group of formatting information"
        },
        {
          "keystroke": "NA + Shift + F",
          "description": "Read previous group of formatting information"
        },
        {
          "keystroke": "NA + B",
          "description": "Move to beginning of text"
        },
        {
          "keystroke": "Ctrl + NA + Home",
          "description": "Move to beginning of text"
        },
        {
          "keystroke": "NA + E",
          "description": "Move to end of text"
        },
        {
          "keystroke": "Ctrl + NA + End",
          "description": "Move to end of text"
        },
        {
          "keystroke": "NA + Shift + Down Arrow",
          "description": "Read selection"
        },
        {
          "keystroke": "NA + Shift + Down Arrow twice quickly",
          "description": "Spell selection"
        },
        {
          "keystroke": "Ctrl + Alt + Home",
          "description": "Jump to first cell in table"
        },
        {
          "keystroke": "Ctrl + Alt + End",
          "description": "Jump to last cell in table"
        },
        {
          "keystroke": "Ctrl + Alt + Right Arrow",
          "description": "Jump to next cell in row"
        },
        {
          "keystroke": "Ctrl + Alt + Left Arrow",
          "description": "Jump to previous cell in row"
        },
        {
          "keystroke": "Ctrl + Alt + Down Arrow",
          "description": "Jump to next cell in column"
        },
        {
          "keystroke": "Ctrl + Alt + Up Arrow",
          "description": "Jump to previous cell in column"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Left Arrow",
          "description": "Read current row header"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Up Arrow",
          "description": "Read current column header"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Right Arrow",
          "description": "Read current row"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Down Arrow",
          "description": "Read current column"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Slash",
          "description": "Read which row and column Narrator is in"
        },
        {
          "keystroke": "Ctrl + Shift + Alt + Num Pad 5",
          "description": "Read which row and column Narrator is in"
        },
        {
          "keystroke": "Ctrl + Alt + Page Up",
          "description": "Jump to table cell"
        },
        {
          "keystroke": "Ctrl + Alt + Page Down",
          "description": "Jump to cell contents"
        },
        {
          "keystroke": "NA + Home",
          "description": "Move to first item in window"
        },
        {
          "keystroke": "NA + End",
          "description": "Move to last item in window"
        },
        {
          "keystroke": "NA + Backspace",
          "description": "Go back one item"
        },
        {
          "keystroke": "NA + N",
          "description": "Move to main landmark"
        },
        {
          "keystroke": "NA + Left Bracket",
          "description": "Move Narrator cursor to system cursor"
        },
        {
          "keystroke": "NA + Num Pad Minus",
          "description": "Move Narrator cursor to system cursor"
        },
        {
          "keystroke": "NA + Apostrophe",
          "description": "Set focus to item"
        },
        {
          "keystroke": "NA + Num Pad Plus",
          "description": "Set focus to item"
        },
        {
          "keystroke": "NA + A",
          "description": "Jump to linked item"
        },
        {
          "keystroke": "NA + Shift + A",
          "description": "Jump to annotated content"
        },
        {
          "keystroke": "NA + Alt + Up Arrow",
          "description": "Navigate to parent (when structural navigation is provided)"
        },
        {
          "keystroke": "NA + Alt + Right Arrow",
          "description": "Navigate to next sibling (when structural navigation is provided)"
        },
        {
          "keystroke": "NA + Alt + Left Arrow",
          "description": "Navigate to previous sibling (when structural navigation is provided)"
        },
        {
          "keystroke": "NA + Alt + Down Arrow",
          "description": "Navigate to first child (when structural navigation is provided)"
        },
        {
          "keystroke": "NA + F7",
          "description": "List of links"
        },
        {
          "keystroke": "NA + F5",
          "description": "List of landmarks"
        },
        {
          "keystroke": "NA + F6",
          "description": "List of headings"
        },
        {
          "keystroke": "NA + Ctrl + F",
          "description": "Narrator Find"
        },
        {
          "keystroke": "NA + F3",
          "description": "Continue Find forward"
        },
        {
          "keystroke": "NA + Shift + F3",
          "description": "Continue Find backward"
        }
      ]
    },
    {
      "app": "VoiceOver",
      "appId": "screenreader.voiceover",
      "note": "VoiceOver (VO) key is Control + Option or Caps Lock by default",
      "manualUrl": "https://support.apple.com/en-gb/guide/voiceover/vo14111/mac",
      "commands": [
        {
          "keystroke": "VO + Command + Space",
          "description": "Actions"
        },
        {
          "keystroke": "VO + Function + (",
          "description": "Adjust Braille Window"
        },
        {
          "keystroke": "VO + Function + )",
          "description": "Adjust Caption Window"
        },
        {
          "keystroke": "VO + Function + 11",
          "description": "Application Chooser"
        },
        {
          "keystroke": "VO + Command + ,",
          "description": "Audio Graph Scrub Left"
        },
        {
          "keystroke": "VO + Command + .",
          "description": "Audio Graph Scrub Right"
        },
        {
          "keystroke": "VO + Function + @",
          "description": "Bring Window to Front"
        },
        {
          "keystroke": "VO + Caps Lock + Space",
          "description": "Click Mouse"
        },
        {
          "keystroke": "VO + Command + Escape",
          "description": "Close Window"
        },
        {
          "keystroke": "VO + Shift + C",
          "description": "Copy Last Phrase to Clipboard"
        },
        {
          "keystroke": "VO + -",
          "description": "Decrease System Volume"
        },
        {
          "keystroke": "VO + Command + 0",
          "description": "Describe Item at Hot Spot 0"
        },
        {
          "keystroke": "VO + Command + 1",
          "description": "Describe Item at Hot Spot 1"
        },
        {
          "keystroke": "VO + Command + 2",
          "description": "Describe Item at Hot Spot 2"
        },
        {
          "keystroke": "VO + Command + 3",
          "description": "Describe Item at Hot Spot 3"
        },
        {
          "keystroke": "VO + Command + 4",
          "description": "Describe Item at Hot Spot 4"
        },
        {
          "keystroke": "VO + Command + 5",
          "description": "Describe Item at Hot Spot 5"
        },
        {
          "keystroke": "VO + Command + 6",
          "description": "Describe Item at Hot Spot 6"
        },
        {
          "keystroke": "VO + Command + 7",
          "description": "Describe Item at Hot Spot 7"
        },
        {
          "keystroke": "VO + Command + 8",
          "description": "Describe Item at Hot Spot 8"
        },
        {
          "keystroke": "VO + Command + 9",
          "description": "Describe Item at Hot Spot 9"
        },
        {
          "keystroke": "VO + Function + 5",
          "description": "Describe Item in Mouse Pointer"
        },
        {
          "keystroke": "VO + Function + 3",
          "description": "Describe Item in VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Function + 4",
          "description": "Describe Item with Keyboard Focus"
        },
        {
          "keystroke": "VO + Function + 5 + 5",
          "description": "Describe Mouse Pointer Location (from Top-Left of Screen)"
        },
        {
          "keystroke": "VO + Function + 5 + 5 + 5",
          "description": "Describe Mouse Pointer Location (from Top-Left of Window)"
        },
        {
          "keystroke": "VO + Function + 1",
          "description": "Describe Open Applications"
        },
        {
          "keystroke": "VO + Command + Function + 3 + 3",
          "description": "Describe Position of Item in VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Command + Function + 2 + 2",
          "description": "Describe Position of Window"
        },
        {
          "keystroke": "VO + Command + Function + 3",
          "description": "Describe Size of Item in VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Command + Function + 2",
          "description": "Describe Size of Window"
        },
        {
          "keystroke": "VO + Function + 2",
          "description": "Describe Window"
        },
        {
          "keystroke": "VO + Shift + Space + Space",
          "description": "Double Click Mouse"
        },
        {
          "keystroke": "VO + >",
          "description": "Drop Marked Item after VoiceOver Cursor"
        },
        {
          "keystroke": "VO + <",
          "description": "Drop Marked Item before VoiceOver Cursor"
        },
        {
          "keystroke": "VO + .",
          "description": "Drop Marked Item on VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Escape",
          "description": "Escape"
        },
        {
          "keystroke": "VO + F",
          "description": "Find"
        },
        {
          "keystroke": "VO + Command + Q",
          "description": "Find Next Block Quote"
        },
        {
          "keystroke": "VO + Command + W",
          "description": "Find Next Block Quote Same Level"
        },
        {
          "keystroke": "VO + Command + B",
          "description": "Find Next Bold Text"
        },
        {
          "keystroke": "VO + Command + K",
          "description": "Find Next Color Change"
        },
        {
          "keystroke": "VO + Command + Y",
          "description": "Find Next Color Column"
        },
        {
          "keystroke": "VO + Command + J",
          "description": "Find Next Color Control"
        },
        {
          "keystroke": "VO + Command + Y",
          "description": "Find Next Column"
        },
        {
          "keystroke": "VO + Command + D",
          "description": "Find Next Different Item"
        },
        {
          "keystroke": "VO + Command + O",
          "description": "Find Next Font Change"
        },
        {
          "keystroke": "VO + Command + F",
          "description": "Find Next Frame"
        },
        {
          "keystroke": "VO + Command + H",
          "description": "Find Next Heading"
        },
        {
          "keystroke": "VO + Command + M",
          "description": "Find Next Heading Same Level"
        },
        {
          "keystroke": "VO + Command + G",
          "description": "Find Next Image"
        },
        {
          "keystroke": "VO + Command + I",
          "description": "Find Next Italic Text"
        },
        {
          "keystroke": "VO + Command + S",
          "description": "Find Next Item or Text with Same Attributes"
        },
        {
          "keystroke": "VO + Command + N",
          "description": "Find Next Landmark"
        },
        {
          "keystroke": "VO + Command + L",
          "description": "Find Next Link"
        },
        {
          "keystroke": "VO + Command + X",
          "description": "Find Next List"
        },
        {
          "keystroke": "VO + Command + E",
          "description": "Find Next Misspelled Word"
        },
        {
          "keystroke": "VO + Command + P",
          "description": "Find Next Plain Text"
        },
        {
          "keystroke": "VO + G",
          "description": "Find Next Searched Text"
        },
        {
          "keystroke": "VO + Down Arrow",
          "description": "Find Next Searched Text in History"
        },
        {
          "keystroke": "VO + Command + T",
          "description": "Find Next Table"
        },
        {
          "keystroke": "VO + Command + C",
          "description": "Find Next Text with Different Attributes"
        },
        {
          "keystroke": "VO + Command + U",
          "description": "Find Next Underlined Text"
        },
        {
          "keystroke": "VO + Command + V",
          "description": "Find Next Visited Link"
        },
        {
          "keystroke": "VO + Command + Shift + Q",
          "description": "Find Previous Block Quote"
        },
        {
          "keystroke": "VO + Command + Shift + W",
          "description": "Find Previous Block Quote Same Level"
        },
        {
          "keystroke": "VO + Command + Shift + B",
          "description": "Find Previous Bold Text"
        },
        {
          "keystroke": "VO + Command + Shift + K",
          "description": "Find Previous Color Change"
        },
        {
          "keystroke": "VO + Command + Shift + Y",
          "description": "Find Previous Column"
        },
        {
          "keystroke": "VO + Command + Shift + J",
          "description": "Find Previous Control"
        },
        {
          "keystroke": "VO + Command + Shift + D",
          "description": "Find Previous Different Item"
        },
        {
          "keystroke": "VO + Command + Shift + O",
          "description": "Find Previous Font Change"
        },
        {
          "keystroke": "VO + Command + Shift + F",
          "description": "Find Previous Frame"
        },
        {
          "keystroke": "VO + Command + Shift + H",
          "description": "Find Previous Heading"
        },
        {
          "keystroke": "VO + Command + Shift + M",
          "description": "Find Previous Heading Same Level"
        },
        {
          "keystroke": "VO + Command + Shift + G",
          "description": "Find Previous Image"
        },
        {
          "keystroke": "VO + Command + Shift + I",
          "description": "Find Previous Italic Text"
        },
        {
          "keystroke": "VO + Command + Shift + S",
          "description": "Find Previous Item or Text with Same Attributes"
        },
        {
          "keystroke": "VO + Command + Shift + N",
          "description": "Find Previous Landmark"
        },
        {
          "keystroke": "VO + Command + Shift + L",
          "description": "Find Previous Link"
        },
        {
          "keystroke": "VO + Command + Shift + X",
          "description": "Find Previous List"
        },
        {
          "keystroke": "VO + Command + Shift + E",
          "description": "Find Previous Misspelled Word"
        },
        {
          "keystroke": "VO + Command + Shift + P",
          "description": "Find Previous Plain Text"
        },
        {
          "keystroke": "VO + Shift + G",
          "description": "Find Previous Searched Text"
        },
        {
          "keystroke": "VO + Up Arrow + F",
          "description": "Find Previous Searched Text in History"
        },
        {
          "keystroke": "VO + Command + Shift + T",
          "description": "Find Previous Table"
        },
        {
          "keystroke": "VO + Command + Shift + C",
          "description": "Find Previous Text with Different Attributes"
        },
        {
          "keystroke": "VO + Command + Shift + U",
          "description": "Find Previous Underlined Text"
        },
        {
          "keystroke": "VO + Command + Shift + V",
          "description": "Find Previous Visited Link"
        },
        {
          "keystroke": "VO + Return",
          "description": "Find Text Entered in Search Field"
        },
        {
          "keystroke": "VO + Page Down",
          "description": "Go Down One Page"
        },
        {
          "keystroke": "VO + Shift + Left Arrow",
          "description": "Go Left a Bit"
        },
        {
          "keystroke": "VO + Shift + Page Up",
          "description": "Go Left One Page"
        },
        {
          "keystroke": "VO + Shift + Right Arrow",
          "description": "Go Right a Bit"
        },
        {
          "keystroke": "VO + Shift + Page Down",
          "description": "Go Right One Page"
        },
        {
          "keystroke": "VO + Home",
          "description": "Go to Beginning"
        },
        {
          "keystroke": "VO + Command + End",
          "description": "Go to Bottom of Window"
        },
        {
          "keystroke": "VO + Shift + D",
          "description": "Go to Desktop"
        },
        {
          "keystroke": "VO + D",
          "description": "Go to Dock"
        },
        {
          "keystroke": "VO + End",
          "description": "Go to End"
        },
        {
          "keystroke": "VO + J",
          "description": "Go to Linked Item"
        },
        {
          "keystroke": "VO + M",
          "description": "Go to Menu Bar"
        },
        {
          "keystroke": "VO + Command + ]",
          "description": "Go to Next Custom Window Spot"
        },
        {
          "keystroke": "VO + ]",
          "description": "Go to Next Window Spot"
        },
        {
          "keystroke": "VO + Shift + J",
          "description": "Go to Popup Item"
        },
        {
          "keystroke": "VO + Command + [",
          "description": "Go to Previous Custom Window Spot"
        },
        {
          "keystroke": "VO + [",
          "description": "Go to Previous Window Spot"
        },
        {
          "keystroke": "VO + M + M",
          "description": "Go to Status Menus"
        },
        {
          "keystroke": "VO + Command + Home",
          "description": "Go to Top of Window"
        },
        {
          "keystroke": "VO + Shift + Home",
          "description": "Go to Visible Beginning"
        },
        {
          "keystroke": "VO + Shift + End",
          "description": "Go to Visible End"
        },
        {
          "keystroke": "VO + Page Up",
          "description": "Go Up One Page"
        },
        {
          "keystroke": "VO + Tab",
          "description": "Ignore Next Keypress"
        },
        {
          "keystroke": "VO + =",
          "description": "Increase System volume"
        },
        {
          "keystroke": "VO + Caps Lock + S",
          "description": "Interact with Scroll Bar"
        },
        {
          "keystroke": "VO + Vertical Bar",
          "description": "Item Chooser"
        },
        {
          "keystroke": "VO + Vertical Bar",
          "description": "Jump to Header"
        },
        {
          "keystroke": "VO + 0",
          "description": "Jump to Item at Hot Spot 0"
        },
        {
          "keystroke": "VO + 1",
          "description": "Jump to Item at Hot Spot 1"
        },
        {
          "keystroke": "VO + 2",
          "description": "Jump to Item at Hot Spot 2"
        },
        {
          "keystroke": "VO + 3",
          "description": "Jump to Item at Hot Spot 3"
        },
        {
          "keystroke": "VO + 4",
          "description": "Jump to Item at Hot Spot 4"
        },
        {
          "keystroke": "VO + 5",
          "description": "Jump to Item at Hot Spot 5"
        },
        {
          "keystroke": "VO + 6",
          "description": "Jump to Item at Hot Spot 6"
        },
        {
          "keystroke": "VO + 7",
          "description": "Jump to Item at Hot Spot 7"
        },
        {
          "keystroke": "VO + 8",
          "description": "Jump to Item at Hot Spot 8"
        },
        {
          "keystroke": "VO + 9",
          "description": "Jump to Item at Hot Spot 9"
        },
        {
          "keystroke": "VO + Caps Lock + Escape",
          "description": "Jump to Top Level"
        },
        {
          "keystroke": "VO + K",
          "description": "Keyboard Help"
        },
        {
          "keystroke": "VO + /",
          "description": "Label Item"
        },
        {
          "keystroke": "VO + ,",
          "description": "Mark Item to Drag and Drop"
        },
        {
          "keystroke": "VO + Command + )",
          "description": "Monitor Item at Hot Spot 0"
        },
        {
          "keystroke": "VO + Command + !",
          "description": "Monitor Item at Hot Spot 1"
        },
        {
          "keystroke": "VO + Command + @",
          "description": "Monitor Item at Hot Spot 2"
        },
        {
          "keystroke": "VO + Command + #",
          "description": "Monitor Item at Hot Spot 3"
        },
        {
          "keystroke": "VO + Command + $",
          "description": "Monitor Item at Hot Spot 4"
        },
        {
          "keystroke": "VO + Command + %",
          "description": "Monitor Item at Hot Spot 5"
        },
        {
          "keystroke": "VO + Command + ^",
          "description": "Monitor Item at Hot Spot 6"
        },
        {
          "keystroke": "VO + Command + &",
          "description": "Monitor Item at Hot Spot 7"
        },
        {
          "keystroke": "VO + Command + *",
          "description": "Monitor Item at Hot Spot 8"
        },
        {
          "keystroke": "VO + Command + (",
          "description": "Monitor Item at Hot Spot 9"
        },
        {
          "keystroke": "VO + Command + /",
          "description": "More Content"
        },
        {
          "keystroke": "VO + Command + Shift + Space",
          "description": "Mouse Down"
        },
        {
          "keystroke": "VO + Command + Shift + Space",
          "description": "Mouse Up"
        },
        {
          "keystroke": "VO + Shift + Down Arrow",
          "description": "Move Down a Bit"
        },
        {
          "keystroke": "VO + Command + Down Arrow",
          "description": "Move Down in Rotor"
        },
        {
          "keystroke": "VO + 8",
          "description": "Move Item to Bottom Center Section"
        },
        {
          "keystroke": "VO + 7",
          "description": "Move Item to Bottom Left Section"
        },
        {
          "keystroke": "VO + 9",
          "description": "Move Item to Bottom Right Section"
        },
        {
          "keystroke": "VO + 5",
          "description": "Move Item to Middle Center Section"
        },
        {
          "keystroke": "VO + 4",
          "description": "Move Item to Middle Left Section"
        },
        {
          "keystroke": "VO + 6",
          "description": "Move Item to Middle Right Section"
        },
        {
          "keystroke": "VO + 2",
          "description": "Move Item to Top Center Section"
        },
        {
          "keystroke": "VO + 1",
          "description": "Move Item to Top Left Section"
        },
        {
          "keystroke": "VO + 3",
          "description": "Move Item to Top Right Section"
        },
        {
          "keystroke": "VO + Command + Function + 5",
          "description": "Move Keyboard Focus to VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Left Arrow",
          "description": "Move Left"
        },
        {
          "keystroke": "VO + Command + Function + 4",
          "description": "Move Mouse Pointer to VoiceOver Cursor"
        },
        {
          "keystroke": "VO + }",
          "description": "Move to Next Hot Spot"
        },
        {
          "keystroke": "VO + Command + \\",
          "description": "Move to Parent Row"
        },
        {
          "keystroke": "VO + {",
          "description": "Move to Previous Hot Spot"
        },
        {
          "keystroke": "VO + Up Arrow",
          "description": "Move Up"
        },
        {
          "keystroke": "VO + Command + Up Arrow",
          "description": "Move Up in Rotor"
        },
        {
          "keystroke": "VO + Function + $",
          "description": "Move VoiceOver Cursor to Keyboard Focus"
        },
        {
          "keystroke": "VO + Function + %",
          "description": "Move VoiceOver Cursor to Mouse Pointer"
        },
        {
          "keystroke": "VO + X",
          "description": "Open Activity Chooser"
        },
        {
          "keystroke": "VO + H + H",
          "description": "Open Commands Menu"
        },
        {
          "keystroke": "VO + Shift + O",
          "description": "Open Control Center"
        },
        {
          "keystroke": "VO + Shift + F",
          "description": "Open Find Commands Menu"
        },
        {
          "keystroke": "VO + Shift + X",
          "description": "Open Hot Spots Chooser"
        },
        {
          "keystroke": "VO + Command + Shift + Right Arrow",
          "description": "Open Next Speech Attribute Guide"
        },
        {
          "keystroke": "VO + O",
          "description": "Open Notification Center"
        },
        {
          "keystroke": "VO + Command + Shift + Left Arrow",
          "description": "Open Previous Speech Attribute Guide"
        },
        {
          "keystroke": "VO + Command + Function + 8",
          "description": "Open Quick Start Tutorial"
        },
        {
          "keystroke": "VO + Shift + M",
          "description": "Open Shortcut Menu"
        },
        {
          "keystroke": "VO + N + N",
          "description": "Open the Announcement History Menu"
        },
        {
          "keystroke": "VO + N",
          "description": "Open the Notifications Menu"
        },
        {
          "keystroke": "VO + V",
          "description": "Open Verbosity Rotor"
        },
        {
          "keystroke": "VO + H",
          "description": "Open VoiceOver Help Menu"
        },
        {
          "keystroke": "VO + Function + 8",
          "description": "Open VoiceOver Utility"
        },
        {
          "keystroke": "VO + Space",
          "description": "Perform Action for Item"
        },
        {
          "keystroke": "VO + X + X",
          "description": "Previous Activity"
        },
        {
          "keystroke": "VO + C + C",
          "description": "Read Column Description from Current Cell"
        },
        {
          "keystroke": "VO + A",
          "description": "Read Contents of VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Shift + W",
          "description": "Read Contents of Window"
        },
        {
          "keystroke": "VO + C",
          "description": "Read Current Character"
        },
        {
          "keystroke": "VO + C + C",
          "description": "Read Current Character Phonetically"
        },
        {
          "keystroke": "VO + W + W",
          "description": "Read Current Item Alphabetically"
        },
        {
          "keystroke": "VO + W + W + W",
          "description": "Read Current Item Phonetically"
        },
        {
          "keystroke": "VO + L",
          "description": "Read Current Line"
        },
        {
          "keystroke": "VO + P",
          "description": "Read Current Paragraph"
        },
        {
          "keystroke": "VO + S",
          "description": "Read Current Sentence"
        },
        {
          "keystroke": "VO + W",
          "description": "Read Current Word"
        },
        {
          "keystroke": "VO + W + W",
          "description": "Read Current Word Alphabetically"
        },
        {
          "keystroke": "VO + W + W + W",
          "description": "Read Current Word Phonetically"
        },
        {
          "keystroke": "VO + B",
          "description": "Read from Beginning to VoiceOver Cursor"
        },
        {
          "keystroke": "VO + C",
          "description": "Read Header Description"
        },
        {
          "keystroke": "VO + Shift + H",
          "description": "Read Help Tag for Item"
        },
        {
          "keystroke": "VO + Shift + L",
          "description": "Read Image Description for Item"
        },
        {
          "keystroke": "VO + Shift + Right Arrow",
          "description": "Read Next Character"
        },
        {
          "keystroke": "VO + Down Arrow",
          "description": "Read Next Line"
        },
        {
          "keystroke": "VO + Shift + Page Down",
          "description": "Read Next Paragraph"
        },
        {
          "keystroke": "VO + Command + Page Down",
          "description": "Read Next Sentence"
        },
        {
          "keystroke": "VO + Right Arrow",
          "description": "Read Next Word"
        },
        {
          "keystroke": "VO + Shift + Left Arrow",
          "description": "Read Previous Character"
        },
        {
          "keystroke": "VO + Up Arrow",
          "description": "Read Previous Line"
        },
        {
          "keystroke": "VO + Shift + Page Up",
          "description": "Read Previous Paragraph"
        },
        {
          "keystroke": "VO + Command + Page Up",
          "description": "Read Previous Sentence"
        },
        {
          "keystroke": "VO + Left Arrow",
          "description": "Read Previous Word"
        },
        {
          "keystroke": "VO + Shift + T",
          "description": "Read Row and Column Numbers"
        },
        {
          "keystroke": "VO + R + R",
          "description": "Read Row Description from Current Cell"
        },
        {
          "keystroke": "VO + R",
          "description": "Read Row Header Description"
        },
        {
          "keystroke": "VO + Function + 6",
          "description": "Read Selected Text or Item"
        },
        {
          "keystroke": "VO + Shift + T + T",
          "description": "Read Table Dimensions"
        },
        {
          "keystroke": "VO + T",
          "description": "Read Text Attributes"
        },
        {
          "keystroke": "VO + W",
          "description": "Read Visible Text"
        },
        {
          "keystroke": "VO + Shift + N",
          "description": "Read VoiceOver Hint"
        },
        {
          "keystroke": "VO + Command + {",
          "description": "Remove from Window Spots"
        },
        {
          "keystroke": "VO + Z",
          "description": "Repeat Last Phrase"
        },
        {
          "keystroke": "VO + Command + Left Arrow",
          "description": "Rotate Left"
        },
        {
          "keystroke": "VO + Command + Right Arrow",
          "description": "Rotate Right"
        },
        {
          "keystroke": "VO + U",
          "description": "Rotor"
        },
        {
          "keystroke": "VO + Shift + Z",
          "description": "Save Last Phrase to Desktop as Audio File"
        },
        {
          "keystroke": "VO + )",
          "description": "Save or Remove Item at Hot Spot 0"
        },
        {
          "keystroke": "VO + !",
          "description": "Save or Remove Item at Hot Spot 1"
        },
        {
          "keystroke": "VO + @",
          "description": "Save or Remove Item at Hot Spot 2"
        },
        {
          "keystroke": "VO + #",
          "description": "Save or Remove Item at Hot Spot 3"
        },
        {
          "keystroke": "VO + $",
          "description": "Save or Remove Item at Hot Spot 4"
        },
        {
          "keystroke": "VO + %",
          "description": "Save or Remove Item at Hot Spot 5"
        },
        {
          "keystroke": "VO + ^",
          "description": "Save or Remove Item at Hot Spot 6"
        },
        {
          "keystroke": "VO + &",
          "description": "Save or Remove Item at Hot Spot 7"
        },
        {
          "keystroke": "VO + *",
          "description": "Save or Remove Item at Hot Spot 8"
        },
        {
          "keystroke": "VO + (",
          "description": "Save or Remove Item at Hot Spot 9"
        },
        {
          "keystroke": "VO + Return",
          "description": "Select Item"
        },
        {
          "keystroke": "VO + Command + Shift + Down Arrow",
          "description": "Select Next Option Down in Speech Attribute Guide"
        },
        {
          "keystroke": "VO + Command + Shift + Up Arrow",
          "description": "Select Next Option Up in Speech Attribute Guide"
        },
        {
          "keystroke": "VO + Shift + A",
          "description": "Select Text in VoiceOver Cursor"
        },
        {
          "keystroke": "VO + Command + }",
          "description": "Set as a Window Spot"
        },
        {
          "keystroke": "VO + Command + Function + 9",
          "description": "Show or Hide the Braille Window"
        },
        {
          "keystroke": "VO + Command + Function + 0",
          "description": "Show or Hide the Caption Window"
        },
        {
          "keystroke": "VO + Command + Function + -",
          "description": "Show or Hide VoiceOver Visuals"
        },
        {
          "keystroke": "VO + Function + 7",
          "description": "Speak the Time and Date"
        },
        {
          "keystroke": "VO + Function + 7 + 7 + 7",
          "description": "Speak Wifi Status"
        },
        {
          "keystroke": "VO + Shift + Down Arrow",
          "description": "Start Interacting with Item"
        },
        {
          "keystroke": "VO + Command + `",
          "description": "Start Moving Item"
        },
        {
          "keystroke": "VO + `",
          "description": "Start Moving Window"
        },
        {
          "keystroke": "VO + Command + ~",
          "description": "Start Resizing Item"
        },
        {
          "keystroke": "VO + ~",
          "description": "Start Resizing Window"
        },
        {
          "keystroke": "VO + Shift + Up Arrow",
          "description": "Stop Interacting with Item"
        },
        {
          "keystroke": "VO + Function + 0",
          "description": "Tile Visuals"
        },
        {
          "keystroke": "VO + Shift + Q",
          "description": "Toggle Arrow-Key Quick Nav On or Off"
        },
        {
          "keystroke": "VO + Y",
          "description": "Toggle Braille Keyboard Input On or Off"
        },
        {
          "keystroke": "VO + Function + #",
          "description": "Toggle Cursor Tracking On or Off"
        },
        {
          "keystroke": "VO + \\",
          "description": "Toggle Disclosure Triangle Open or Closed"
        },
        {
          "keystroke": "VO + Shift + Y",
          "description": "Toggle Keyboard Braille Access"
        },
        {
          "keystroke": "VO + Command + Return",
          "description": "Toggle Multiple Selection On or Off"
        },
        {
          "keystroke": "VO + Clear",
          "description": "Toggle NumPad Key Commands On or Off"
        },
        {
          "keystroke": "VO + Shift + K",
          "description": "Toggle Option Key Commands On or Off"
        },
        {
          "keystroke": "VO + Function + _",
          "description": "Toggle Screen Curtain On or Off"
        },
        {
          "keystroke": "VO + Q",
          "description": "Toggle Single-Key Quick Nav On or Off"
        },
        {
          "keystroke": "VO + Command + =",
          "description": "Toggle Table Interactability"
        },
        {
          "keystroke": "VO + ;",
          "description": "Toggle the VO Modifier Lock On or Off"
        },
        {
          "keystroke": "VO + ?",
          "description": "User Guide"
        },
        {
          "keystroke": "VO + Function + 2 + 2",
          "description": "Window Chooser"
        }
      ]
    },
    {
      "app": "Orca",
      "appId": "screenreader.orca",
      "note": "Orca Modifier key (OM) is Insert by default - assumes Desktop keyboard layout",
      "manualUrl": "https://gnome.pages.gitlab.gnome.org/orca/help/index.html",
      "commands": [
        {
          "keystroke": "Super + Alt + S",
          "description": "Toggle Orca on and off (GNOME)"
        },
        {
          "keystroke": "OM + Space",
          "description": "Open Orca preferences"
        },
        {
          "keystroke": "Ctrl + OM + Space",
          "description": "Open Orca preferences for the current application"
        },
        {
          "keystroke": "OM + H",
          "description": "Enter Learn mode"
        },
        {
          "keystroke": "F2",
          "description": "List Orca-wide shortcuts (Learn mode)"
        },
        {
          "keystroke": "F3",
          "description": "List shortcuts for the focused application (Learn mode)"
        },
        {
          "keystroke": "Escape",
          "description": "Exit Learn mode"
        },
        {
          "keystroke": "OM + Backspace",
          "description": "Bypass the next command (send it to the application)"
        },
        {
          "keystroke": "Caps Lock twice quickly",
          "description": "Lock or unlock Caps Lock (Laptop layout)"
        },
        {
          "keystroke": "Left Arrow",
          "description": "Read the previous character"
        },
        {
          "keystroke": "Right Arrow",
          "description": "Read the next character"
        },
        {
          "keystroke": "Ctrl + Left Arrow",
          "description": "Read the previous word"
        },
        {
          "keystroke": "Ctrl + Right Arrow",
          "description": "Read the next word"
        },
        {
          "keystroke": "Up Arrow",
          "description": "Read the previous line"
        },
        {
          "keystroke": "Down Arrow",
          "description": "Read the next line"
        },
        {
          "keystroke": "Shift",
          "description": "Hold with a reading command to select or unselect text"
        },
        {
          "keystroke": "F7",
          "description": "Toggle caret navigation (many GNOME applications)"
        },
        {
          "keystroke": "OM + F",
          "description": "Present text attributes of the current object"
        },
        {
          "keystroke": "OM + Z",
          "description": "Toggle structural navigation"
        },
        {
          "keystroke": "OM + F11",
          "description": "Toggle cell and row reading for the current table"
        },
        {
          "keystroke": "OM + R",
          "description": "Set the current row as column headers (double-tap to clear)"
        },
        {
          "keystroke": "OM + C",
          "description": "Set the current column as row headers (double-tap to clear)"
        },
        {
          "keystroke": "Tab",
          "description": "Move to the next focusable object"
        },
        {
          "keystroke": "Shift + Tab",
          "description": "Move to the previous focusable object"
        },
        {
          "keystroke": "OM + A",
          "description": "Switch from focus mode to browse mode"
        },
        {
          "keystroke": "Num Pad Delete",
          "description": "Open Orca Find (Desktop layout)"
        },
        {
          "keystroke": "OM + Left Bracket",
          "description": "Open Orca Find (Laptop layout)"
        }
      ]
    }
  ];

  // web/aria-live.js
  var POLITE_REGION_ID = "js-global-screen-reader-notice";
  var ASSERTIVE_REGION_ID = "js-global-screen-reader-notice-assertive";
  var SR_ONLY_STYLE = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
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
  function announce(message, options) {
    if (typeof document === "undefined") return;
    const assertive = options ? options.assertive : false;
    const element = options ? options.element : void 0;
    const container = element || ensureRegion(
      assertive ? ASSERTIVE_REGION_ID : POLITE_REGION_ID,
      assertive ? "assertive" : "polite"
    );
    if (!container) return;
    container.textContent = container.textContent === message ? `${message}\xA0` : message;
  }

  // web/announce-results.js
  var FILTER_ANNOUNCE_DEBOUNCE_MS = 300;
  function resultsLabel(count) {
    return `${count} shortcuts`;
  }
  function createResultsAnnouncer(options) {
    const getCount = options.getCount;
    const isFiltering2 = options.isFiltering;
    const speak = options.announce || announce;
    const debounceMs = typeof options.debounceMs === "number" ? options.debounceMs : FILTER_ANNOUNCE_DEBOUNCE_MS;
    let timer;
    function schedule() {
      if (timer !== void 0) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = void 0;
        if (!isFiltering2()) return;
        speak(resultsLabel(getCount()));
      }, debounceMs);
    }
    function cancel() {
      if (timer !== void 0) clearTimeout(timer);
      timer = void 0;
    }
    return { schedule, cancel };
  }

  // web/demo.js
  var MOD_SYMBOL = {
    command: "\u2318",
    control: "\u2303",
    option: "\u2325",
    shift: "\u21E7",
    function: "fn",
    super: "\u2318"
  };
  var searchInput = document.getElementById("search");
  var searchClear = document.getElementById("search-clear");
  var chordInput = document.getElementById("chord");
  var chordClear = document.getElementById("chord-clear");
  var resultsEl = document.getElementById("results");
  var countEl = document.getElementById("count");
  var copiedEl = document.getElementById("copied");
  var expandButton = document.getElementById("expand");
  var readers = [];
  var allShortcuts = [];
  var textQuery = "";
  var chord = null;
  var collapsedSections = /* @__PURE__ */ new Set();
  var heldKeys = /* @__PURE__ */ new Map();
  var fnHeld = false;
  var chordEscapePresses = 0;
  var chordShiftTabPresses = 0;
  function flatten(groups) {
    return groups.flatMap(
      (group) => group.commands.map((command) => ({
        appId: group.appId,
        appName: group.app,
        comboLabel: command.keystroke,
        description: command.description,
        key: "",
        modifiers: []
      }))
    );
  }
  function visibleShortcuts() {
    return filterShortcutsByChord(filterShortcutsByText(allShortcuts, textQuery), chord);
  }
  function isFiltering() {
    return textQuery.length > 0 || chord !== null;
  }
  var resultsAnnouncer = createResultsAnnouncer({
    getCount: () => visibleShortcuts().length,
    isFiltering
  });
  function escapeHtml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var READER_SYMBOLS = {
    Ctrl: "\u2303",
    Shift: "\u21E7",
    "Caps Lock": "\u21EA",
    Escape: "\u238B",
    Tab: "\u21E5",
    Delete: "\u2326",
    Backspace: "\u232B",
    Spacebar: "\u2423",
    Insert: "Ins",
    Windows: "Win",
    "Page Up": "PgUp",
    "Page Down": "PgDn",
    "Left Arrow": "\u2190",
    "Right Arrow": "\u2192",
    "Up Arrow": "\u2191",
    "Down Arrow": "\u2193",
    "Left Bracket": "[",
    "Right Bracket": "]",
    Apostrophe: "'",
    Comma: ",",
    Period: ".",
    Semicolon: ";",
    Dash: "-",
    Enter: "\u2324",
    Slash: "/",
    Equals: "=",
    Plus: "+",
    Minus: "-",
    Backslash: "\\",
    "Num Pad Minus": "Num Pad -",
    "Num Pad Plus": "Num Pad +",
    "Num Pad Slash": "Num Pad /",
    "Num Pad Star": "Num Pad *",
    "Num Pad Delete": "Num Pad \u232B",
    "Num Pad Enter": "Num Pad \u2324"
  };
  var READER_SYMBOL_RE = new RegExp(
    `(?<=^| \\+ |, then | through )(?:${Object.keys(READER_SYMBOLS).sort((a, b) => b.length - a.length).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$| \\+ |,| twice)`,
    "g"
  );
  function symbolizeReaderLabel(label) {
    return label.replace(READER_SYMBOL_RE, (m) => {
      var _a;
      return (_a = READER_SYMBOLS[m]) != null ? _a : m;
    }).replace(/ through /g, "\u2013");
  }
  var VOICEOVER_SYMBOLS = {
    Command: "\u2318",
    Space: "\u2423",
    Shift: "\u21E7",
    "Caps Lock": "\u21EA",
    Function: "fn",
    Escape: "\u238B",
    Return: "\u23CE",
    Home: "\u2196",
    End: "\u2198",
    "Page Up": "\u21DE",
    "Page Down": "\u21DF",
    Tab: "\u21E5",
    "Vertical Bar": "|",
    Clear: "clear",
    "Left Arrow": "\u2190",
    "Right Arrow": "\u2192",
    "Up Arrow": "\u2191",
    "Down Arrow": "\u2193"
  };
  function symbolizeReaderToken(token, appName) {
    var _a;
    if (appName === "VoiceOver") return (_a = VOICEOVER_SYMBOLS[token]) != null ? _a : token;
    return symbolizeReaderLabel(token);
  }
  var wrapKbd = (token) => `<kbd>${token}</kbd>`;
  function tokenizeKeystrokeLabel(label, wrapKey) {
    return label.split(", then ").map((step) => {
      let core = step;
      let twice = "";
      if (/(?: \+ | )twice quickly$/.test(core)) {
        core = core.replace(/(?: \+ | )twice quickly$/, "");
        twice = ", twice quickly";
      }
      const keys = core.split(" + ").filter((token) => token.length > 0).map(wrapKey).join(" + ");
      return keys + twice;
    }).join(", then ");
  }
  function comboKbdHtml(keystroke) {
    return tokenizeKeystrokeLabel(keystroke, wrapKbd);
  }
  function comboVisualHtml(keystroke, appName) {
    return tokenizeKeystrokeLabel(keystroke, (token) => wrapKbd(symbolizeReaderToken(token, appName)));
  }
  function renderCombo(label, appName) {
    const body = label.split(", then ").map((step) => {
      let core = step;
      let twice = "";
      if (/(?: \+ | )twice quickly$/.test(core)) {
        core = core.replace(/(?: \+ | )twice quickly$/, "");
        twice = '<span class="seq-sep">, twice quickly</span>';
      }
      return core.split(" + ").filter((token) => token.length > 0).map((token) => `<kbd class="kbd-text">${escapeHtml(symbolizeReaderToken(token, appName))}</kbd>`).join('<span class="kbd-plus">&emsp14;+&emsp14;</span>') + twice;
    }).join('<span class="seq-sep">, then</span>');
    return `<div class="kbd-seq">${body}</div>`;
  }
  function chordLabel(current) {
    if (!current) return "";
    const parts = current.modifiers.map((m) => {
      var _a;
      return (_a = MOD_SYMBOL[m]) != null ? _a : m;
    });
    if (current.key) parts.push(current.key);
    return parts.join(" ");
  }
  function render() {
    const visible = visibleShortcuts();
    const visibleIds = new Set(visible.map((sc) => sc.appId + "|" + sc.comboLabel + "|" + sc.description));
    const rendered = readers.map((group) => ({
      group,
      rows: group.commands.filter(
        (command) => visibleIds.has(group.appId + "|" + command.keystroke + "|" + command.description)
      )
    })).filter((entry) => entry.rows.length > 0);
    const sections = rendered.map(({ group, rows }, index) => {
      const items = rows.map((command) => {
        const combo = escapeHtml(command.keystroke);
        const comboKbd = escapeHtml(comboKbdHtml(command.keystroke));
        const comboVisual = escapeHtml(comboVisualHtml(command.keystroke, group.app));
        const label = escapeHtml(`${command.keystroke}. ${command.description}.`);
        return `<li class="row">
              <div
                class="row-button"
                role="button"
                tabindex="0"
                data-combo="${combo}"
                data-combo-kbd="${comboKbd}"
                data-combo-visual="${comboVisual}"
                aria-label="${label}"
              >
                ${renderCombo(command.keystroke, group.app)}
                <span class="desc">${escapeHtml(command.description)}</span>
              </div>
            </li>`;
      }).join("");
      const nextId = `h-${rendered[(index + 1) % rendered.length].group.appId}`;
      const isLast = index === rendered.length - 1;
      const skipLabel = isLast ? "Jump to first section" : "Jump to next section";
      const open = collapsedSections.has(group.appId) && !isFiltering() ? "" : " open";
      return `<details class="segment"${open} data-app-id="${escapeHtml(group.appId)}" aria-labelledby="h-${group.appId}">
          <summary class="segment-head">
            <span class="caret" aria-hidden="true"></span>
            <h2 class="segment-title" id="h-${group.appId}">${escapeHtml(group.app)}</h2>
            <span class="count">${rows.length}</span>
          </summary>
          <div class="reader-meta">
            <div class="reader-note">${escapeHtml(group.note)} \xB7 Sourced from <a class="manual-link" href="${escapeHtml(group.manualUrl)}" rel="noreferrer">the manual</a></div>
            <div class="reader-skip"><a class="skip-next" href="#${nextId}">${skipLabel}</a></div>
          </div>
          <ul class="rows">${items}</ul>
        </details>`;
    }).join("");
    resultsEl.innerHTML = sections || `<p class="empty">No shortcuts match the current filter.</p>`;
    countEl.textContent = resultsLabel(visible.length);
  }
  function syncClearButtons() {
    searchClear.hidden = textQuery.length === 0;
    chordClear.hidden = chord === null;
  }
  function setTextQuery(value) {
    textQuery = value;
    syncClearButtons();
    render();
  }
  searchInput.addEventListener("input", () => {
    setTextQuery(searchInput.value);
    resultsAnnouncer.schedule();
  });
  searchClear.addEventListener("click", () => {
    searchInput.value = "";
    setTextQuery("");
    searchInput.focus();
  });
  async function copyText(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "absolute";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
  function copyModeFor(event) {
    if (event.ctrlKey) return "kbd";
    if (event.shiftKey) return "visual";
    return "plain";
  }
  var copiedTimer = null;
  function showCopied(message) {
    copiedEl.textContent = message;
    copiedEl.classList.add("show");
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => copiedEl.classList.remove("show"), 2500);
  }
  var pressedRow = null;
  var pressTimer = null;
  var PRESS_EFFECT_MS = 120;
  function playPress(row) {
    if (pressTimer) clearTimeout(pressTimer);
    if (pressedRow && pressedRow !== row) pressedRow.classList.remove("pressed");
    pressedRow = row;
    row.classList.add("pressed");
    pressTimer = setTimeout(() => {
      row.classList.remove("pressed");
      pressedRow = null;
      pressTimer = null;
    }, PRESS_EFFECT_MS);
  }
  async function activateRow(button, mode) {
    const combo = mode === "kbd" ? button.dataset.comboKbd : mode === "visual" ? button.dataset.comboVisual : button.dataset.combo;
    if (!combo) return;
    const ok = await copyText(combo);
    announce("Shortcut copied to clipboard.");
    showCopied(ok ? `Copied: ${combo}` : `Copy manually: ${combo}`);
    const row = button.closest(".row");
    if (row) playPress(row);
  }
  resultsEl.addEventListener("click", (event) => {
    const button = event.target.closest(".row-button");
    if (button) activateRow(button, copyModeFor(event));
  });
  resultsEl.addEventListener("contextmenu", (event) => {
    if (!event.ctrlKey) return;
    const button = event.target.closest(".row-button");
    if (!button) return;
    event.preventDefault();
    activateRow(button, "kbd");
  });
  resultsEl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
    const button = event.target.closest(".row-button");
    if (!button) return;
    event.preventDefault();
    activateRow(button, copyModeFor(event));
  });
  expandButton.addEventListener("click", () => {
    const ids = [...resultsEl.querySelectorAll("details.segment")].map((el) => el.dataset.appId).filter(Boolean);
    if (ids.length === 0) return;
    const allExpanded = ids.every((id) => !collapsedSections.has(id));
    if (allExpanded) {
      for (const id of ids) collapsedSections.add(id);
    } else {
      collapsedSections.clear();
    }
    render();
  });
  resultsEl.addEventListener("click", (event) => {
    const summary = event.target.closest("summary");
    if (!summary) return;
    const details = summary.parentElement;
    if (!(details instanceof HTMLDetailsElement)) return;
    const id = details.dataset.appId;
    if (!id) return;
    queueMicrotask(() => {
      if (details.open) collapsedSections.delete(id);
      else collapsedSections.add(id);
    });
  });
  function heldDisplay(mods) {
    const parts = mods.map((m) => {
      var _a;
      return (_a = MOD_SYMBOL[m]) != null ? _a : m;
    });
    for (const token of heldKeys.values()) parts.push(token);
    return parts.join(" ");
  }
  function refreshChordField(mods) {
    chordInput.value = mods.length > 0 || heldKeys.size > 0 ? heldDisplay(mods) : chordLabel(chord);
  }
  function commitFromHeld(mods) {
    if (heldKeys.size > 0) {
      const keys = [...heldKeys.values()];
      chord = { key: keys[keys.length - 1], modifiers: mods };
    } else if (mods.length > 0) {
      chord = { key: "", modifiers: mods };
    } else {
      return;
    }
    syncClearButtons();
    render();
    resultsAnnouncer.schedule();
  }
  function clearChord() {
    chord = null;
    fnHeld = false;
    heldKeys.clear();
    syncClearButtons();
    refreshChordField([]);
    render();
  }
  function focusableElements() {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll(selector)].filter(
      (el) => el.tabIndex !== -1 && el.getClientRects().length > 0
    );
  }
  function focusNextFrom(current) {
    var _a, _b;
    const items = focusableElements();
    const index = items.indexOf(current);
    if (index === -1) return;
    (_b = (_a = items[index + 1]) != null ? _a : items[0]) == null ? void 0 : _b.focus();
  }
  function focusPrevFrom(current) {
    var _a, _b;
    const items = focusableElements();
    const index = items.indexOf(current);
    if (index === -1) return;
    (_b = (_a = items[index - 1]) != null ? _a : items[items.length - 1]) == null ? void 0 : _b.focus();
  }
  chordInput.addEventListener(
    "keydown",
    (event) => {
      event.preventDefault();
      const isEscape = event.key === "Escape" || event.code === "Escape";
      const isShiftTab = event.shiftKey && (event.key === "Tab" || event.code === "Tab");
      if (!event.repeat) {
        if (isEscape) {
          chordShiftTabPresses = 0;
          chordEscapePresses += 1;
          if (chordEscapePresses >= 2) {
            chordEscapePresses = 0;
            focusNextFrom(chordInput);
            return;
          }
        } else if (isShiftTab) {
          chordEscapePresses = 0;
          chordShiftTabPresses += 1;
          if (chordShiftTabPresses >= 2) {
            chordShiftTabPresses = 0;
            clearChord();
            focusPrevFrom(chordInput);
          }
          return;
        } else {
          chordEscapePresses = 0;
          chordShiftTabPresses = 0;
        }
      }
      const isFn = event.code === "Fn" || event.key === "Fn";
      if (isFn) fnHeld = true;
      const mods = modifiersFromEvent(event, fnHeld);
      if (event.repeat) {
        refreshChordField(mods);
        return;
      }
      const token = isFn ? "" : tokenFromCode(event);
      if (token && !MODIFIERS.includes(token)) heldKeys.set(event.code, token);
      commitFromHeld(mods);
      refreshChordField(mods);
    },
    true
  );
  chordInput.addEventListener(
    "keyup",
    (event) => {
      if (event.code === "Fn" || event.key === "Fn") fnHeld = false;
      heldKeys.delete(event.code);
      const mods = modifiersFromEvent(event, fnHeld);
      if (mods.length === 0) heldKeys.clear();
      refreshChordField(mods);
    },
    true
  );
  chordInput.addEventListener("blur", () => {
    fnHeld = false;
    heldKeys.clear();
    chordEscapePresses = 0;
    chordShiftTabPresses = 0;
    refreshChordField([]);
  });
  chordClear.addEventListener("click", () => {
    clearChord();
    chordInput.focus();
  });
  function init() {
    readers = [...SHORTCUT_GROUPS].sort((a, b) => a.app.localeCompare(b.app));
    allShortcuts = flatten(readers);
    syncClearButtons();
    refreshChordField([]);
    render();
  }
  init();
})();
