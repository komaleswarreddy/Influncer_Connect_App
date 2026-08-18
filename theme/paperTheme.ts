import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColor, darkColor } from './kollab-tokens';

/** MD3 theme derived from Kollab — used for PaperProvider (react-native-paper only
 *  renders on the auth screens: login.tsx, register/influencer.tsx, CognitoAuthButtons.tsx). */
export const appPaperLight = {
  ...MD3LightTheme,
  roundness: 20,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColor.ink,
    primaryContainer: lightColor.tint,
    secondary: lightColor.violet,
    secondaryContainer: lightColor.tint,
    tertiary: lightColor.chartreuse,
    tertiaryContainer: lightColor.chartreuse,
    surface: lightColor.card,
    surfaceVariant: lightColor.well,
    background: lightColor.screen,
    error: lightColor.heat,
    onPrimary: lightColor.inkOn,
    onPrimaryContainer: lightColor.ink,
    onSecondary: lightColor.inkOn,
    onSurface: lightColor.ink,
    onSurfaceVariant: lightColor.inkMuted,
    onBackground: lightColor.ink,
    outline: lightColor.hairline,
    outlineVariant: lightColor.hairline,
    inverseSurface: lightColor.ink,
    inverseOnSurface: lightColor.inkOn,
    inversePrimary: lightColor.chartreuse,
    elevation: MD3LightTheme.colors.elevation,
  },
};

export const appPaperDark = {
  ...MD3DarkTheme,
  roundness: 20,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColor.ink,
    primaryContainer: darkColor.tint,
    secondary: darkColor.violet,
    secondaryContainer: darkColor.tint,
    tertiary: darkColor.chartreuse,
    tertiaryContainer: darkColor.chartreuse,
    surface: darkColor.card,
    surfaceVariant: darkColor.well,
    background: darkColor.screen,
    error: darkColor.heat,
    onPrimary: darkColor.inkOn,
    onPrimaryContainer: darkColor.ink,
    onSecondary: darkColor.inkOn,
    onSurface: darkColor.ink,
    onSurfaceVariant: darkColor.inkMuted,
    onBackground: darkColor.ink,
    outline: darkColor.hairline,
    outlineVariant: darkColor.hairline,
    inverseSurface: lightColor.ink,
    inverseOnSurface: lightColor.inkOn,
    inversePrimary: darkColor.chartreuse,
    elevation: MD3DarkTheme.colors.elevation,
  },
};
