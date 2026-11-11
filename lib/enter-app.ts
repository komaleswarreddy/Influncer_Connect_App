import type { Router } from 'expo-router';

/**
 * Go to the signed-in area and drop everything underneath it (Login, Register, code screens).
 * `router.replace` only swaps the top screen, so the screens below stayed in the history and the
 * back button landed on "Create account" right after signing in.
 */
export function enterApp(router: Router, path: string): void {
  try {
    if (router.canDismiss()) router.dismissAll();
  } catch {
    // Nothing to dismiss (the stack already has one screen): replace is enough.
  }
  router.replace(path as never);
}
