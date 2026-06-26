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
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../lib/currency';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../../lib/productCategories';
import { resolveCatalogItemImageUrl } from '../../lib/productImage';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/orderLabels';
import { Button } from '../../components/Button';
import { colors, theme } from '../../theme';

interface CatalogItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  image?: string;
}

interface OnlineOrder {
  _id: string;
  userId: { name: string; email: string; phone?: string };
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  shippingAddress: string;
  assignedDriverId?: { _id: string; name: string } | null;
  createdAt: string;
}

interface Driver {
  _id: string;
  name: string;
  email: string;
}

export function OnlineManagerDashboardScreen() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, drivers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const [p, o, d] = await Promise.all([
        apiClient.getCatalogProducts(),
        apiClient.getOnlineOrders(),
        apiClient.getDrivers(),
      ]);
      setStats({
        products: Array.isArray(p.data) ? p.data.length : 0,
        orders: Array.isArray(o.data) ? o.data.length : 0,
        drivers: Array.isArray(d.data) ? d.data.length : 0,
      });
      setLoading(false);
    };
    void load();
  }, [isAuthenticated]);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.dash}>
      <Text style={styles.dashTitle}>Gestion boutique en ligne</Text>
      <Text style={styles.dashSub}>Catalogue, commandes livraison et livreurs</Text>
      <View style={styles.statsRow}>
        <StatBox label="Produits catalogue" value={String(stats.products)} />
        <StatBox label="Commandes" value={String(stats.orders)} />
        <StatBox label="Livreurs" value={String(stats.drivers)} />
      </View>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function OnlineManagerProductsScreen() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: PRODUCT_CATEGORIES[0],
    stock: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await apiClient.getCatalogProducts();
    if (res.success) setProducts((res.data as CatalogItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [isAuthenticated]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    setSubmitting(true);
    const res = await apiClient.createCatalogProduct(
      {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category,
        stock: parseInt(form.stock, 10) || 0,
      },
      imageUri
    );
    setSubmitting(false);
    if (res.success && res.data) {
      setProducts([res.data as CatalogItem, ...products]);
      setShowForm(false);
      setForm({ name: '', description: '', price: '', category: PRODUCT_CATEGORIES[0], stock: '' });
      setImageUri(null);
    } else {
      Alert.alert('Erreur', res.error || 'Création échouée');
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert('Supprimer', 'Retirer du catalogue en ligne ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const res = await apiClient.deleteCatalogProduct(id);
          if (res.success) setProducts(products.filter((p) => p._id !== id));
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.root}>
      <Button title="Nouveau produit en ligne" onPress={() => setShowForm(true)} />
      <ScrollView contentContainerStyle={styles.list}>
        {products.map((p) => {
          const img = resolveCatalogItemImageUrl(p);
          return (
            <View key={p._id} style={styles.card}>
              <View style={styles.cardRow}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbEmpty]}>
                    <Ionicons name="cube-outline" size={24} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.meta}>{formatPrice(p.price)} · Stock {p.stock ?? 0}</Text>
                  <Text style={styles.cat}>{CATEGORY_LABELS[p.category] ?? p.category}</Text>
                </View>
                <Pressable onPress={() => deleteItem(p._id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" onRequestClose={() => setShowForm(false)}>
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Produit catalogue en ligne</Text>
          <FormField label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <FormField label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} multiline />
          <FormField label="Prix" value={form.price} onChange={(v) => setForm({ ...form, price: v })} keyboardType="decimal-pad" />
          <FormField label="Stock en ligne" value={form.stock} onChange={(v) => setForm({ ...form, stock: v })} keyboardType="number-pad" />
          <Pressable style={styles.imagePick} onPress={() => void pickImage()}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
            <Text style={styles.imagePickText}>{imageUri ? 'Photo OK' : 'Photo produit'}</Text>
          </Pressable>
          <Button title="Créer" onPress={() => void handleCreate()} loading={submitting} />
          <Button title="Annuler" variant="outline" onPress={() => setShowForm(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

export function OnlineManagerOrdersScreen() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<OnlineOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const [ordersRes, driversRes] = await Promise.all([
      apiClient.getOnlineOrders(filter === 'all' ? undefined : filter),
      apiClient.getDrivers(),
    ]);
    if (ordersRes.success) setOrders((ordersRes.data as OnlineOrder[]) || []);
    if (driversRes.success) setDrivers((driversRes.data as Driver[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [filter, isAuthenticated]);

  const assignDriver = async (orderId: string, driverId: string) => {
    if (!driverId) return;
    const res = await apiClient.assignOrderDriver(orderId, driverId);
    if (res.success && res.data) {
      setOrders(orders.map((o) => (o._id === orderId ? (res.data as OnlineOrder) : o)));
    } else {
      Alert.alert('Erreur', res.error || 'Assignation échouée');
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {(['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map((s) => (
          <Pressable
            key={s}
            onPress={() => setFilter(s)}
            style={[styles.filterBtn, filter === s && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
              {ORDER_STATUS_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {orders.map((order) => (
            <View key={order._id} style={styles.orderCard}>
              <Text style={styles.ref}>#{order._id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.meta}>
                {order.userId?.name} — {order.userId?.email}
              </Text>
              <Text style={styles.meta}>{order.shippingAddress}</Text>
              <Text style={styles.amount}>{formatPrice(order.totalAmount)}</Text>
              <Text style={styles.tag}>
                {ORDER_STATUS_LABELS[order.status] ?? order.status} ·{' '}
                {PAYMENT_METHOD_LABELS[order.paymentMethod ?? ''] ?? order.paymentMethod}
              </Text>
              {order.assignedDriverId ? (
                <Text style={styles.driverAssigned}>
                  Livreur : {order.assignedDriverId.name}
                </Text>
              ) : (
                <View style={styles.driverRow}>
                  <Text style={styles.assignLabel}>Assigner :</Text>
                  <ScrollView horizontal>
                    {drivers.map((d) => (
                      <Pressable
                        key={d._id}
                        style={styles.driverChip}
                        onPress={() => void assignDriver(order._id, d._id)}
                      >
                        <Text style={styles.driverChipText}>{d.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ))}
          {orders.length === 0 && <Text style={styles.empty}>Aucune commande</Text>}
        </ScrollView>
      )}
    </View>
  );
}

export function OnlineManagerDriversScreen() {
  const { isAuthenticated } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    const res = await apiClient.getDrivers();
    if (res.success) setDrivers((res.data as Driver[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [isAuthenticated]);

  const handleCreate = async () => {
    setSubmitting(true);
    const res = await apiClient.createDriver({
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setDrivers([res.data as Driver, ...drivers]);
      setShowForm(false);
      setForm({ name: '', email: '', password: '', phone: '' });
    } else {
      Alert.alert('Erreur', res.error || 'Création échouée');
    }
  };

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.root}>
      <Button title="Nouveau livreur" onPress={() => setShowForm(!showForm)} />
      {showForm && (
        <View style={styles.form}>
          <FormField label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <FormField label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <FormField label="Mot de passe" value={form.password} onChange={(v) => setForm({ ...form, password: v })} secure />
          <FormField label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Button title="Créer" onPress={() => void handleCreate()} loading={submitting} />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.list}>
        {drivers.map((d) => (
          <View key={d._id} style={styles.card}>
            <Text style={styles.name}>{d.name}</Text>
            <Text style={styles.meta}>{d.email}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function FormField({
  label,
  value,
  onChange,
  multiline,
  keyboardType,
  secure,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 10 },
  dash: { gap: 12 },
  dashTitle: { fontSize: 22, fontWeight: '800' },
  dashSub: { color: colors.mutedForeground },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbEmpty: { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: '800' },
  meta: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  cat: { fontSize: 11, color: colors.primary, marginTop: 2 },
  modal: { flex: 1, backgroundColor: colors.background },
  modalContent: { padding: 20, gap: 12, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  field: { gap: 4 },
  label: { fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    backgroundColor: colors.card,
  },
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
  filters: { maxHeight: 44, marginBottom: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  ref: { fontWeight: '800' },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  tag: { fontSize: 12, color: colors.mutedForeground },
  driverAssigned: { fontSize: 13, fontWeight: '600', color: '#7c3aed', marginTop: 6 },
  driverRow: { marginTop: 8, gap: 6 },
  assignLabel: { fontSize: 12, fontWeight: '600' },
  driverChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.muted,
    borderRadius: 999,
    marginRight: 8,
  },
  driverChipText: { fontSize: 12, fontWeight: '600' },
  form: {
    gap: 10,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
});
