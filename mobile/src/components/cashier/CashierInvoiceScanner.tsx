import React, { useState } from 'react';
import { Alert, StyleSheet, Text, Vibration, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import {
  CashierInvoiceView,
  INVOICE_QR_PREFIX,
  parseInvoiceQr,
  qrPayloadToCashierView,
} from '../../lib/invoiceQr';
import { CashierInvoiceDisplay } from '../cashier/CashierInvoiceDisplay';
import { colors } from '../../theme';

export function CashierInvoiceScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [invoice, setInvoice] = useState<CashierInvoiceView | null>(null);
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned || invoice) return;
    if (!data.startsWith(INVOICE_QR_PREFIX)) return;

    const payload = parseInvoiceQr(data);
    if (!payload) {
      setScanned(true);
      Alert.alert('QR invalide', 'Ce QR n\'est pas une facture Shop-Edoo.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    setScanned(true);
    setError('');
    setConfirmed(false);
    setInvoice(qrPayloadToCashierView(payload));
    Vibration.vibrate(120);
  };

  const confirmPayment = async () => {
    if (!invoice?.invoiceQrCode) return;
    setIsConfirming(true);
    setError('');
    const response = await apiClient.confirmCashPayment(invoice.invoiceQrCode);
    setIsConfirming(false);

    if (response.success) {
      setConfirmed(true);
      setInvoice({ ...invoice, status: 'paid' });
      Vibration.vibrate(120);
    } else {
      setError(response.error || 'Échec de la confirmation');
    }
  };

  const scanNext = () => {
    setInvoice(null);
    setConfirmed(false);
    setError('');
    setScanned(false);
  };

  if (invoice) {
    return (
      <CashierInvoiceDisplay
        invoice={invoice}
        confirmed={confirmed}
        error={error}
        isConfirming={isConfirming}
        onConfirm={() => void confirmPayment()}
        onScanNext={scanNext}
      />
    );
  }

  return (
    <View style={styles.root}>
      {!permission ? (
        <View style={styles.center}>
          <Text>Chargement de la caméra...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.message}>Autorisez la caméra pour scanner les factures clients.</Text>
          <Text style={styles.link} onPress={() => void requestPermission()}>
            Autoriser la caméra
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcode}
            />
            <View style={styles.frame} pointerEvents="none" />
          </View>
          <View style={styles.hintBox}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            <Text style={styles.hint}>Scannez le QR facture sur le téléphone du client</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cameraWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 280,
  },
  camera: { flex: 1 },
  frame: {
    ...StyleSheet.absoluteFillObject,
    margin: 40,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { flex: 1, fontWeight: '600', fontSize: 14 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: { textAlign: 'center', color: colors.mutedForeground },
  link: { color: colors.primary, fontWeight: '700' },
  error: {
    color: colors.error,
    textAlign: 'center',
    margin: 16,
  },
});
