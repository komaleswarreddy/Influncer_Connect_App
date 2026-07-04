/**
 * Static import so expo-secure-store is bundled before @kinde/js-utils dynamic import runs.
 * Avoids "Cannot read property 'getItemAsync' of undefined" on cold Expo Go start.
 */
import * as SecureStore from 'expo-secure-store';

void SecureStore;
