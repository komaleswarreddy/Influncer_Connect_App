import React from 'react';

import { TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { premiumButton, shadow } from '@/theme';



type Props = {

  onPress: () => void;

  icon?: keyof typeof Ionicons.glyphMap;

  accessibilityLabel?: string;

};



/** Squircle FAB — navy premium gradient aligned with `premiumButton`. */

export function PremiumFAB({

  onPress,

  icon = 'add',

  accessibilityLabel = 'Primary action',

}: Props) {

  return (

    <TouchableOpacity

      onPress={onPress}

      accessibilityRole="button"

      accessibilityLabel={accessibilityLabel}

      activeOpacity={0.9}

      style={[styles.wrap, shadow.fab]}

    >

      <LinearGradient

        colors={[...premiumButton.baseGradient]}

        locations={[0, 0.45, 0.78, 1]}

        start={{ x: 0.5, y: 0 }}

        end={{ x: 0.5, y: 1 }}

        style={styles.squircle}

      >

        <Ionicons name={icon} size={28} color={premiumButton.iconColor} />

      </LinearGradient>

    </TouchableOpacity>

  );

}



const styles = StyleSheet.create({

  wrap: {

    borderRadius: 22,

    overflow: 'hidden',

  },

  squircle: {

    width: 58,

    height: 58,

    borderRadius: 18,

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 1,

    borderColor: premiumButton.rimOuter,

    ...Platform.select({

      android: { elevation: 12 },

    }),

  },

});


