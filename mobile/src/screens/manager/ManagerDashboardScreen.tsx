import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { formatPrice } from '../../lib/currency';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/orderLabels';
import { colors, theme } from '../../theme';

interface StoreInfo {
  _id: string;
  name: string;
  city: string;
  governorate: string;
  address: string;
}

interface OrderRow {
  _id: string;
  userId: { name: string };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paidAt?: string;
  createdAt: string;
}

export function ManagerDashboardScreen({
  onGoProducts,
  onGoCashiers,
}: {
  onGoProducts: () => void;
  onGoCashiers: () => void;
}) {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState({ products: 0, cashiers: 0, paidInStore: 0, storeRevenue: 0 });
  const [recentPayments, setRecentPayments] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const storeRes = await apiClient.getMyStore();
      if (storeRes.success && storeRes.data) {
        const storeData = storeRes.data as StoreInfo;
        setStore(storeData);
        const [productsRes, cashiersRes, ordersRes] = await Promise.all([
          apiClient.getProducts(undefined, undefined, storeData._id),
          apiClient.getStoreCashiers(storeData._id),
          apiClient.getManagerOrders(),
        ]);
        const orders = (ordersRes.data as OrderRow[]) || [];
        const paidInStore = orders.filter(
          (o) => o.status === 'paid' && ['cash_register', 'cash'].includes(o.paymentMethod)
        );
        setRecentPayments(paidInStore.slice(0, 5));
        setStats({
          products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
          cashiers: Array.isArray(cashiersRes.data) ? cashiersRes.data.length : 0,
          paidInStore: paidInStore.length,
          storeRevenue: paidInStore.reduce((sum, o) => sum + o.totalAmount, 0),
        });
      }
      setLoading(false);
    };
    void load();
  }, []);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>Bonjour, {user?.name}</Text>
      {store && (
        <View style={styles.storeCard}>
          <Ionicons name="location-outline" size={20} color={colors.primary} />
          <View style={styles.storeText}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddr}>
              {store.address}, {store.city} — {store.governorate}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Paiements boutique</Text>
          <Text style={styles.statValue}>{stats.paidInStore}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Encaissé</Text>
          <Text style={[styles.statValue, styles.statPrimary]}>{formatPrice(stats.storeRevenue)}</Text>
        </View>
        <Pressable style={styles.statCard} onPress={onGoProducts}>
          <Ionicons name="cube-outline" size={22} color={colors.primary} />
          <Text style={styles.statValue}>{stats.products}</Text>
          <Text style={styles.statLabel}>Produits</Text>
        </Pressable>
        <Pressable style={styles.statCard} onPress={onGoCashiers}>
          <Ionicons name="people-outline" size={22} color={colors.primary} />
          <Text style={styles.statValue}>{stats.cashiers}</Text>
          <Text style={styles.statLabel}>Caissiers</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Derniers paiements en boutique</Text>
      {recentPayments.length === 0 ? (
        <Text style={styles.empty}>Aucun paiement récent</Text>
      ) : (
        recentPayments.map((o) => (
          <View key={o._id} style={styles.paymentRow}>
            <View>
              <Text style={styles.paymentRef}>#{o._id.slice(-6).toUpperCase()}</Text>
              <Text style={styles.paymentMeta}>{o.userId?.name}</Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{formatPrice(o.totalAmount)}</Text>
              <Text style={styles.paymentMeta}>
                {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24, gap: 14 },
  title: { fontSize: 24, fontWeight: '800' },
  storeCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  storeText: { flex: 1 },
  storeName: { fontWeight: '800', fontSize: 16 },
  storeAddr: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  statLabel: { fontSize: 11, color: colors.mutedForeground },
  statValue: { fontSize: 22, fontWeight: '800' },
  statPrimary: { fontSize: 16, color: colors.primary },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentRef: { fontWeight: '700' },
  paymentMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontWeight: '800', color: colors.primary },
  empty: { color: colors.mutedForeground, textAlign: 'center', paddingVertical: 20 },
});
