import { DefaultTheme, DarkTheme, Theme } from '@react-navigation/native';
import { lightColor, darkColor } from './kollab-tokens';

export const appNavigationLight: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: lightColor.ink,
    background: lightColor.screen,
    card: lightColor.card,
    text: lightColor.ink,
    border: lightColor.hairline,
    notification: lightColor.heat,
  },
};

export const appNavigationDark: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: darkColor.ink,
    background: darkColor.screen,
    card: darkColor.card,
    text: darkColor.ink,
    border: darkColor.hairline,
    notification: darkColor.heat,
  },
};
