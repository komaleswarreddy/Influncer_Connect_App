/**
 * Global theme entry — import from `@/theme`.
 *
 * **Premium shell (end-to-end):** use `appShell` for backgrounds, text, borders, and `appShell.cta`
 * (`#141e33`) for primary buttons, tabs, and key accents. Pair with `loginScreen` / `premiumButton`
 * on auth. Use `palette.error` only for destructive/error states; `appShell.link` is optional brand blue.
 */
export { palette, paletteExtended, type Palette } from './palette';
export { loginScreen, loginPremium, premiumButton } from './semantic';
export { appShell, appShellLight, appShellDark, spacing, radius, shadow } from './tokens';
export { useAppShell, type ResolvedAppShell } from './useAppShell';
export { premiumNavy } from './premiumSurfaces';
export { appPaperLight, appPaperDark } from './paperTheme';
export { appNavigationLight, appNavigationDark } from './navigationTheme';

/**
 * Kollab identity — the app's target design system (see kollab-tokens.ts's own doc comment).
 * `useKollab()` returns everything, including the theme-invariant pieces (font/type/space/radius/
 * scrim/nav/cardShape/nicheCover/asset) — reach for those via the hook inside a component body.
 * For a module-scope StyleSheet.create() that needs an invariant value before any hook can run,
 * import it directly from '@/theme/kollab-tokens' (e.g. `import { space } from '@/theme/kollab-tokens'`)
 * rather than through this barrel, since several of its names (radius, shadow) would otherwise
 * collide with the legacy exports above.
 */
export { useKollab, type KollabTokens, type KollabColor } from './kollab-tokens';
