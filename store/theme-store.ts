import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppAppearance = 'dark' | 'light';

const STORAGE_KEY = 'app:appearance';

type ThemeStore = {
  appearance: AppAppearance;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  toggleAppearance: () => Promise<void>;
  setAppearance: (appearance: AppAppearance) => Promise<void>;
};

async function persistAppearance(appearance: AppAppearance) {
  await AsyncStorage.setItem(STORAGE_KEY, appearance);
}

/** Map legacy premium/cleanWhite prefs → light; keep dark/light as-is. */
function normalizeStored(raw: string | null): AppAppearance | null {
  if (raw === 'dark' || raw === 'light') return raw;
  if (raw === 'premium' || raw === 'cleanWhite') return 'light';
  return null;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  appearance: 'dark',
  hydrated: false,

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const next = normalizeStored(stored);
      if (next) {
        set({ appearance: next, hydrated: true });
        if (stored !== next) await persistAppearance(next);
        return;
      }
    } catch {
      /* use default */
    }
    set({ hydrated: true });
  },

  toggleAppearance: async () => {
    const next: AppAppearance = get().appearance === 'dark' ? 'light' : 'dark';
    set({ appearance: next });
    await persistAppearance(next);
  },

  setAppearance: async (appearance) => {
    set({ appearance });
    await persistAppearance(appearance);
  },
}));
