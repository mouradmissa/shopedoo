import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StaffShell } from '../components/layout/StaffShell';
import { formatPrice } from '../lib/currency';
import { colors, theme } from '../theme';

const Stack = createNativeStackNavigator();

function AdminDashboard({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ stores: 0, products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');

  const load = async () => {
    setLoading(true);
    const [storesRes, productsRes, ordersRes] = await Promise.all([
      apiClient.getStores(),
      apiClient.getProducts(),
      apiClient.getAllOrders(),
    ]);
    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
    const revenue = orders.reduce(
      (sum: number, o: { totalAmount?: number; status?: string }) =>
        o.status !== 'cancelled' ? sum + (o.totalAmount ?? 0) : sum,
      0
    );
    setStats({
      stores: Array.isArray(storesRes.data) ? storesRes.data.length : 0,
      products: Array.isArray(productsRes.data) ? productsRes.data.length : 0,
      orders: orders.length,
      revenue,
    });
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [tab]);

  const navItems = [
    { key: 'dashboard', label: 'Tableau de bord', active: tab === 'dashboard', onPress: () => setTab('dashboard') },
    { key: 'stores', label: 'Boutiques', active: tab === 'stores', onPress: () => setTab('stores') },
    { key: 'products', label: 'Produits', active: tab === 'products', onPress: () => setTab('products') },
    { key: 'orders', label: 'Commandes', active: tab === 'orders', onPress: () => setTab('orders') },
  ];

  return (
    <StaffShell
      sectionLabel="Admin"
      userName={user?.name}
      userSubtitle="Administrateur"
      navItems={navItems}
      onLogout={logout}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : tab === 'dashboard' ? (
        <>
          <Text style={styles.greeting}>Bonjour, {user?.name}</Text>
          <View style={styles.statsGrid}>
            <StatCard label="Boutiques" value={String(stats.stores)} />
            <StatCard label="Produits" value={String(stats.products)} />
            <StatCard label="Commandes" value={String(stats.orders)} />
            <StatCard label="Revenus" value={formatPrice(stats.revenue)} />
          </View>
        </>
      ) : (
        <ListTab tab={tab} />
      )}
    </StaffShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ListTab({ tab }: { tab: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let res;
      if (tab === 'stores') res = await apiClient.getStores();
      else if (tab === 'products') res = await apiClient.getProducts();
      else res = await apiClient.getAllOrders();
      if (res.success) setItems((res.data as any[]) || []);
      setLoading(false);
    };
    void fetch();
  }, [tab]);

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.list}>
      {items.map((item) => (
        <View key={item._id} style={styles.listCard}>
          <Text style={styles.listTitle}>
            {item.name || item.email || `#${String(item._id).slice(-6)}`}
          </Text>
          {item.totalAmount != null && (
            <Text style={styles.listMeta}>{formatPrice(item.totalAmount)} · {item.status}</Text>
          )}
          {item.city && <Text style={styles.listMeta}>{item.city} — {item.governorate}</Text>}
          {item.price != null && <Text style={styles.listMeta}>{formatPrice(item.price)}</Text>}
        </View>
      ))}
      {items.length === 0 && <Text style={styles.empty}>Aucun élément</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 24, fontWeight: '800', marginBottom: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800' },
  list: { gap: 10 },
  listCard: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  listTitle: { fontWeight: '700', marginBottom: 4 },
  listMeta: { fontSize: 13, color: colors.mutedForeground },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
});

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminDashboard} />
    </Stack.Navigator>
  );
}
