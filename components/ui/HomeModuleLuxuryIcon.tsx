import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import type { HomeModuleIconVariant } from './HomeModuleIconWell';

type IconProps = { size?: number };

function PriceTagIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M8 4h8.5l6.5 6.5V20a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path d="M16 4v6.5H22.5" fill="rgba(255,255,255,0.55)" />
      <Circle cx="11" cy="11" r="1.6" fill="rgba(91,108,255,0.85)" />
      <Path d="M9.5 15.5h7" stroke="rgba(91,108,255,0.5)" strokeWidth="1.2" strokeLinecap="round" />
    </Svg>
  );
}

function CalculatorIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x="5" y="4" width="18" height="20" rx="4" fill="rgba(255,255,255,0.95)" />
      <Rect x="7.5" y="7" width="13" height="4" rx="1.2" fill="rgba(18,194,163,0.35)" />
      <Circle cx="9.5" cy="15" r="1.1" fill="rgba(18,194,163,0.75)" />
      <Circle cx="14" cy="15" r="1.1" fill="rgba(18,194,163,0.75)" />
      <Circle cx="18.5" cy="15" r="1.1" fill="rgba(18,194,163,0.75)" />
      <Circle cx="9.5" cy="19.5" r="1.1" fill="rgba(18,194,163,0.55)" />
      <Circle cx="14" cy="19.5" r="1.1" fill="rgba(18,194,163,0.55)" />
      <Rect x="17.2" y="18.4" width="2.6" height="2.2" rx="0.8" fill="rgba(51,225,201,0.9)" />
    </Svg>
  );
}

function FlameIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 3.5c1.2 2.2 2.8 3.4 4.6 4.2 1.6.7 2.9 1.9 2.9 4.3 0 4.2-3.3 7.5-7.5 7.5S6.5 16.2 6.5 12c0-2.2 1.1-3.5 2.4-4.6.7-.6 1.4-1.2 1.9-2.1.4-.7.7-1.6.9-2.8z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path
        d="M14 11.5c.7 1.2 1.5 1.9 2.5 2.3.9.4 1.5 1.1 1.5 2.3 0 2.2-1.8 3.9-4 3.9s-4-1.7-4-3.9c0-1.1.5-1.8 1.3-2.4.5-.4 1-.9 1.3-1.5.2-.4.4-.9.5-1.7z"
        fill="rgba(142,158,237,0.55)"
      />
    </Svg>
  );
}

function CubeIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M14 5l8 4.5v9L14 23l-8-4.5v-9L14 5z" fill="rgba(255,255,255,0.92)" />
      <Path d="M14 5v18M6 9.5l8 4.5 8-4.5" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
      <Path d="M14 14v9" stroke="rgba(122,77,255,0.35)" strokeWidth="0.9" />
      <Path
        d="M10 7.5l4 2.2 4-2.2"
        stroke="rgba(255,255,255,0.65)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ClockIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="14" r="9" fill="rgba(255,255,255,0.95)" />
      <Circle cx="14" cy="14" r="7.2" fill="rgba(142,158,237,0.22)" />
      <Path
        d="M14 8.5v6l4 2.2"
        stroke="rgba(20,30,51,0.75)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChatIcon({ size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M6 8.5c0-1.4 1.1-2.5 2.5-2.5h9c1.4 0 2.5 1.1 2.5 2.5v6c0 1.4-1.1 2.5-2.5 2.5h-4.2L9 20.5v-3.5H8.5C7.1 17 6 15.9 6 14.5v-6z"
        fill="rgba(255,255,255,0.95)"
      />
      <Path
        d="M11 11.5h8.5c1.1 0 2 .9 2 2v4.2c0 1.1-.9 2-2 2h-.8V22l-2.8-2.3H14c-1.1 0-2-.9-2-2v-.7"
        fill="rgba(142,158,237,0.55)"
      />
    </Svg>
  );
}

const ICON_MAP: Record<HomeModuleIconVariant, React.ComponentType<IconProps>> = {
  priceCard: PriceTagIcon,
  rateCalculator: CalculatorIcon,
  trending: FlameIcon,
  createProducts: CubeIcon,
  schedule: ClockIcon,
  autoDm: ChatIcon,
};

export function HomeModuleLuxuryIcon({
  variant,
  size = 28,
}: {
  variant: HomeModuleIconVariant;
  size?: number;
}) {
  const Icon = ICON_MAP[variant];
  return <Icon size={size} />;
}
