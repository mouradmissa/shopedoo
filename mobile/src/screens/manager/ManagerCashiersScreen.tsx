import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiClient } from '../../api/client';
import { Button } from '../../components/Button';
import { colors, theme } from '../../theme';

interface Cashier {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

export function ManagerCashiersScreen() {
  const [storeId, setStoreId] = useState('');
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const storeRes = await apiClient.getMyStore();
    if (storeRes.success && storeRes.data) {
      const id = (storeRes.data as { _id: string })._id;
      setStoreId(id);
      const res = await apiClient.getStoreCashiers(id);
      if (res.success) setCashiers((res.data as Cashier[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert('Erreur', 'Nom, email et mot de passe requis');
      return;
    }
    setSubmitting(true);
    const res = await apiClient.createCashier(storeId, {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
    });
    setSubmitting(false);
    if (res.success && res.data) {
      setCashiers([res.data as Cashier, ...cashiers]);
      setForm({ name: '', email: '', password: '', phone: '' });
      setShowForm(false);
      Alert.alert('Succès', 'Caissier créé');
    } else {
      Alert.alert('Erreur', res.error || 'Création échouée');
    }
  };

  if (loading) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View style={styles.root}>
      <Button title="Nouveau caissier" onPress={() => setShowForm(!showForm)} />

      {showForm && (
        <View style={styles.form}>
          <Field label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Mot de passe" value={form.password} onChange={(v) => setForm({ ...form, password: v })} secure />
          <Field label="Téléphone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Button title="Créer le caissier" onPress={() => void handleCreate()} loading={submitting} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.list}>
        {cashiers.map((c) => (
          <View key={c._id} style={styles.card}>
            <Text style={styles.name}>{c.name}</Text>
            <Text style={styles.meta}>{c.email}</Text>
            {c.phone ? <Text style={styles.meta}>{c.phone}</Text> : null}
          </View>
        ))}
        {cashiers.length === 0 && <Text style={styles.empty}>Aucun caissier</Text>}
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  secure,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  secure?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        style={styles.input}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: 12 },
  form: {
    gap: 10,
    padding: 14,
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { gap: 4 },
  label: { fontWeight: '600', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.lg,
    padding: 12,
    backgroundColor: colors.background,
  },
  list: { gap: 10, paddingBottom: 24, marginTop: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  name: { fontWeight: '800' },
  meta: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40 },
});
