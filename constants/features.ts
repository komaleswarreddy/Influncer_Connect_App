/**
 * Feature switches for screens that are built but not offered in the app yet.
 * Flip a value to true to show the entry again; the screens, routes and stores stay in the code.
 */
export const FEATURES = {
  /** WhatsApp hub row in Account. Hidden until the WhatsApp integration is live in production. */
  whatsappHub: false,
} as const;
