/**
 * Share messages written in WhatsApp markup: *bold*, _italic_, emoji, and the link alone on its own line so WhatsApp turns it into a
 * tappable link with a preview card (the card itself comes from the page's Open Graph tags). Apps that do not understand the markup
 * (SMS, email) simply show the asterisks around a short heading, which still reads fine.
 */

/** Strips the characters WhatsApp treats as formatting, so a creator's own text cannot break the markup. */
export function plain(text: string | null | undefined): string {
  return String(text ?? '')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const bold = (t: string) => `*${plain(t)}*`;
const italic = (t: string) => `_${plain(t)}_`;

function join(lines: (string | null | false | undefined)[]): string {
  return lines.filter((l): l is string => typeof l === 'string').join('\n');
}

export function mediaKitShareText(o: {
  name: string | null;
  headline: string | null;
  url: string;
}): string {
  const name = plain(o.name);
  return join([
    bold(name ? `${name} · Creator Media Kit` : 'My Creator Media Kit') + ' ✨',
    plain(o.headline) ? italic(o.headline as string) : null,
    '',
    '📊 Audience stats, rates & how to work with me:',
    o.url,
  ]);
}

export function meetShareText(o: {
  title: string;
  durationMinutes: number;
  priceLabel: string;
  url: string;
}): string {
  return join([
    bold(`Book a ${o.durationMinutes}-min session with me`) + ' 🎥',
    italic(o.title),
    `💰 ${plain(o.priceLabel)}`,
    '',
    '📅 Pick a time that works for you:',
    o.url,
  ]);
}

export function eventShareText(o: {
  title: string;
  when: string;
  where: string;
  url: string;
}): string {
  return join([
    bold(o.title) + ' 🎟️',
    plain(o.when) ? `🗓 ${plain(o.when)}` : null,
    plain(o.where) ? `📍 ${plain(o.where)}` : null,
    '',
    '🎫 Grab your ticket:',
    o.url,
  ]);
}

export function storefrontShareText(o: { storeName: string | null; url: string }): string {
  return join([bold(plain(o.storeName) || 'My storefront') + ' 🛍️', '', '✨ Take a look:', o.url]);
}
