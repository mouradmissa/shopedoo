import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppHeader } from '../../components/layout/AppHeader';
import { ProductDetailView } from '../../components/ProductDetailView';
import { ProductItem } from '../../components/ProductCard';
import { colors } from '../../theme';
import { ShopStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ShopStackParamList, 'ProductDetail'>;

export function ProductDetailScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount, refreshCart } = useCart();
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await apiClient.getProduct(productId);
      if (response.success && response.data) {
        setProduct(response.data as ProductItem);
      }
      setLoading(false);
    };
    void load();
  }, [productId]);

  return (
    <View style={styles.root}>
      <AppHeader
        tone="shop"
        sectionLabel="Boutique"
        logoOnPress={() => navigation.navigate('Home')}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        cartCount={itemCount}
        onCart={() => navigation.navigate('Cart')}
        onScanner={() => navigation.navigate('QRScanner')}
        onSignIn={() => navigation.navigate('SignIn')}
        onLogout={logout}
        navItems={[
          {
            key: 'back',
            label: 'Catalogue',
            active: true,
            onPress: () => navigation.goBack(),
          },
          {
            key: 'cart',
            label: 'Panier',
            onPress: () => navigation.navigate('Cart'),
          },
          {
            key: 'scanner',
            label: 'Scanner QR',
            onPress: () => navigation.navigate('QRScanner'),
          },
        ]}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : !product ? (
        <View style={styles.center} />
      ) : (
        <ProductDetailView
          product={product}
          onBack={() => navigation.goBack()}
          backLabel="Retour au catalogue"
          showBackButton
          canAddToCart={isAuthenticated}
          isAdding={adding}
          onAddToCart={
            isAuthenticated
              ? async () => {
                  setAdding(true);
                  const cartProductId =
                    product.storeAvailability?.find((row) => row.stock > 0)?.productId ||
                    product.defaultProductId ||
                    productId;
                  await apiClient.addToCart(cartProductId, 1);
                  await refreshCart();
                  setAdding(false);
                }
              : () => navigation.navigate('SignIn')
          }
        />
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
    backgroundColor: colors.background,
  },
});
