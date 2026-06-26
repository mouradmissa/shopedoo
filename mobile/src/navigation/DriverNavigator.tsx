import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { StaffShell } from '../components/layout/StaffShell';
import { formatPrice } from '../lib/currency';
import { colors, theme } from '../theme';

const Stack = createNativeStackNavigator();

function DriverMain() {
  const { user, logout } = useAuth();
  const [active, setActive] = useState<any[]>([]);
  const [archive, setArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [a, b] = await Promise.all([
      apiClient.getDriverOrders(),
      apiClient.getDriverArchive(),
    ]);
    if (a.success) setActive((a.data as any[]) || []);
    if (b.success) setArchive((b.data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <StaffShell
      sectionLabel="Livreur"
      userName={user?.name}
      userSubtitle="Livraisons"
      navItems={[
        { key: 'active', label: 'En cours', active: true, onPress: () => {} },
      ]}
      onLogout={logout}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={styles.section}>En cours</Text>
          {active.map((item) => (
            <View key={item._id} style={styles.card}>
              <Text style={styles.itemTitle}>#{String(item._id).slice(-6)}</Text>
              <Text style={styles.itemMeta}>{formatPrice(item.totalAmount)}</Text>
              {item.shippingAddress && <Text style={styles.itemMeta}>{item.shippingAddress}</Text>}
              <Pressable
                style={styles.deliverBtn}
                onPress={async () => {
                  await apiClient.markOrderDelivered(item._id);
                  await load();
                }}
              >
                <Text style={styles.deliverText}>Marquer livré</Text>
              </Pressable>
            </View>
          ))}
          {active.length === 0 && <Text style={styles.empty}>Aucune livraison active</Text>}
          {archive.length > 0 && (
            <>
              <Text style={[styles.section, { marginTop: 24 }]}>Archives</Text>
              {archive.map((item) => (
                <View key={item._id} style={styles.card}>
                  <Text style={styles.itemTitle}>#{String(item._id).slice(-6)} · Livré</Text>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </StaffShell>
  );
}

const styles = StyleSheet.create({
  section: { fontWeight: '800', fontSize: 16, marginBottom: 10 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
  },
  itemTitle: { fontWeight: '700' },
  itemMeta: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },
  deliverBtn: {
    marginTop: 10,
    backgroundColor: colors.success,
    padding: 10,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  deliverText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 20 },
});

export function DriverNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverMain" component={DriverMain} />
    </Stack.Navigator>
  );
}
