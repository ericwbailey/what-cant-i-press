// electron-builder afterSign hook.
//
// When SELF_SIGN_IDENTITY is set, re-signs the packaged .app with that identity —
// the bundled helper first, then the bundle — so the app has a STABLE code-signing
// designated requirement and macOS TCC grants (Accessibility, Automation) survive
// rebuilds. A no-op when the variable is unset, so default and CI builds keep their
// current (ad-hoc) behavior.
//
// The nested helper at Contents/Resources/bin is signed explicitly because
// `codesign --deep` only descends into standard nested locations (Frameworks,
// Helpers), not arbitrary executables under Resources.
const { execFileSync } = require('node:child_process')
const path = require('node:path')

exports.default = async function afterSign(context) {
  if (process.platform !== 'darwin') return
  const identity = process.env.SELF_SIGN_IDENTITY
  if (!identity) return

  const { appOutDir, packager } = context
  const appName = packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)
  const helperPath = path.join(
    appPath,
    'Contents',
    'Resources',
    'bin',
    'shortcut-helper-macos'
  )
  const entitlements = path.join(__dirname, '..', 'build', 'entitlements.mac.plist')

  const sign = (target, extra = []) =>
    execFileSync(
      'codesign',
      [
        '--force',
        '--timestamp=none',
        '--options',
        'runtime',
        '--entitlements',
        entitlements,
        '--sign',
        identity,
        ...extra,
        target
      ],
      { stdio: 'inherit' }
    )

  // Inside-out: helper first, then the app (--deep re-seals nested frameworks).
  sign(helperPath)
  sign(appPath, ['--deep'])

  console.log(`afterSign: re-signed ${appName}.app with self-signed identity "${identity}"`)
}
