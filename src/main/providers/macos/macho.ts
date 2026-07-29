import { open, type FileHandle } from 'node:fs/promises'

/**
 * Minimal, dependency-free Mach-O reader used to answer a single question:
 * does a binary's symbol table contain a given undefined (imported) symbol?
 * This replaces shelling out to `nm`, which is a Command Line Tools stub and
 * pops the "install the command line developer tools" dialog on Macs without
 * Xcode installed.
 *
 * Only the pieces needed for that question are parsed: the fat header (to pick
 * the host-architecture slice), the Mach-O header, the LC_SYMTAB load command,
 * and its symbol + string tables. Everything is best-effort — any malformed or
 * unexpected structure resolves to `false` rather than throwing.
 */

// Universal ("fat") archive magics. Fat headers are always big-endian on disk.
const FAT_MAGIC = 0xcafebabe
const FAT_MAGIC_64 = 0xcafebabf

// Thin Mach-O magics, read big-endian. *_CIGAM means the slice is little-endian
// (the native byte order for x86_64 and arm64 macOS binaries).
const MH_MAGIC = 0xfeedface
const MH_CIGAM = 0xcefaedfe
const MH_MAGIC_64 = 0xfeedfacf
const MH_CIGAM_64 = 0xcffaedfe

const LC_SYMTAB = 0x2

// nlist n_type field masks.
const N_STAB = 0xe0 // debug (STABS) symbol — skip
const N_TYPE = 0x0e // type bits
const N_UNDF = 0x00 // undefined

const CPU_TYPE_X86_64 = 0x01000007
const CPU_TYPE_ARM64 = 0x0100000c

// Sanity caps so a corrupt or hostile binary can never make us allocate wildly.
const MAX_FAT_ARCHES = 64
const MAX_LOAD_COMMANDS_BYTES = 2 * 1024 * 1024
const MAX_SYMTAB_BYTES = 64 * 1024 * 1024
const MAX_STRTAB_BYTES = 128 * 1024 * 1024

function readU32(buf: Buffer, off: number, le: boolean): number {
  return le ? buf.readUInt32LE(off) : buf.readUInt32BE(off)
}

function readU64(buf: Buffer, off: number, le: boolean): bigint {
  return le ? buf.readBigUInt64LE(off) : buf.readBigUInt64BE(off)
}

/** Reads exactly `length` bytes at `offset`, throwing on a short read. */
async function readExact(fh: FileHandle, offset: number, length: number): Promise<Buffer> {
  const buf = Buffer.allocUnsafe(length)
  let read = 0
  while (read < length) {
    const { bytesRead } = await fh.read(buf, read, length - read, offset + read)
    if (bytesRead === 0) break
    read += bytesRead
  }
  if (read < length) throw new Error('unexpected end of file')
  return buf
}

function hostCpuType(): number {
  return process.arch === 'arm64' ? CPU_TYPE_ARM64 : CPU_TYPE_X86_64
}

/**
 * Picks the file offset of the slice matching the host architecture, falling
 * back to the first slice when the host arch is absent. Returns -1 on a
 * malformed fat header.
 */
async function selectFatSlice(fh: FileHandle, is64: boolean): Promise<number> {
  const header = await readExact(fh, 0, 8)
  const nArch = header.readUInt32BE(4)
  if (nArch === 0 || nArch > MAX_FAT_ARCHES) return -1

  const archSize = is64 ? 32 : 20
  const table = await readExact(fh, 8, nArch * archSize)
  const wanted = hostCpuType()

  let firstOffset = -1
  for (let i = 0; i < nArch; i++) {
    const base = i * archSize
    const cpuType = table.readUInt32BE(base) >>> 0
    const offset = is64
      ? Number(table.readBigUInt64BE(base + 8))
      : table.readUInt32BE(base + 8)
    if (i === 0) firstOffset = offset
    if (cpuType === wanted) return offset
  }
  return firstOffset
}

/** True when `strs[start..]` equals `target` and is NUL-terminated (or ends the table). */
function symbolNameMatches(strs: Buffer, start: number, target: Buffer): boolean {
  const end = start + target.length
  if (end > strs.length) return false
  if (end < strs.length && strs[end] !== 0) return false
  return strs.compare(target, 0, target.length, start, end) === 0
}

/**
 * Scans one Mach-O image (at `sliceOffset` within the file) for an undefined
 * external symbol named `symbol`. Mirrors `nm -u`: undefined entries only,
 * excluding common symbols (N_UNDF with a non-zero value) and debug symbols.
 */
async function machoImportsSymbol(
  fh: FileHandle,
  sliceOffset: number,
  symbol: string
): Promise<boolean> {
  const magicBE = (await readExact(fh, sliceOffset, 4)).readUInt32BE(0)

  let le: boolean
  let is64: boolean
  if (magicBE === MH_MAGIC_64) {
    le = false
    is64 = true
  } else if (magicBE === MH_CIGAM_64) {
    le = true
    is64 = true
  } else if (magicBE === MH_MAGIC) {
    le = false
    is64 = false
  } else if (magicBE === MH_CIGAM) {
    le = true
    is64 = false
  } else {
    return false
  }

  const headerSize = is64 ? 32 : 28
  const header = await readExact(fh, sliceOffset, headerSize)
  const ncmds = readU32(header, 16, le)
  const sizeofcmds = readU32(header, 20, le)
  if (sizeofcmds === 0 || sizeofcmds > MAX_LOAD_COMMANDS_BYTES) return false

  const cmds = await readExact(fh, sliceOffset + headerSize, sizeofcmds)

  let symoff = 0
  let nsyms = 0
  let stroff = 0
  let strsize = 0
  let found = false
  let off = 0
  for (let i = 0; i < ncmds; i++) {
    if (off + 8 > cmds.length) break
    const cmd = readU32(cmds, off, le)
    const cmdsize = readU32(cmds, off + 4, le)
    if (cmdsize < 8 || off + cmdsize > cmds.length) break
    if (cmd === LC_SYMTAB && off + 24 <= cmds.length) {
      symoff = readU32(cmds, off + 8, le)
      nsyms = readU32(cmds, off + 12, le)
      stroff = readU32(cmds, off + 16, le)
      strsize = readU32(cmds, off + 20, le)
      found = true
      break
    }
    off += cmdsize
  }
  if (!found) return false

  const nlistSize = is64 ? 16 : 12
  const symBytes = nsyms * nlistSize
  if (symBytes === 0 || symBytes > MAX_SYMTAB_BYTES) return false
  if (strsize === 0 || strsize > MAX_STRTAB_BYTES) return false

  const syms = await readExact(fh, sliceOffset + symoff, symBytes)
  const strs = await readExact(fh, sliceOffset + stroff, strsize)
  const target = Buffer.from(symbol, 'utf8')

  for (let i = 0; i < nsyms; i++) {
    const base = i * nlistSize
    const nType = syms.readUInt8(base + 4)
    if ((nType & N_STAB) !== 0) continue
    if ((nType & N_TYPE) !== N_UNDF) continue
    const nValue = is64 ? readU64(syms, base + 8, le) : BigInt(readU32(syms, base + 8, le))
    if (nValue !== 0n) continue // common symbol, not an import
    const strx = readU32(syms, base, le)
    if (strx === 0 || strx >= strs.length) continue
    if (symbolNameMatches(strs, strx, target)) return true
  }
  return false
}

/**
 * Best-effort test of whether the Mach-O binary at `path` imports the undefined
 * symbol `symbol` (e.g. `_RegisterEventHotKey`). Resolves to `false` for any
 * unreadable, non-Mach-O, or malformed input rather than throwing.
 */
export async function binaryImportsSymbol(path: string, symbol: string): Promise<boolean> {
  let fh: FileHandle | null = null
  try {
    fh = await open(path, 'r')
    const magicBE = (await readExact(fh, 0, 8)).readUInt32BE(0)

    let sliceOffset = 0
    if (magicBE === FAT_MAGIC || magicBE === FAT_MAGIC_64) {
      sliceOffset = await selectFatSlice(fh, magicBE === FAT_MAGIC_64)
      if (sliceOffset < 0) return false
    }
    return await machoImportsSymbol(fh, sliceOffset, symbol)
  } catch {
    return false
  } finally {
    if (fh) await fh.close().catch(() => {})
  }
}
