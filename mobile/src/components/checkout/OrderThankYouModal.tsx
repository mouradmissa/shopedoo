import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getThankYouMessage, OrderReceiptData } from '../../lib/orderReceipt';
import { shareOrderReceiptPdf } from '../../lib/shareOrderReceiptPdf';
import { formatPrice } from '../../lib/currency';
import { Button } from '../Button';
import { colors, theme } from '../../theme';

interface Props {
  visible: boolean;
  receipt: OrderReceiptData;
  onClose: () => void;
}

export function OrderThankYouModal({ visible, receipt, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const isPaid = receipt.status === 'paid';
  const { title, message } = getThankYouMessage(
    receipt.customerName,
    receipt.paymentMethod,
    isPaid
  );

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await shareOrderReceiptPdf(receipt);
    } catch (err) {
      Alert.alert(
        'Erreur',
        err instanceof Error ? err.message : 'Impossible de générer le PDF.'
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['rgba(255,49,49,0.12)', colors.card]}
            style={styles.header}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name={isPaid ? 'checkmark-circle' : 'heart'}
                size={40}
                color={isPaid ? '#16a34a' : colors.primary}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Commande</Text>
              <Text style={styles.summaryValue}>#{receipt.orderRef}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(receipt.totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Statut</Text>
              <Text style={[styles.summaryValue, isPaid && styles.paidText]}>
                {isPaid ? 'Payé' : 'En attente'}
              </Text>
            </View>

            <Button
              title="Télécharger le reçu (PDF)"
              onPress={() => void handleDownloadPdf()}
              loading={downloading}
              style={styles.downloadBtn}
            />
            <Pressable onPress={onClose} style={styles.closeLink}>
              <Text style={styles.closeText}>Continuer</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...theme.shadow.card,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.foreground,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  body: {
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { color: colors.mutedForeground, fontSize: 14 },
  summaryValue: { fontWeight: '700', fontSize: 14 },
  totalValue: { fontWeight: '900', fontSize: 18, color: colors.primary },
  paidText: { color: '#16a34a' },
  downloadBtn: { marginTop: 4 },
  closeLink: { alignItems: 'center', paddingVertical: 8 },
  closeText: {
    color: colors.mutedForeground,
    fontWeight: '600',
    fontSize: 14,
  },
});
