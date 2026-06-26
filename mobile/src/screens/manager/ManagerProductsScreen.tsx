import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { formatPrice } from '../../lib/currency';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../../lib/productCategories';
import { resolveCatalogItemImageUrl } from '../../lib/productImage';
import { ProductDetailView } from '../../components/ProductDetailView';
import { ProductQrDisplay } from '../../components/products/ProductQrDisplay';
import { ProductItem } from '../../components/ProductCard';
import { Button } from '../../components/Button';
import { colors, theme } from '../../theme';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image?: string;
  catalogProductId?: string;
  qrCode?: string;
  qrCodeImage?: string;
  qrCodePayload?: string;
}

interface CatalogOption {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
}

export function ManagerProductsScreen() {
  const [storeId, setStoreId] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<'link' | 'new'>('link');
  const [qrProduct, setQrProduct] = useState<Product | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductItem | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<{
    catalogProductId: string;
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
  }>({
    catalogProductId: '',
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
  });
  const [newForm, setNewForm] = useState<{
    name: string;
    description: string;
    price: string;
    category: string;
    stock: string;
  }>({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const storeRes = await apiClient.getMyStore();
    if (storeRes.success && storeRes.data) {
      const id = (storeRes.data as { _id: string })._id;
      setStoreId(id);
      const [productsRes, catalogRes] = await Promise.all([
        apiClient.getProducts(undefined, undefined, id),
        apiClient.getCatalogProducts(),
      ]);
      if (productsRes.success) setProducts((productsRes.data as Product[]) || []);
      if (catalogRes.success) setCatalogOptions((catalogRes.data as CatalogOption[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const openDetail = async (product: Product) => {
    const res = await apiClient.getProduct(product._id);
    if (res.success && res.data) {
      setDetailProduct(res.data as ProductItem);
    } else {
      setDetailProduct({
        ...product,
        totalStock: product.stock,
      });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const fillFromCatalog = (catalogProductId: string) => {
    const selected = catalogOptions.find((c) => c._id === catalogProductId);
    if (!selected) {
      setLinkForm((p) => ({ ...p, catalogProductId }));
      return;
    }
    setLinkForm({
      catalogProductId,
      name: selected.name,
      description: selected.description || '',
      price: String(selected.price),
      category: selected.category || PRODUCT_CATEGORIES[0],
      stock: '',
    });
    setImageUri(null);
  };

  const handleLink = async () => {
    if (!linkForm.catalogProductId) {
      Alert.alert('Erreur', 'Sélectionnez un produit en ligne');
      return;
    }
    setSubmitting(true);
    const res = await apiClient.createProduct(
      {
        catalogProductId: linkForm.catalogProductId,
        name: linkForm.name,
        description: linkForm.description,
        price: parseFloat(linkForm.price),
        category: linkForm.category,
        stock: parseInt(linkForm.stock, 10) || 0,
        storeId,
      },
      imageUri
    );
    setSubmitting(false);
    if (res.success && res.data) {
      const created = res.data as Product;
      setProducts((prev) => {
        const idx = prev.findIndex((p) => p._id === created._id);
        if (idx >= 0) return prev.map((p) => (p._id === created._id ? created : p));
        return [created, ...prev];
      });
      setShowForm(false);
      setQrProduct(created);
      setImageUri(null);
      setLinkForm({
        catalogProductId: '',
        name: '',
        description: '',
        price: '',
        category: PRODUCT_CATEGORIES[0],
        stock: '',
      });
    } else {
      Alert.alert('Erreur', res.error || 'Ajout échoué');
    }
  };

  const handleCreateNew = async () => {
    setSubmitting(true);
    const res = await apiClient.createProduct(
      {
        name: newForm.name,
        description: newForm.description,
        price: parseFloat(newForm.price),
        category: newForm.category,
        stock: parseInt(newForm.stock, 10) || 0,
        storeId,
      },
      imageUri
    );
    setSubmitting(false);
    if (res.success && res.data) {
      const created = res.data as Product;
      setProducts([created, ...products]);
      setShowForm(false);
      setQrProduct(created);
      setNewForm({
        name: '',
        description: '',
        price: '',
        category: PRODUCT_CATEGORIES[0],
        stock: '',
      });
      setImageUri(null);
    } else {
      Alert.alert('Erreur', res.error || 'Création échouée');
    }
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Supprimer', 'Retirer ce produit du magasin ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const res = await apiClient.deleteProduct(id);
          if (res.success) {
            setProducts(products.filter((p) => p._id !== id));
            if (detailProduct?._id === id) setDetailProduct(null);
          }
        },
      },
    ]);
  };

  if (detailProduct) {
    return (
      <View style={styles.detailRoot}>
        <ProductDetailView
          product={detailProduct}
          onBack={() => setDetailProduct(null)}
          backLabel="Produits magasin"
          showQr
          canAddToCart={false}
        />
      </View>
    );
  }

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.root}>
      <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
        <Ionicons name="add-circle-outline" size={22} color="#fff" />
        <Text style={styles.addBtnText}>Ajouter un produit</Text>
      </Pressable>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {products.map((p) => {
          const img = resolveCatalogItemImageUrl(p);
          return (
            <Pressable key={p._id} style={styles.card} onPress={() => void openDetail(p)}>
              <View style={styles.cardRow}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="cube-outline" size={24} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>
                    {formatPrice(p.price)} · Stock {p.stock}
                  </Text>
                  <Text style={styles.cat}>{CATEGORY_LABELS[p.category] ?? p.category}</Text>
                  {p.qrCode ? (
                    <Text style={styles.qrHint} numberOfLines={1}>
                      QR : {p.qrCode}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
              <View style={styles.actions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    setQrProduct(p);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="qr-code-outline" size={18} color={colors.primary} />
                  <Text style={styles.actionText}>QR</Text>
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    deleteProduct(p._id);
                  }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.error} />
                  <Text style={[styles.actionText, { color: colors.error }]}>Supprimer</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
        {products.length === 0 && <Text style={styles.empty}>Aucun produit en magasin</Text>}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Ajouter un produit</Text>
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeBtn, addMode === 'link' && styles.modeActive]}
              onPress={() => setAddMode('link')}
            >
              <Text style={addMode === 'link' ? styles.modeTextActive : styles.modeText}>
                Lier catalogue
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeBtn, addMode === 'new' && styles.modeActive]}
              onPress={() => setAddMode('new')}
            >
              <Text style={addMode === 'new' ? styles.modeTextActive : styles.modeText}>
                Nouveau
              </Text>
            </Pressable>
          </View>

          {addMode === 'link' ? (
            <>
              <Text style={styles.label}>Produit en ligne</Text>
              <ScrollView horizontal style={styles.catalogScroll} showsHorizontalScrollIndicator={false}>
                {catalogOptions.map((c) => (
                  <Pressable
                    key={c._id}
                    onPress={() => fillFromCatalog(c._id)}
                    style={[
                      styles.catalogChip,
                      linkForm.catalogProductId === c._id && styles.catalogChipActive,
                    ]}
                  >
                    <Text style={styles.catalogChipText} numberOfLines={1}>
                      {c.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Field label="Nom" value={linkForm.name} onChange={(v) => setLinkForm({ ...linkForm, name: v })} />
              <Field label="Prix" value={linkForm.price} onChange={(v) => setLinkForm({ ...linkForm, price: v })} keyboardType="decimal-pad" />
              <Field label="Stock magasin" value={linkForm.stock} onChange={(v) => setLinkForm({ ...linkForm, stock: v })} keyboardType="number-pad" />
            </>
          ) : (
            <>
              <Field label="Nom" value={newForm.name} onChange={(v) => setNewForm({ ...newForm, name: v })} />
              <Field label="Description" value={newForm.description} onChange={(v) => setNewForm({ ...newForm, description: v })} multiline />
              <Field label="Prix" value={newForm.price} onChange={(v) => setNewForm({ ...newForm, price: v })} keyboardType="decimal-pad" />
              <Field label="Stock" value={newForm.stock} onChange={(v) => setNewForm({ ...newForm, stock: v })} keyboardType="number-pad" />
            </>
          )}

          <Pressable style={styles.imagePick} onPress={() => void pickImage()}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={styles.imagePickText}>{imageUri ? 'Photo sélectionnée' : 'Ajouter une photo'}</Text>
          </Pressable>

          <Button
            title={addMode === 'link' ? 'Lier au magasin' : 'Créer le produit'}
            onPress={() => void (addMode === 'link' ? handleLink() : handleCreateNew())}
            loading={submitting}
          />
          <Button title="Annuler" variant="outline" onPress={() => setShowForm(false)} />
        </ScrollView>
      </Modal>

      <Modal visible={!!qrProduct} animationType="fade" transparent onRequestClose={() => setQrProduct(null)}>
        <View style={styles.qrOverlay}>
          <View style={styles.qrBox}>
            <Text style={styles.qrTitle}>QR produit</Text>
            {qrProduct ? (
              <ProductQrDisplay
                qrCode={qrProduct.qrCode}
                qrCodeImage={qrProduct.qrCodeImage}
                qrCodePayload={qrProduct.qrCodePayload}
                productName={qrProduct.name}
                productId={qrProduct._id}
              />
            ) : null}
            <Button title="Fermer" onPress={() => setQrProduct(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && styles.inputMulti]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  detailRoot: { flex: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 10,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.muted },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  name: { fontWeight: '800', fontSize: 15 },
  meta: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  cat: { fontSize: 11, color: colors.primary, marginTop: 4 },
  qrHint: { fontSize: 10, color: colors.mutedForeground, marginTop: 4, fontFamily: 'monospace' },
  actions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: 20, gap: 12, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeText: { fontWeight: '600' },
  modeTextActive: { fontWeight: '700', color: '#fff' },
  label: { fontWeight: '600', fontSize: 13 },
  catalogScroll: { maxHeight: 44, marginBottom: 8 },
  catalogChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.muted,
    marginRight: 8,
    maxWidth: 140,
  },
  catalogChipActive: { backgroundColor: colors.primary },
  catalogChipText: { fontSize: 12, fontWeight: '600' },
  field: { gap: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    backgroundColor: colors.card,
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  imagePick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    borderStyle: 'dashed',
  },
  imagePickText: { fontWeight: '600', color: colors.primary },
  qrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  qrBox: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.xl,
    padding: 20,
    gap: 12,
  },
  qrTitle: { fontWeight: '800', textAlign: 'center', fontSize: 18 },
});
