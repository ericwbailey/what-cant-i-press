import type { PlatformProvider } from './types'
import { createNullProvider } from './null-provider'
import { MacProvider } from './macos'
import { WindowsProvider } from './windows'

let cached: PlatformProvider | null = null

/** Returns the provider matching the host OS, constructed once and cached. */
export function getProvider(): PlatformProvider {
  if (cached) return cached
  switch (process.platform) {
    case 'darwin':
      cached = new MacProvider()
      break
    case 'win32':
      cached = new WindowsProvider()
      break
    default:
      cached = createNullProvider(process.platform)
  }
  return cached
}

export type { PlatformProvider, RunningApp } from './types'
