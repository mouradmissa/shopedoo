import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

interface Props {
  onlineStock: number;
}

export function OnlineStockBadge({ onlineStock }: Props) {
  const available = onlineStock > 0;

  return (
    <View style={[styles.badge, available ? styles.available : styles.unavailable]}>
      <Text style={[styles.text, available ? styles.textAvailable : styles.textUnavailable]}>
        {available ? 'Disponible en ligne' : 'Non disponible en ligne'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  available: {
    backgroundColor: colors.successBg,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  unavailable: {
    backgroundColor: colors.muted,
    borderColor: colors.border,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
  textAvailable: {
    color: '#15803d',
  },
  textUnavailable: {
    color: colors.mutedForeground,
  },
});
