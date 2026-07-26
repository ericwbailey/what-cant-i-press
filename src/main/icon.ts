import { nativeImage, type NativeImage } from 'electron'

/**
 * Menu-bar (tray) icon: a circular target glyph.
 * Pre-rasterized from the source PNG to RGBA PNGs. The black-on-transparent pair
 * serves as a macOS template image (macOS recolors it for light/dark menu bars)
 * and as the Windows icon for a light taskbar; a white-on-transparent pair is the
 * Windows icon for a dark taskbar, since Windows does not recolor tray icons.
 * Each color has @1x (16px) and @2x (32px) representations for crisp rendering.
 */
const KEYBOARD_PNG_16 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABS0lEQVQ4y5XTsUpcURAG4O+uQrQy24SIAVcWsUifFJJHyDvExwiWwSdwLdVX0NoilSBI8gAJxFR3CQnYWCiuq8X9rx51hTgwnMM5//nPzPwzNFY9WFvrxkubegLrRdZFbKHGdbzGIHcw25JU6GCMPbzGCl5iF4cBrmINZ/iKHt7hvBMC+Iv32b/BlxBfYSOk//ARv3FepKOHC3zDED+L8Fs/DsFJImnTAZsBzeAg+xEu46OCZC77QUlQYwfLxeNx8fu4IOkHW0v+XcynYKshvH4gU5Uz+BDsPLodz7dq0uEwYfX/I4WlSFyXBINczqVQTxXxBxYmFbEXaU4i1bHHMh4k0tP4rYzTWfcC/JWm6eNTfFnT6t+DOWrr0dF0WivlPl7lh3VNp03hs6bz3mIbf0LYKnPPesmvHKah+8M0UZGqSKe1SeM87W5+3AAgx265gbl7oAAAAABJRU5ErkJggg=='

const KEYBOARD_PNG_32 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADcElEQVRYw7WXPU+UQRDHf3dAwsEZNNFELIyxhgQKwU4jsVAxITkSLfQbXH+h0a9gQQFYaGsiFMYY7bRBCjxIBF/QCkjE0GA45fXusdiZe+aWvTeikzzZfWZ2d/47Mzuzm6BxSgAt0j+sMqZV2iIQNbpoLX5kFPtKTwIpkf8GfgXAWCCJEKgQgCRQkn4bcCD9DuAmMAz0Ad1AWmTbwAawALwEXgE7BkhJPruxmjs/YXhtQA5Yl4mNfOvAmMxVOlXP8urfYaAAvJYdfw4oOATWgCVgGVgVnj/uK3AJeCj/j2oB0AB6UWNns0AW6DHmB+gEekU2V2N+ERc7QRBJaQfEAhGwL+2KWMOnFNAe4I8AH41Stc4DT1fQBX3Argdg3oy7DkwBeXHDqvSngCEzblzm7hKfhgHP2mVKGMFKFfPlgRnqB+AzYMLEipV9Iw7MChcoojEz+BOQMe6wfjyQ1n4HuKMWecrHcYGq/JxvBUWSovKoZYR/37gjFOmhE7In/UkTE/aIdljdiiRjBs0Z60xXMWc9EOoOpVkjH7VWUABPzICs8K7Jf6kJ5dZVkQnMrJE9VQBJ4hzfL20ReCf9u4bXLGk6vyPtW7NOn7Tl+tKFy+UR7lh1Cj/v7eY4FsjLWmncsY2An0hC0oTQSZz/t3HVrR04fYyd+3QGF+AF4oqZFl4ZgK1OtnwmGlBQj9Qiuia2rwB2BKG6Iy28zX8AYBOXDUNWLgPYAn5Ivxu4IH1NwSWaJ52jMXAROCf9DcQdSeJjuChtC3BV+nqOkzRPSW+NK8T1ZkHaijwwSmXZxSxw3ET03Kzz3sgzFoAGRgeVqXhE+JPyv9cgiEPiKqrmv2Xk68gJMLrLVsiZgcvEJdUqLtFYMdJvHvhi/sc8nRVIQuVYlU8Yd9T6poF7HK2iuqlgOcYEyGXiTKYXk3Ezbgh4DHzAZc01whcSjal945IbImsjQApAi4aaOcJdr0YCc9qNPy1lPLPr98bs/IgF1Ce1zDwnAHuJ6wW4xNUjsllvzp5xR4E4GVW9lJ4XEFlgEHe1DkX6qvh0SdwQOiHfcVV2EPdgue3pOkKh3N+Ki9xmHyY5ApdPX0e1p1mSuIBoDU8RP836gbPGnAVcKl8kfpr9EVmLrKVrFusBCCEOPU67cHEQ4QrXVsBydV/JzZTb//I8/wtAcL/u4g42NwAAAABJRU5ErkJggg=='

const KEYBOARD_WHITE_PNG_16 =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABUUlEQVQ4EaXTOy9EQRjG8T0uiZrQEoVrsRIUOglhxaWXKGhEq/QZxDfYrC8h0ShQkEiEhuxq1OsWoSBxGf9nMu8cxTkhPMkv7zlzdt6dnTNbKPwzSdZ859wQ4zMYDM8vqLtJkpyH+1hiAyZNMTqODqzgAVUo/WhFGdeo06xCTUODRVhWuejEcNBFXcYblA2b2WQX1Ak84QOzWEcflBqO8ArN6UYaOhZ9X+eWqJvhOqtsM6iVKEV1aAht5qj3OMBCGMsqYwzuQZ/VnNhAu62dbkcP8tLLA23yJfwbshVoQnwjuvkhzp5bA337AG6gDcuLXmsdtuL4E3YYbMMkjpGXKx7MQ5/VnDTsahkveEYFVXxCqWELj3iHDpSP/QTdnKAlOKSWMBJMU8/QjEbcwef7QTplZA2j0DHVUdZua3N1oLRsje/jFj6ZO88Sf/1nskZ/rl9EgcKquzd0tgAAAABJRU5ErkJggg=='

const KEYBOARD_WHITE_PNG_32 =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADe0lEQVRYCeWXzUuUURTGZyRXpWIfqBEtrPwIWxSV9AFBH5ZtomXUolXLgtAoyij8CxSirGVrFaLIwtpERR+7wopqExqGmWWQFMb0e97OGa4z7zDMjKt64Jlz3nPPPfe8986ccyeR+N+RLGQDUqnUYvxb4Ua4Bi6BivEZvoPP4JNkMvkFOX9g4SbYAz/AfJCPfJuLyoCJVfASvALr4Vk4BePwC6MYh68YNbcSnoD9cENmUllHgNMRnK6bo7ZS2+6YRrkP78IR+AkqxjK4Du6Gu2AFdLxBabSHGxzPAR+IlSTQAkdhiO88XIYNsZMCIz7NsA9qToifPBwPXCM1bgfKGdFbbg+cX6FvIftvBKlD36tnuAIKo/AxHMJnXAb8BhAHpRu0E+sZn3FDrGSizi0OwxgvwI9xg2YbQ56C3XDWbKHoil3UjXg2Qr2loC3Lt2DkmOdjgPEZ81Hs3MfIYK85SlxTYsg9UMkUg26LcTWY3OsvPEfiUA39yzeNHmWK7IC/YTHosAT0c1ZMQcdUPWdxc2qPhv9+DJqthsfxwF6oqrk1FmswmNzuCZS5gtwc6HdMl2MUIBgrRNVcX2womLjJ9TCBVWZMIV+avs0dS5Bbba4Kl2IL6iMRwgSWmm0WOWn6cpOlCK8VEwRRbCFdXcMEPDs5uJ5VqDRYIOJipeOGCXgLXcACqu2CKlypGLMAat2KLah9RwgTeGs2ZbfW9IcmSxGPbHIL0t/8vQcME9BlwrHPFH1z1fGKhfrCbZus/uF46kpa8htVIVKREFQ06jWIVCEqFucsRgMBvBCp2KULUXoH6FJTOPdrAlA/Px1piUSVyWLEDhbT9+kk9DvCgK2VHQ9nZerNSA1EjaQYhJ1whAA/LIhi++UkOwFZcOgy51AooFqsWq0fUzjuulp1J2yD3ld8TP3kTPyqgRWnhfC1zzLpR6MEa+FRqFvPTXjLdNlqPRT6RRhigoeVPp5T4rQfZl40db3Sgs05J9oAPjpGtV/fdtQ0+jLne2HItOtaJugapTNbBI/BQ4S6hxyGL6DKqyqdmo5qRxvcCSuh4wHKalgHvRT7WLZkgTKo1qydqIC6oumKHQftVOZuuZ+u8udhOdRF9zAME8tePJeFibrp9kD96cgH+ci3KVe80O6lMbTl1AmqLtYK1c+1reqgOoJJqFL+HM7/XzOC/rv4A2gPQik+iuFYAAAAAElFTkSuQmCC'

/** Builds a NativeImage from base64-encoded @1x and @2x PNG representations. */
function buildImage(png16: string, png32: string): NativeImage {
  const image = nativeImage.createFromDataURL(`data:image/png;base64,${png16}`)
  image.addRepresentation({ scaleFactor: 2, dataURL: `data:image/png;base64,${png32}` })
  return image
}

/**
 * macOS menu-bar icon: a template image so macOS recolors the black glyph for
 * light/dark menu bars, with a base @1x representation and a crisp @2x variant.
 */
export function createTrayIcon(): NativeImage {
  const image = buildImage(KEYBOARD_PNG_16, KEYBOARD_PNG_32)
  image.setTemplateImage(true)
  return image
}

/**
 * Windows tray icon. Windows has no template-image recoloring, so pick an
 * explicitly-colored glyph for contrast: white for a dark taskbar, black for a
 * light one.
 */
export function createWindowsTrayIcon(darkTaskbar: boolean): NativeImage {
  return darkTaskbar
    ? buildImage(KEYBOARD_WHITE_PNG_16, KEYBOARD_WHITE_PNG_32)
    : buildImage(KEYBOARD_PNG_16, KEYBOARD_PNG_32)
}
