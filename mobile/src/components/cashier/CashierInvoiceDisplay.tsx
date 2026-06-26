import React from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../../lib/currency';
import type { CashierInvoiceView } from '../../lib/invoiceQr';
import { PAYMENT_METHOD_LABELS } from '../../lib/orderLabels';
import { Button } from '../Button';
import { InvoiceBrandHeader } from '../checkout/InvoiceBrandHeader';
import { colors, theme } from '../../theme';

function formatInvoiceDate(iso: string) {
  return new Date(iso).toLocaleString('fr-TN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

interface Props {
  invoice: CashierInvoiceView;
  confirmed: boolean;
  error?: string;
  isConfirming: boolean;
  onConfirm: () => void;
  onScanNext: () => void;
}

export function CashierInvoiceDisplay({
  invoice,
  confirmed,
  error,
  isConfirming,
  onConfirm,
  onScanNext,
}: Props) {
  const isPaid = invoice.status === 'paid' || confirmed;
  const itemCount = invoice.items.reduce((sum, i) => sum + i.quantity, 0);
  const orderRef = invoice._id.slice(-8).toUpperCase();

  return (
    <View style={styles.root}>
      {confirmed && (
        <View style={styles.successBanner}>
          <Ionicons name="checkmark-circle" size={24} color="#15803d" />
          <View>
            <Text style={styles.successTitle}>Paiement confirmé</Text>
            <Text style={styles.successSub}>La commande est enregistrée comme payée.</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!isPaid && (
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Montant à encaisser</Text>
            <Text style={styles.amountValue}>{formatPrice(invoice.totalAmount)}</Text>
            <Text style={styles.amountMeta}>
              {itemCount} article{itemCount !== 1 ? 's' : ''} · Facture #{orderRef}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <InvoiceBrandHeader orderRef={orderRef} status={isPaid ? 'paid' : 'pending'} />

          <View style={styles.cardBody}>
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Client</Text>
                  <Text style={styles.infoValue}>{invoice.userId.name}</Text>
                  {invoice.userId.email ? (
                    <Text style={styles.infoSub}>{invoice.userId.email}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.infoBox}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Date</Text>
                  <Text style={styles.infoValue}>{formatInvoiceDate(invoice.createdAt)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.tags}>
              <Text style={styles.tag}>
                {PAYMENT_METHOD_LABELS[invoice.paymentMethod] ?? invoice.paymentMethod}
              </Text>
              <Text style={styles.tagMono}>{invoice.invoiceQrCode}</Text>
            </View>

            <Text style={styles.sectionTitle}>Détail des articles</Text>
            {invoice.items.map((item, i) => (
              <View key={i} style={styles.lineItem}>
                <View style={styles.lineLeft}>
                  <Text style={styles.lineName}>{item.productId.name}</Text>
                  <Text style={styles.lineMeta}>
                    {item.quantity} × {formatPrice(item.price)}
                  </Text>
                </View>
                <Text style={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total</Text>
                <Text>{formatPrice(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA (10%)</Text>
                <Text>{formatPrice(invoice.taxAmount)}</Text>
              </View>
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandLabel}>Total TTC</Text>
                <Text style={styles.grandValue}>{formatPrice(invoice.totalAmount)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!isPaid && (
          <Button
            title={
              isConfirming
                ? 'Validation en cours...'
                : `Confirmer l'encaissement · ${formatPrice(invoice.totalAmount)}`
            }
            onPress={onConfirm}
            loading={isConfirming}
            style={styles.confirmBtn}
          />
        )}
        <Button title="Scanner un autre client" variant="outline" onPress={onScanNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#dcfce7',
    borderBottomWidth: 1,
    borderBottomColor: '#86efac',
  },
  successTitle: { fontWeight: '700', color: '#15803d' },
  successSub: { fontSize: 12, color: '#166534' },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
  error: {
    color: colors.error,
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: theme.radius.lg,
  },
  amountCard: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.xl,
    padding: 20,
    alignItems: 'center',
  },
  amountLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.9,
  },
  amountValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 6 },
  amountMeta: { color: '#fff', fontSize: 12, opacity: 0.85, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: { padding: 16, gap: 14 },
  infoRow: { gap: 10 },
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: colors.muted,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: colors.mutedForeground },
  infoValue: { fontWeight: '700', marginTop: 2 },
  infoSub: { fontSize: 11, color: colors.mutedForeground },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#fef9c3',
    color: '#854d0e',
  },
  tagMono: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.muted,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineLeft: { flex: 1, paddingRight: 12 },
  lineName: { fontWeight: '600', fontSize: 14 },
  lineMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  lineTotal: { fontWeight: '700' },
  totals: {
    backgroundColor: colors.muted,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { color: colors.mutedForeground },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  grandLabel: { fontWeight: '800', fontSize: 16 },
  grandValue: { fontWeight: '800', fontSize: 18, color: colors.primary },
  footer: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  confirmBtn: { backgroundColor: '#16a34a' },
});
