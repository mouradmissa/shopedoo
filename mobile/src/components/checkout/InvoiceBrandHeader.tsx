import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShopEdooLogo } from '../brand/ShopEdooLogo';
import { colors } from '../../theme';

interface Props {
  orderRef: string;
  status: 'paid' | 'pending';
}

export function InvoiceBrandHeader({ orderRef, status }: Props) {
  return (
    <View style={styles.wrap}>
      <ShopEdooLogo height={32} />
      <Text style={styles.ref}>Facture #{orderRef}</Text>
      <View style={[styles.badge, status === 'paid' ? styles.badgePaid : styles.badgePending]}>
        <Text style={[styles.badgeText, status === 'paid' ? styles.badgeTextPaid : styles.badgeTextPending]}>
          {status === 'paid' ? 'Payée' : 'En attente'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  ref: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePaid: { backgroundColor: '#dcfce7' },
  badgePending: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextPaid: { color: '#15803d' },
  badgeTextPending: { color: '#b45309' },
});
