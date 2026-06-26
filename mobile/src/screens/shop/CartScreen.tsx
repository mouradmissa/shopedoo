import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppHeader } from '../../components/layout/AppHeader';
import { PageTitleBar } from '../../components/layout/PageTitleBar';
import { formatPrice } from '../../lib/currency';
import { resolveCatalogItemImageUrl } from '../../lib/productImage';
import { colors, theme } from '../../theme';
import { ShopStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ShopStackParamList, 'Cart'>;

interface CartItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

export function CartScreen({ navigation }: Props) {
  const { isAuthenticated, logout } = useAuth();
  const { cart, isLoading, refreshCart } = useCart();
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshCart();
    }, [refreshCart])
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <AppHeader
          tone="shop"
          sectionLabel="Boutique"
          onSignIn={() => navigation.navigate('SignIn')}
        />
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={64} color={colors.mutedForeground} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Connectez-vous pour voir votre panier</Text>
          <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.ctaPrimaryText}>Se connecter</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const items = cart?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.productId.price * item.quantity,
    0
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const updateQty = async (productId: string, quantity: number) => {
    setUpdating(true);
    if (quantity < 1) {
      await apiClient.removeFromCart(productId);
    } else {
      await apiClient.updateCartItem(productId, quantity);
    }
    await refreshCart();
    setUpdating(false);
  };

  const clearCart = () => {
    Alert.alert('Vider le panier', 'Vider le panier ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider',
        style: 'destructive',
        onPress: async () => {
          setUpdating(true);
          await apiClient.clearCart();
          await refreshCart();
          setUpdating(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.root}>
      <AppHeader
        tone="shop"
        sectionLabel="Boutique"
        isAuthenticated
        cartCount={items.length}
        onCart={() => {}}
        onScanner={() => navigation.navigate('QRScanner')}
        onLogout={logout}
        logoOnPress={() => navigation.navigate('Home')}
      />
      <PageTitleBar
        title="Panier"
        backLabel="Boutique"
        onBack={() => navigation.navigate('Home')}
        icon={<Ionicons name="cart-outline" size={18} color={colors.primary} />}
      />

      {isLoading && !cart ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cart-outline" size={64} color={colors.mutedForeground} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Votre panier est vide</Text>
          <Pressable style={styles.ctaPrimary} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.ctaPrimaryText}>Continuer vos achats</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.productId._id}
            contentContainerStyle={styles.list}
            renderItem={({ item }: { item: CartItem }) => {
              const imageUrl = resolveCatalogItemImageUrl({
                _id: item.productId._id,
                image: item.productId.image,
              });

              return (
                <View style={styles.row}>
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.thumb} />
                  ) : (
                    <View style={[styles.thumb, styles.thumbPlaceholder]} />
                  )}
                  <View style={styles.rowBody}>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.productId.name}
                    </Text>
                    <Text style={styles.price}>{formatPrice(item.productId.price)}</Text>
                    <View style={styles.qtyRow}>
                      <Pressable
                        onPress={() => void updateQty(item.productId._id, item.quantity - 1)}
                        disabled={updating}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="remove" size={16} color={colors.foreground} />
                      </Pressable>
                      <Text style={styles.qty}>{item.quantity}</Text>
                      <Pressable
                        onPress={() => void updateQty(item.productId._id, item.quantity + 1)}
                        disabled={updating}
                        style={styles.qtyBtn}
                      >
                        <Ionicons name="add" size={16} color={colors.foreground} />
                      </Pressable>
                      <Pressable
                        onPress={() => void updateQty(item.productId._id, 0)}
                        disabled={updating}
                        style={styles.trashBtn}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.subtotalCol}>
                    <Text style={styles.subtotalLabel}>Sous-total</Text>
                    <Text style={styles.subtotal}>
                      {formatPrice(item.productId.price * item.quantity)}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListFooterComponent={
              <Pressable onPress={clearCart} disabled={updating}>
                <Text style={styles.clearText}>Vider le panier</Text>
              </Pressable>
            }
          />

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Récapitulatif</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text>{formatPrice(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>TVA (10%)</Text>
              <Text>{formatPrice(tax)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Livraison</Text>
              <Text style={styles.free}>Gratuite</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total}>{formatPrice(total)}</Text>
            </View>
            <Pressable
              style={styles.ctaPrimary}
              onPress={() => navigation.navigate('Checkout')}
            >
              <Text style={styles.ctaPrimaryText}>Passer commande</Text>
            </Pressable>
            <Pressable
              style={styles.ctaOutline}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.ctaOutlineText}>Continuer vos achats</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: { opacity: 0.5, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20, textAlign: 'center' },
  loader: { marginTop: 40 },
  list: { padding: theme.spacing.page, gap: 12, paddingBottom: 8 },
  row: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  thumb: { width: 80, height: 80, borderRadius: theme.radius.lg },
  thumbPlaceholder: { backgroundColor: colors.muted },
  rowBody: { flex: 1, gap: 4 },
  name: { fontWeight: '700', fontSize: 15 },
  price: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  trashBtn: { marginLeft: 4, padding: 8 },
  qty: { fontWeight: '700', minWidth: 24, textAlign: 'center' },
  subtotalCol: { alignItems: 'flex-end', justifyContent: 'center' },
  subtotalLabel: { fontSize: 11, color: colors.mutedForeground },
  subtotal: { fontWeight: '800', fontSize: 16 },
  clearText: {
    color: colors.destructive,
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  summary: {
    padding: theme.spacing.page,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  summaryTitle: { fontWeight: '800', fontSize: 18, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { color: colors.mutedForeground, fontSize: 14 },
  free: { color: colors.success, fontWeight: '600' },
  totalRow: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { fontWeight: '800', fontSize: 16 },
  total: { fontWeight: '900', fontSize: 22, color: colors.primary },
  ctaPrimary: {
    backgroundColor: colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    ...theme.shadow.primary,
  },
  ctaPrimaryText: { color: colors.primaryForeground, fontWeight: '800', fontSize: 15 },
  ctaOutline: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaOutlineText: { fontWeight: '700', color: colors.foreground },
});
