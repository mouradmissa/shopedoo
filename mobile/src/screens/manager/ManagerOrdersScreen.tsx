import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiClient } from '../../api/client';
import { formatPrice } from '../../lib/currency';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../lib/orderLabels';
import { colors, theme } from '../../theme';

interface OrderRow {
  _id: string;
  userId: { name: string; email?: string };
  totalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
}

export function ManagerOrdersScreen() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const load = async () => {
    setLoading(true);
    const res = await apiClient.getManagerOrders(filter === 'all' ? undefined : filter);
    if (res.success) setOrders((res.data as OrderRow[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [filter]);

  const paidInStore = orders.filter(
    (o) => o.status === 'paid' && ['cash_register', 'cash'].includes(o.paymentMethod)
  );
  const revenue = paidInStore.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        {(['all', 'pending', 'paid'] as const).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {ORDER_STATUS_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {paidInStore.length} paiement(s) · {formatPrice(revenue)} encaissé
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : orders.length === 0 ? (
        <Text style={styles.empty}>Aucune commande</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {orders.map((o) => (
            <View key={o._id} style={styles.card}>
              <Text style={styles.ref}>#{o._id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.meta}>{o.userId?.name}</Text>
              <Text style={styles.amount}>{formatPrice(o.totalAmount)}</Text>
              <View style={styles.tags}>
                <Text style={styles.tag}>{ORDER_STATUS_LABELS[o.status] ?? o.status}</Text>
                <Text style={styles.tag}>
                  {PAYMENT_METHOD_LABELS[o.paymentMethod] ?? o.paymentMethod}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  filters: { maxHeight: 44, marginBottom: 10 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.foreground },
  filterTextActive: { color: '#fff' },
  summary: {
    padding: 12,
    backgroundColor: colors.muted,
    borderRadius: theme.radius.lg,
    marginBottom: 10,
  },
  summaryText: { fontWeight: '600', fontSize: 13 },
  list: { gap: 10, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  ref: { fontWeight: '800' },
  meta: { fontSize: 13, color: colors.mutedForeground },
  amount: { fontSize: 18, fontWeight: '800', color: colors.primary },
  tags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
});
