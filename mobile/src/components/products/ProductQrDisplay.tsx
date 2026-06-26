import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { resolveProductQrImageUrl, normalizeMediaUrl } from '../../lib/productImage';
import { colors, theme } from '../../theme';

interface ProductQrDisplayProps {
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
  productName?: string;
  productId?: string;
  compact?: boolean;
}

export function ProductQrDisplay({
  qrCode,
  qrCodeImage,
  qrCodePayload,
  productName,
  productId,
  compact = false,
}: ProductQrDisplayProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUri =
    normalizeMediaUrl(qrCodeImage) ||
    (productId ? resolveProductQrImageUrl(productId) : undefined);

  if (!qrCode && !imageUri && !qrCodePayload) return null;

  const size = compact ? 112 : 176;
  const showSvg = imageFailed || (!imageUri && !!qrCodePayload);

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={styles.title}>Code QR produit</Text>
      <View style={styles.center}>
        {showSvg && qrCodePayload ? (
          <View style={[styles.qrFrame, { width: size, height: size }]}>
            <QRCode value={qrCodePayload} size={size - 24} />
          </View>
        ) : imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.qrImage, { width: size, height: size }]}
            resizeMode="contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.qrFrame, { width: size, height: size }]} />
        )}
        {qrCode ? (
          <Text style={styles.code} selectable>
            {qrCode}
          </Text>
        ) : null}
        {productName ? (
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.xl,
    backgroundColor: colors.card,
    padding: 16,
    gap: 12,
  },
  cardCompact: { padding: 12 },
  title: { fontWeight: '800', fontSize: 15 },
  center: { alignItems: 'center', gap: 8 },
  qrFrame: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  qrImage: {
    backgroundColor: '#fff',
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: colors.foreground,
  },
});
