import { nativeImage, type NativeImage } from 'electron'

/**
 * Menu-bar (tray) icon: a circular target glyph.
 * Pre-rasterized from the source PNG to black-on-transparent RGBA PNGs so it can
 * serve as a macOS template image (macOS recolors it for light/dark menu bars).
 * Two representations are embedded for crisp rendering at @1x (16px) and @2x (32px).
 */
const KEYBOARD_PNG_16 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABS0lEQVQ4y5XTsUpcURAG4O+uQrQy24SIAVcWsUifFJJHyDvExwiWwSdwLdVX0NoilSBI8gAJxFR3CQnYWCiuq8X9rx51hTgwnMM5//nPzPwzNFY9WFvrxkubegLrRdZFbKHGdbzGIHcw25JU6GCMPbzGCl5iF4cBrmINZ/iKHt7hvBMC+Iv32b/BlxBfYSOk//ARv3FepKOHC3zDED+L8Fs/DsFJImnTAZsBzeAg+xEu46OCZC77QUlQYwfLxeNx8fu4IOkHW0v+XcynYKshvH4gU5Uz+BDsPLodz7dq0uEwYfX/I4WlSFyXBINczqVQTxXxBxYmFbEXaU4i1bHHMh4k0tP4rYzTWfcC/JWm6eNTfFnT6t+DOWrr0dF0WivlPl7lh3VNp03hs6bz3mIbf0LYKnPPesmvHKah+8M0UZGqSKe1SeM87W5+3AAgx265gbl7oAAAAABJRU5ErkJggg=='

const KEYBOARD_PNG_32 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADcElEQVRYw7WXPU+UQRDHf3dAwsEZNNFELIyxhgQKwU4jsVAxITkSLfQbXH+h0a9gQQFYaGsiFMYY7bRBCjxIBF/QCkjE0GA45fXusdiZe+aWvTeikzzZfWZ2d/47Mzuzm6BxSgAt0j+sMqZV2iIQNbpoLX5kFPtKTwIpkf8GfgXAWCCJEKgQgCRQkn4bcCD9DuAmMAz0Ad1AWmTbwAawALwEXgE7BkhJPruxmjs/YXhtQA5Yl4mNfOvAmMxVOlXP8urfYaAAvJYdfw4oOATWgCVgGVgVnj/uK3AJeCj/j2oB0AB6UWNns0AW6DHmB+gEekU2V2N+ERc7QRBJaQfEAhGwL+2KWMOnFNAe4I8AH41Stc4DT1fQBX3Argdg3oy7DkwBeXHDqvSngCEzblzm7hKfhgHP2mVKGMFKFfPlgRnqB+AzYMLEipV9Iw7MChcoojEz+BOQMe6wfjyQ1n4HuKMWecrHcYGq/JxvBUWSovKoZYR/37gjFOmhE7In/UkTE/aIdljdiiRjBs0Z60xXMWc9EOoOpVkjH7VWUABPzICs8K7Jf6kJ5dZVkQnMrJE9VQBJ4hzfL20ReCf9u4bXLGk6vyPtW7NOn7Tl+tKFy+UR7lh1Cj/v7eY4FsjLWmncsY2An0hC0oTQSZz/t3HVrR04fYyd+3QGF+AF4oqZFl4ZgK1OtnwmGlBQj9Qiuia2rwB2BKG6Iy28zX8AYBOXDUNWLgPYAn5Ivxu4IH1NwSWaJ52jMXAROCf9DcQdSeJjuChtC3BV+nqOkzRPSW+NK8T1ZkHaijwwSmXZxSxw3ET03Kzz3sgzFoAGRgeVqXhE+JPyv9cgiEPiKqrmv2Xk68gJMLrLVsiZgcvEJdUqLtFYMdJvHvhi/sc8nRVIQuVYlU8Yd9T6poF7HK2iuqlgOcYEyGXiTKYXk3Ezbgh4DHzAZc01whcSjal945IbImsjQApAi4aaOcJdr0YCc9qNPy1lPLPr98bs/IgF1Ce1zDwnAHuJ6wW4xNUjsllvzp5xR4E4GVW9lJ4XEFlgEHe1DkX6qvh0SdwQOiHfcVV2EPdgue3pOkKh3N+Ki9xmHyY5ApdPX0e1p1mSuIBoDU8RP836gbPGnAVcKl8kfpr9EVmLrKVrFusBCCEOPU67cHEQ4QrXVsBydV/JzZTb//I8/wtAcL/u4g42NwAAAABJRU5ErkJggg=='

/**
 * Builds the tray icon as a template image so macOS can recolor it for
 * light/dark menu bars, with a base @1x representation and a crisp @2x variant.
 */
export function createTrayIcon(): NativeImage {
  const image = nativeImage.createFromDataURL(`data:image/png;base64,${KEYBOARD_PNG_16}`)
  image.addRepresentation({
    scaleFactor: 2,
    dataURL: `data:image/png;base64,${KEYBOARD_PNG_32}`
  })
  image.setTemplateImage(true)
  return image
}
