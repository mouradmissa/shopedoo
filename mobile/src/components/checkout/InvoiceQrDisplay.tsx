import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../theme';

interface Props {
  value: string;
  size?: number;
}

export function InvoiceQrDisplay({ value, size = 220 }: Props) {
  return (
    <View style={styles.wrap}>
      <QRCode value={value} size={size} backgroundColor="#fff" color="#111" />
      <Text style={styles.hint}>Présentez ce QR à la caisse</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
