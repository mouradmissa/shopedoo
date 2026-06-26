import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { ProductCard, ProductItem } from '../../components/ProductCard';
import { ProductDetailView } from '../../components/ProductDetailView';
import { PRODUCT_CATEGORIES, CATEGORY_LABELS } from '../../lib/productCategories';
import { colors, theme } from '../../theme';

export function CashierProductsScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.getProducts(
      category || undefined,
      search || undefined,
      user?.storeId
    );
    if (res.success) setProducts((res.data as ProductItem[]) || []);
    setLoading(false);
  }, [category, search, user?.storeId]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const openProduct = async (id: string) => {
    setSelectedId(id);
    const res = await apiClient.getProduct(id);
    if (res.success && res.data) setSelectedProduct(res.data as ProductItem);
  };

  if (selectedId && selectedProduct) {
    return (
      <ProductDetailView
        product={selectedProduct}
        onBack={() => {
          setSelectedId(null);
          setSelectedProduct(null);
        }}
        backLabel="Produits"
        canAddToCart={false}
        showQr
      />
    );
  }

  return (
    <View style={styles.root}>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Rechercher un produit..."
        style={styles.search}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <CategoryChip label="Tous" active={!category} onPress={() => setCategory('')} />
        {PRODUCT_CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            label={CATEGORY_LABELS[c] ?? c}
            active={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {products.map((p) => (
            <View key={p._id} style={styles.gridItem}>
              <ProductCard
                product={p}
                onPress={() => void openProduct(p._id)}
                canAddToCart={false}
              />
            </View>
          ))}
          {products.length === 0 && (
            <Text style={styles.empty}>Aucun produit dans ce magasin</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CategoryChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    backgroundColor: colors.card,
    marginBottom: 10,
  },
  filters: { maxHeight: 40, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 999,
    backgroundColor: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    overflow: 'hidden',
  },
  chipActive: { backgroundColor: colors.primary, color: '#fff' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    paddingBottom: 24,
  },
  gridItem: { width: '50%', padding: 6 },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
});
