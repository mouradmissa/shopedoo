import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { ShopEdooLogo } from '../../components/brand/ShopEdooLogo';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { colors, theme } from '../../theme';
import { ShopStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ShopStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const { signup, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    try {
      await signup(email.trim(), password, name.trim());
      navigation.navigate('Home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription échouée');
    }
  };

  return (
    <LinearGradient
      colors={['rgba(255,49,49,0.06)', colors.background]}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ShopEdooLogo height={44} sectionLabel="Boutique" style={styles.logo} />
        <Text style={styles.title}>Inscription</Text>
        <Text style={styles.subtitle}>Créez votre compte client gratuit</Text>

        <View style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Nom complet"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
          />
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mot de passe"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="S'inscrire" onPress={() => void handleSubmit()} loading={isLoading} />
        </View>

        <Pressable onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 16,
  },
  logo: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '900', color: colors.foreground },
  subtitle: { color: colors.mutedForeground, marginBottom: 8 },
  form: { gap: 12 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: theme.radius.xl,
    padding: 14,
    fontSize: 16,
    color: colors.foreground,
  },
  error: { color: colors.destructive, textAlign: 'center' },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '700' },
});
