import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { parseScannedQrData } from '../../lib/parseProductQr';
import { INVOICE_QR_PREFIX } from '../../lib/invoiceQr';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageTitleBar } from '../../components/layout/PageTitleBar';
import { colors } from '../../theme';
import { ShopStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ShopStackParamList, 'QRScanner'>;

export function QRScannerScreen({ navigation }: Props) {
  const { isAuthenticated, logout } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [resolving, setResolving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setResolving(false);
    }, [])
  );

  useEffect(() => {
    if (!permission?.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (scanned || resolving) return;
    setScanned(true);
    setResolving(true);

    if (data.startsWith(INVOICE_QR_PREFIX)) {
      setResolving(false);
      Alert.alert('QR facture', 'Ce QR est une facture caisse. Utilisez l\'espace caissier pour l\'encaisser.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    const parsed = parseScannedQrData(data);
    if (!parsed) {
      setResolving(false);
      Alert.alert('QR invalide', 'Ce code QR ne correspond pas à un produit Shop-Edoo.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
      return;
    }

    try {
      let productId: string | null = null;

      if (parsed.type === 'product') {
        productId = parsed.productId;
      } else {
        const response = await apiClient.getProductByQR(parsed.code);
        if (response.success && response.data) {
          productId = (response.data as { _id: string })._id;
        }
      }

      if (!productId) {
        throw new Error('Produit introuvable');
      }

      navigation.navigate('ProductDetail', { productId });
    } catch {
      setResolving(false);
      Alert.alert('Erreur', 'Impossible de trouver ce produit.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        tone="shop"
        sectionLabel="Boutique"
        isAuthenticated={isAuthenticated}
        onSignIn={() => navigation.navigate('SignIn')}
        onLogout={logout}
        logoOnPress={() => navigation.navigate('Home')}
      />
      <PageTitleBar
        title="Scanner QR"
        backLabel="Boutique"
        onBack={() => navigation.navigate('Home')}
        icon={<Ionicons name="qr-code-outline" size={18} color={colors.primary} />}
      />

      {!permission ? (
        <View style={styles.center}>
          <Text>Chargement de la caméra...</Text>
        </View>
      ) : !permission.granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.message}>Accès caméra requis pour scanner les produits.</Text>
          <Text style={styles.link} onPress={() => void requestPermission()}>
            Autoriser la caméra
          </Text>
        </View>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcode}
          />
          <Text style={styles.hint}>
            {resolving ? 'Ouverture du produit...' : 'Placez le QR code dans le cadre'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  camera: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  hint: {
    textAlign: 'center',
    padding: 16,
    color: colors.mutedForeground,
    fontSize: 14,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: { textAlign: 'center', color: colors.mutedForeground },
  link: { color: colors.primary, fontWeight: '700' },
});
