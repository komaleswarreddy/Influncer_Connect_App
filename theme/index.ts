/**
 * Global theme entry — import from `@/theme`.
 *
 * **Premium shell (end-to-end):** use `appShell` for backgrounds, text, borders, and `appShell.cta`
 * (`#141e33`) for primary buttons, tabs, and key accents. Pair with `loginScreen` / `premiumButton`
 * on auth. Use `palette.error` only for destructive/error states; `appShell.link` is optional brand blue.
 */
export { palette, paletteExtended, type Palette } from './palette';
export { loginScreen, loginPremium, premiumButton } from './semantic';
export { appShell, spacing, radius, shadow } from './tokens';
export { premiumNavy } from './premiumSurfaces';
export { appPaperLight, appPaperDark } from './paperTheme';
export { appNavigationLight, appNavigationDark } from './navigationTheme';
