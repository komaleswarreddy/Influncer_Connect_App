import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How far the on-screen keyboard covers the bottom of the screen, in pixels (0 when it is closed).
 *
 * FOR SCREENS ONLY. Do NOT use it inside a <Modal>: Android shrinks a Modal's own window when the keyboard opens, so
 * adding this padding as well lifts it twice and squeezes the content to a sliver. Modals need no keyboard padding.
 *
 * The app runs edge-to-edge on Android. In that mode Android no longer shrinks the window when the keyboard opens
 * (`adjustResize` has no effect), and KeyboardAvoidingView with `behavior={undefined}` does nothing there, so a chat box
 * at the bottom ended up hidden behind the keyboard. Padding the screen by this value lifts it on both platforms.
 *
 * iOS reports a keyboard height that already includes the home-indicator area, which the screen also pads for, so that
 * part is taken off there. On Android the reported height stops short of the navigation-bar strip the keyboard also
 * covers, so the full value is used (taking the inset off left the input's bottom edge behind the keyboard).
 */
export function useKeyboardInset(): number {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return Platform.OS === 'ios' ? Math.max(0, keyboardHeight - insets.bottom) : keyboardHeight;
}
