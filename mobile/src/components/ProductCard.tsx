import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '../lib/currency';
import { formatCategory } from '../lib/productCategories';
import { resolveCatalogItemImageUrl } from '../lib/productImage';
import { OnlineStockBadge } from './products/OnlineStockBadge';
import { colors, theme } from '../theme';

export interface StoreAvailability {
  storeId: string;
  storeName: string;
  city: string;
  governorate: string;
  stock: number;
  productId: string;
  price: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  onlineStock?: number;
  storeStock?: number;
  totalStock?: number;
  image?: string;
  storeAvailability?: StoreAvailability[];
  defaultProductId?: string;
  catalogProductId?: string;
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
}

interface ProductCardProps {
  product: ProductItem;
  onPress: () => void;
  onAddToCart?: (productId: string) => void;
  canAddToCart?: boolean;
  adding?: boolean;
}

function pickProductIdForCart(product: ProductItem): string {
  const inStock = product.storeAvailability?.find((row) => row.stock > 0);
  return inStock?.productId ?? product.defaultProductId ?? product._id;
}

export function ProductCard({
  product,
  onPress,
  onAddToCart,
  canAddToCart = true,
  adding,
}: ProductCardProps) {
  const [showAvailability, setShowAvailability] = useState(false);
  const [imageError, setImageError] = useState(false);
  const displayStock = product.totalStock ?? product.stock;
  const onlineStock = product.onlineStock ?? 0;
  const availableStores =
    product.storeAvailability?.filter((row) => row.stock > 0) ?? [];
  const imageUrl = resolveCatalogItemImageUrl(product);

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.imageWrap}>
          {imageUrl && !imageError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={styles.noImageWrap}>
              <Ionicons name="cube-outline" size={32} color={colors.mutedForeground} />
              <Text style={styles.noImage}>Pas d'image</Text>
            </View>
          )}
          {displayStock > 0 && (
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>En stock</Text>
            </View>
          )}
          {displayStock === 0 && (
            <View style={styles.outOverlay}>
              <Text style={styles.outText}>Rupture de stock</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.body}>
        <Pressable onPress={onPress}>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
        </Pressable>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>

        <OnlineStockBadge onlineStock={onlineStock} />

        {availableStores.length > 0 && (
          <View style={styles.availBlock}>
            <Pressable
              onPress={() => setShowAvailability((v) => !v)}
              style={styles.availToggle}
            >
              <View style={styles.availToggleLeft}>
                <Ionicons name="location-outline" size={14} color={colors.primary} />
                <Text style={styles.availToggleText}>
                  {showAvailability ? 'Masquer' : 'Disponibilité gouvernorat'}
                </Text>
              </View>
              <Ionicons
                name={showAvailability ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.mutedForeground}
              />
            </Pressable>
            {showAvailability && (
              <View style={styles.availList}>
                {availableStores.map((row) => (
                  <View key={row.storeId} style={styles.availRow}>
                    <Text style={styles.availCity} numberOfLines={1}>
                      {row.city} ({row.governorate})
                    </Text>
                    <Text style={styles.availQty}>{row.stock}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{formatCategory(product.category)}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          {onAddToCart && (
            <Pressable
              onPress={() => onAddToCart(pickProductIdForCart(product))}
              disabled={displayStock === 0 || !canAddToCart || adding}
              style={[
                styles.cartBtn,
                (displayStock === 0 || !canAddToCart) && styles.disabled,
              ]}
            >
              <Text style={styles.cartBtnText}>{adding ? '...' : 'Panier'}</Text>
            </Pressable>
          )}
          <Pressable onPress={onPress} style={styles.detailBtn}>
            <Text style={styles.detailBtnText}>Détails</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: theme.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.muted,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
  },
  noImage: {
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 11,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  stockBadgeText: {
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '700',
  },
  outOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  outText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  body: {
    padding: 12,
    gap: 6,
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 14,
    color: colors.foreground,
  },
  description: {
    fontSize: 11,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
  availBlock: {
    marginTop: 2,
  },
  availToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  availToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  availToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    flex: 1,
  },
  availList: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    padding: 8,
    backgroundColor: 'rgba(232,232,232,0.3)',
    maxHeight: 100,
  },
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  availCity: {
    fontSize: 10,
    color: colors.mutedForeground,
    flex: 1,
  },
  availQty: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(15,15,15,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.md,
  },
  categoryText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 6,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: theme.radius.xl,
    paddingVertical: 10,
    alignItems: 'center',
    ...theme.shadow.primary,
  },
  cartBtnText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 13,
  },
  detailBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  detailBtnText: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.foreground,
  },
  disabled: {
    opacity: 0.5,
  },
});
