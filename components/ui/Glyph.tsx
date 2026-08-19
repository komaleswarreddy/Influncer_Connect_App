import React from 'react';
import Svg, { Path } from 'react-native-svg';

/**
 * Kollab's icon set — single dispatcher over Creator App.dc.html's own `ICON` map (fill-based
 * paths, viewBox 0 0 24 24), lifted from the same shape HomeActionOrbs.tsx already established
 * for the (stroke-based) quick-setup orbs. Use this one for everything else: nav bar, stat wells,
 * status rows, buttons — anywhere the mockup shows a solid glyph rather than an orb icon.
 */
export type GlyphName =
  | 'home'
  | 'layers'
  | 'bars'
  | 'gear'
  | 'igPost'
  | 'igStory'
  | 'video'
  | 'tag'
  | 'calc'
  | 'trend'
  | 'store'
  | 'schedule'
  | 'dm'
  | 'ig'
  | 'wallet'
  | 'help'
  | 'cal'
  | 'check'
  | 'pin'
  | 'plus';

const PATHS: Record<GlyphName, string> = {
  igPost: 'M4 4h16v16H4V4zm2 2v12h12V6H6zm2.5 7.5l2-2.5 2 2.5 2.5-3.5 3 5.5H6l2.5-4z',
  igStory:
    'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2.5a7.5 7.5 0 110 15 7.5 7.5 0 010-15zM12 8a4 4 0 100 8 4 4 0 000-8z',
  video: 'M4 5h11a1 1 0 011 1v3.2l4-2.4v10.4l-4-2.4V18a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z',
  pin: 'M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7zm0 4.5A2.5 2.5 0 109.5 9 2.5 2.5 0 0012 6.5z',
  tag: 'M4 4h9l7 7-9 9-7-7V4zm3 2.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  calc: 'M6 2h12a1 1 0 011 1v18a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1zm1 3v4h10V5H7zm0 6v2h3v-2H7zm5 0v2h3v-2h-3zm-5 4v2h3v-2H7zm5 0v2h3v-2h-3z',
  store:
    'M4 4h16l1 5a3 3 0 01-3 3 3 3 0 01-3-2 3 3 0 01-3 2 3 3 0 01-3-2 3 3 0 01-3 2 3 3 0 01-3-3l1-5zm1 9.8V20h6v-5h2v5h6v-6.2a5 5 0 01-3-1 5 5 0 01-6 0 5 5 0 01-5 1.2z',
  trend: 'M3 17l6-6 4 4 5-6 3 3V4h-6l3 3-5 6-4-4-8 8h2z',
  schedule:
    'M7 2h2v2h6V2h2v2h2a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h2V2zm-2 7v10h14V9H5zm3 2h3v3H8v-3z',
  dm: 'M2 4h20v13H8l-6 5V4zm4 4v2h12V8H6zm0 4v2h8v-2H6z',
  ig: 'M8 3h8a5 5 0 015 5v8a5 5 0 01-5 5H8a5 5 0 01-5-5V8a5 5 0 015-5zm0 2a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3V8a3 3 0 00-3-3H8zm4 3a4 4 0 110 8 4 4 0 010-8zm5-1.5a1 1 0 110 2 1 1 0 010-2z',
  wallet:
    'M3 6a2 2 0 012-2h13v3H5v.5h16V19a1 1 0 01-1 1H5a2 2 0 01-2-2V6zm13 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  help: 'M12 2a10 10 0 100 20 10 10 0 000-20zm.2 5a3.3 3.3 0 013.3 3.3c0 1.4-.9 2-1.8 2.6-.6.4-.9.7-.9 1.4h-1.9c0-1.6.7-2.3 1.6-2.9.6-.4.9-.7.9-1.2a1.3 1.3 0 00-2.6 0H9A3.2 3.2 0 0112.2 7zM11 16h2v2h-2v-2z',
  gear: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8.4 4l1.6-1.3-1.6-2.8-2 .7-1.7-1-.3-2.1h-3.2l-.3 2.1-1.7 1-2-.7L5.6 10.7 7.2 12l-1.6 1.3 1.6 2.8 2-.7 1.7 1 .3 2.1h3.2l.3-2.1 1.7-1 2 .7 1.6-2.8L20.4 12z',
  cal: 'M7 2h2v2h6V2h2v2h2a1 1 0 011 1v15a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h2V2zm-2 7v10h14V9H5z',
  home: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z',
  layers:
    'M12 3l9 5-9 5-9-5 9-5zm7.1 8.1L21 12l-9 5-9-5 1.9-.9L12 15l7.1-3.9zm0 4L21 16l-9 5-9-5 1.9-.9L12 19l7.1-3.9z',
  bars: 'M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z',
  check: 'M9.6 16.6L4.4 11.4l1.4-1.4 3.8 3.8 8.2-8.2 1.4 1.4-9.6 9.6z',
  /** Rounded plus — equal arms, stadium caps. Sized to sit optically centered on the 60px FAB. */
  plus: 'M12 3.75a1.75 1.75 0 011.75 1.75v4.75h4.75a1.75 1.75 0 010 3.5h-4.75v4.75a1.75 1.75 0 01-3.5 0v-4.75H5.5a1.75 1.75 0 010-3.5h4.75V5.5A1.75 1.75 0 0112 3.75z',
};

type Props = {
  name: GlyphName;
  color: string;
  size?: number;
};

export function Glyph({ name, color, size = 23 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={PATHS[name]} fill={color} />
    </Svg>
  );
}
