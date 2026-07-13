import { nativeImage, type NativeImage } from 'electron'

/**
 * Monochrome keyboard glyph used for the menu-bar (tray) icon.
 * '#' = opaque pixel, anything else = transparent.
 */
const GLYPH = [
  '################',
  '#..............#',
  '#.#.#.#.#.#.#..#',
  '#..............#',
  '#.#.#.#.#.#.#..#',
  '#..............#',
  '#...######.....#',
  '#..............#',
  '################'
]

/**
 * Builds the tray icon from {@link GLYPH} as a template image so macOS can
 * recolor it for light/dark menu bars. `scale` upsamples each grid cell.
 */
export function createTrayIcon(scale = 2): NativeImage {
  const rows = GLYPH.length
  const cols = GLYPH[0].length
  const width = cols * scale
  const height = rows * scale
  const buffer = Buffer.alloc(width * height * 4, 0)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (GLYPH[y][x] !== '#') continue
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = x * scale + dx
          const py = y * scale + dy
          const idx = (py * width + px) * 4
          // Pixel order is BGRA on macOS/Windows; opaque black.
          buffer[idx + 0] = 0
          buffer[idx + 1] = 0
          buffer[idx + 2] = 0
          buffer[idx + 3] = 255
        }
      }
    }
  }

  const image = nativeImage.createFromBitmap(buffer, { width, height })
  image.setTemplateImage(true)
  return image
}
