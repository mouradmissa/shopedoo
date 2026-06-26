import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCategory } from '../lib/productCategories';
import { formatPrice } from '../lib/currency';
import { resolveCatalogItemImageUrl } from '../lib/productImage';
import { OnlineStockBadge } from './products/OnlineStockBadge';
import { ProductQrDisplay } from './products/ProductQrDisplay';
import { ProductItem } from './ProductCard';
import { colors, theme } from '../theme';

interface Props {
  product: ProductItem;
  onBack: () => void;
  backLabel?: string;
  onAddToCart?: () => void;
  canAddToCart?: boolean;
  isAdding?: boolean;
  showQr?: boolean;
  showBackButton?: boolean;
}

function stockInfo(stock: number) {
  if (stock <= 0) {
    return { label: 'Rupture de stock', style: styles.stockOut };
  }
  if (stock <= 5) {
    return {
      label: `Stock faible — ${stock} restant${stock > 1 ? 's' : ''}`,
      style: styles.stockLow,
    };
  }
  return {
    label: `En stock — ${stock} disponible${stock > 1 ? 's' : ''}`,
    style: styles.stockOk,
  };
}

export function ProductDetailView({
  product,
  onBack,
  backLabel = 'Retour',
  onAddToCart,
  canAddToCart = true,
  isAdding = false,
  showQr = false,
  showBackButton = true,
}: Props) {
  const [showAvailability, setShowAvailability] = useState(false);
  const [imageError, setImageError] = useState(false);
  const insets = useSafeAreaInsets();
  const totalStock = product.totalStock ?? product.stock;
  const onlineStock = product.onlineStock ?? 0;
  const stock = stockInfo(totalStock);
  const imageUrl = resolveCatalogItemImageUrl(product);
  const storeRows = product.storeAvailability ?? [];
  const hasQr =
    showQr &&
    (product.qrCode || product.qrCodeImage || product.qrCodePayload || product._id);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: onAddToCart ? 100 : 24 }]}
      >
        {showBackButton ? (
          <Pressable onPress={onBack} style={styles.back}>
            <Ionicons name="arrow-back" size={18} color={colors.mutedForeground} />
            <Text style={styles.backText}>{backLabel}</Text>
          </Pressable>
        ) : null}

        <View style={styles.imageWrap}>
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons name="cube-outline" size={64} color={colors.mutedForeground} />
          )}
          {totalStock === 0 && (
            <View style={styles.outOverlay}>
              <Text style={styles.outText}>Rupture de stock</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{formatCategory(product.category)}</Text>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>

          <View style={styles.badges}>
            <View style={[styles.stockBadge, stock.style]}>
              <Text style={styles.stockBadgeText}>{stock.label}</Text>
            </View>
            <OnlineStockBadge onlineStock={onlineStock} />
          </View>

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>

          {hasQr ? (
            <ProductQrDisplay
              qrCode={product.qrCode}
              qrCodeImage={product.qrCodeImage}
              qrCodePayload={product.qrCodePayload}
              productName={product.name}
              productId={product._id}
            />
          ) : null}

          {storeRows.length > 0 && (
            <View style={styles.availCard}>
              <Pressable
                onPress={() => setShowAvailability((v) => !v)}
                style={styles.availHeader}
              >
                <View style={styles.availHeaderLeft}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <Text style={styles.availTitle}>Disponibilité par boutique (Tunisie)</Text>
                </View>
                <Ionicons
                  name={showAvailability ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
              {showAvailability &&
                storeRows.map((row) => (
                  <View key={row.storeId} style={styles.availRow}>
                    <View style={styles.availInfo}>
                      <Text style={styles.storeName}>{row.storeName}</Text>
                      <Text style={styles.storeMeta}>
                        {row.city} — {row.governorate}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.storeStock,
                        row.stock > 0 ? styles.storeStockOk : styles.storeStockOut,
                      ]}
                    >
                      <Text
                        style={[
                          styles.storeStockText,
                          row.stock > 0 ? styles.storeStockTextOk : styles.storeStockTextOut,
                        ]}
                      >
                        {row.stock > 0 ? `${row.stock} en stock` : 'Rupture'}
                      </Text>
                    </View>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {onAddToCart && (
        <View style={[styles.stickyBar, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={onAddToCart}
            disabled={totalStock === 0 || !canAddToCart || isAdding}
            style={[
              styles.addBtn,
              (totalStock === 0 || !canAddToCart) && styles.addBtnDisabled,
            ]}
          >
            {isAdding ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Ionicons name="cart-outline" size={20} color={colors.primaryForeground} />
                <Text style={styles.addBtnText}>
                  Ajouter au panier — {formatPrice(product.price)}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: theme.spacing.page },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: { fontSize: 14, color: colors.mutedForeground },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    maxHeight: 360,
    backgroundColor: colors.muted,
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: '100%', height: '100%' },
  outOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  body: { marginTop: 20, gap: 10 },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15,15,15,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  categoryText: { fontSize: 12, color: colors.secondary, fontWeight: '600' },
  name: { fontSize: 24, fontWeight: '800', color: colors.foreground },
  price: { fontSize: 28, fontWeight: '800', color: colors.primary },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    borderWidth: 1,
  },
  stockOk: { backgroundColor: colors.successBg, borderColor: 'rgba(22,163,74,0.2)' },
  stockLow: { backgroundColor: colors.warningBg, borderColor: 'rgba(217,119,6,0.2)' },
  stockOut: { backgroundColor: colors.errorBg, borderColor: 'rgba(220,38,38,0.2)' },
  stockBadgeText: { fontSize: 12, fontWeight: '600', color: colors.foreground },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.mutedForeground,
  },
  availCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
    marginTop: 8,
  },
  availHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  availHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  availTitle: { fontWeight: '700', fontSize: 14, flex: 1 },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  availInfo: { flex: 1 },
  storeName: { fontWeight: '600', fontSize: 14 },
  storeMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  storeStock: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  storeStockOk: { backgroundColor: colors.successBg },
  storeStockOut: { backgroundColor: colors.errorBg },
  storeStockText: { fontSize: 11, fontWeight: '700' },
  storeStockTextOk: { color: '#15803d' },
  storeStockTextOut: { color: colors.error },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: theme.spacing.page,
    paddingTop: 12,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.xl,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadow.primary,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 15,
  },
});
