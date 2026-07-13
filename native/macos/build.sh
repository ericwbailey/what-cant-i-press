#!/usr/bin/env bash
# Builds the macOS Accessibility helper into resources/bin.
# Produces a universal (arm64 + x86_64) binary when both SDK slices are
# available, otherwise falls back to a native-arch build.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT="$DIR/../../resources/bin"
SRC="$DIR/ShortcutHelper.swift"
BIN="$OUT/shortcut-helper-macos"

mkdir -p "$OUT"

if swiftc -O -target arm64-apple-macos11 "$SRC" -o "$BIN.arm64" 2>/dev/null \
  && swiftc -O -target x86_64-apple-macos11 "$SRC" -o "$BIN.x86_64" 2>/dev/null; then
  lipo -create -output "$BIN" "$BIN.arm64" "$BIN.x86_64"
  rm -f "$BIN.arm64" "$BIN.x86_64"
  echo "Built universal $BIN"
else
  swiftc -O "$SRC" -o "$BIN"
  echo "Built native-arch $BIN"
fi

chmod +x "$BIN"
