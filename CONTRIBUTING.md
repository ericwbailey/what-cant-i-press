# Contributing

## Prerequisites

- Node.js 22 or newer, plus npm.
- macOS builds also need Xcode command line tools (`swiftc`) to compile the
  Swift helper.
- Windows builds need PowerShell to compile the native helper.

## Common scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the app with hot reload. |
| `npm start` | Preview the last production build (relaunch to pick up a rebuild). |
| `npm run typecheck` | Type-check the main and renderer TypeScript projects. |
| `npm run build:mac` | Build a macOS app (ad-hoc signed). |
| `npm run build:win` | Build a Windows app. |

## Persistent local permissions (macOS)

macOS ties an Accessibility (TCC) grant to a binary's
code-signing **designated requirement**. An ad-hoc signature — what
`build:mac` and the released DMGs use — has a requirement pinned to the
binary's per-build `cdhash`, so every rebuild produces a new requirement and
the OS forgets the grant: the app still appears enabled in **System Settings →
Privacy & Security → Accessibility**, yet `AXIsProcessTrusted()` returns
`false` and scanning fails.

Signing local builds with a stable self-signed certificate keeps the
requirement constant (bundle identifier + certificate), so a grant survives
rebuilds.

### One-time setup

Create the self-signed **Code Signing** certificate in your login keychain:

```sh
scripts/create-dev-cert.sh
```

The script is idempotent and needs no `sudo`. It creates an identity named
`What Cant I Press Dev` (override with `DEV_CERT_NAME`).

### Build signed

```sh
npm run build:mac:signed
```

This runs the normal macOS build, then an `afterSign` hook re-signs the app
bundle and its bundled Swift helper with the self-signed identity.

The **first** `codesign` after creating the certificate shows a keychain prompt
to allow access to the private key — click **Always Allow** once and subsequent
builds run without prompting. To suppress it up front, pass your login keychain
password when creating the cert:

```sh
KEYCHAIN_PASSWORD='your-login-password' scripts/create-dev-cert.sh
```

### Grant once

Install the signed build, then in **System Settings → Privacy & Security →
Accessibility**:

1. If a stale **What Can't I Press** entry is listed, remove it with the
   **–** button.
2. Add the newly built app and enable it.
3. Reopen the app and scan.

The remove/re-add step is required **only once**, on the transition from an
ad-hoc build to the signed build (the requirement changes from `cdhash` to the
certificate). After that the grant persists across `build:mac:signed` rebuilds.

### Verify the requirement is stable

```sh
codesign -dr - "dist/mac-arm64/What Can't I Press.app"
```

A signed build reports `... and certificate leaf = H"..."` (stable across
rebuilds). An ad-hoc build instead reports a `cdhash` requirement that changes
every build.

### Caveats

- Self-signed builds are **not notarized**. Gatekeeper flags them; a downloaded
  self-signed DMG needs right-click → **Open**. Locally built apps are usually
  unquarantined and open normally.
- This is for **local development only**, not public distribution. `build:mac`,
  `release:mac`, and CI remain ad-hoc and are unaffected — the `afterSign` hook
  is a no-op unless `SELF_SIGN_IDENTITY` is set (which `build:mac:signed` sets).
