import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { palette } from './palette';
import { appShellDark, appShellLight } from './tokens';

/** MD3 theme aligned with Influence Elite — use for PaperProvider */
export const appPaperLight = {
  ...MD3LightTheme,
  roundness: 14,
  colors: {
    ...MD3LightTheme.colors,
    primary: appShellLight.cta,
    primaryContainer: 'rgba(142, 158, 237, 0.22)',
    secondary: palette.secondary,
    secondaryContainer: '#E2E8F0',
    tertiary: palette.tertiary,
    tertiaryContainer: '#EEF2FF',
    surface: appShellLight.card,
    surfaceVariant: '#F1F5F9',
    background: appShellLight.canvas,
    error: palette.error,
    onPrimary: palette.white,
    onPrimaryContainer: appShellLight.textPrimary,
    onSecondary: palette.white,
    onSurface: appShellLight.textPrimary,
    onSurfaceVariant: appShellLight.textSecondary,
    onBackground: appShellLight.textPrimary,
    outline: 'rgba(28, 42, 74, 0.22)',
    outlineVariant: appShellLight.borderSubtle,
    inverseSurface: palette.secondary,
    inverseOnSurface: palette.white,
    inversePrimary: palette.tertiary,
    elevation: MD3LightTheme.colors.elevation,
  },
};

export const appPaperDark = {
  ...MD3DarkTheme,
  roundness: 14,
  colors: {
    ...MD3DarkTheme.colors,
    primary: appShellDark.cta,
    primaryContainer: '#1E2A44',
    secondary: appShellDark.textSecondary,
    secondaryContainer: '#1A2338',
    tertiary: appShellDark.accent,
    tertiaryContainer: '#1E2A44',
    surface: appShellDark.card,
    surfaceVariant: appShellDark.canvasAlt,
    background: appShellDark.canvas,
    error: palette.error,
    onPrimary: '#0B1220',
    onPrimaryContainer: appShellDark.textPrimary,
    onSecondary: appShellDark.textPrimary,
    onSurface: appShellDark.textPrimary,
    onSurfaceVariant: appShellDark.textSecondary,
    onBackground: appShellDark.textPrimary,
    outline: appShellDark.cardBorder,
    outlineVariant: appShellDark.borderSubtle,
    inverseSurface: appShellLight.card,
    inverseOnSurface: appShellLight.textPrimary,
    inversePrimary: appShellDark.cta,
    elevation: MD3DarkTheme.colors.elevation,
  },
};
