import React from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { useKollab } from '@/theme/kollab-tokens';

type Props = {
  text: string;
  variant: 'sent' | 'received';
  style?: StyleProp<TextStyle>;
};

/** Asymmetric chat bubble — the tail corner drops to 5px. See kollab-tokens.ts's `chatBubble` spec. */
export function KollabChatBubble({ text, variant, style }: Props) {
  const kollab = useKollab();
  const spec = kollab.chatBubble[variant];
  return (
    <Text
      style={[
        styles.bubble,
        {
          backgroundColor: spec.backgroundColor,
          color: spec.color,
          borderTopLeftRadius: spec.borderTopLeftRadius,
          borderTopRightRadius: spec.borderTopRightRadius,
          borderBottomRightRadius: spec.borderBottomRightRadius,
          borderBottomLeftRadius: spec.borderBottomLeftRadius,
          alignSelf: variant === 'sent' ? 'flex-end' : 'flex-start',
        },
        style,
      ]}
    >
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '76%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 13.5,
    lineHeight: 18,
    fontFamily: 'InstrumentSans_400Regular',
  },
});

export default KollabChatBubble;
