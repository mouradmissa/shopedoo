import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ShopEdooLogo } from '../brand/ShopEdooLogo';
import { colors, theme } from '../../theme';

const TRUST_ITEMS = [
  { icon: 'location-outline' as const, label: '24 gouvernorats couverts' },
  { icon: 'car-outline' as const, label: 'Livraison rapide en Tunisie' },
  { icon: 'card-outline' as const, label: 'Paiement en ligne sécurisé' },
  { icon: 'qr-code-outline' as const, label: 'Scan QR en boutique' },
];

interface Props {
  onCatalogue?: () => void;
  onCart?: () => void;
  onScanner?: () => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
}

export function ShopFooter({ onCatalogue, onCart, onScanner, onSignIn, onSignUp }: Props) {
  const year = new Date().getFullYear();

  return (
    <View style={styles.footer}>
      <View style={styles.main}>
        <ShopEdooLogo height={36} style={styles.logo} />
        <Text style={styles.desc}>
          La boutique qui réunit forfaits, équipements et services — en ligne et en
          magasin, dans toute la Tunisie.
        </Text>

        <Text style={styles.sectionTitle}>Boutique</Text>
        <FooterLink label="Catalogue produits" onPress={onCatalogue} />
        <FooterLink label="Mon panier" onPress={onCart} />
        <FooterLink label="Scanner un QR" onPress={onScanner} />

        <Text style={[styles.sectionTitle, styles.mt]}>Compte</Text>
        <FooterLink label="Connexion" onPress={onSignIn} />
        <FooterLink label="Inscription gratuite" onPress={onSignUp} />

        <View style={styles.trustHeader}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={styles.sectionTitle}>Nos engagements</Text>
        </View>
        {TRUST_ITEMS.map((item) => (
          <View key={item.label} style={styles.trustRow}>
            <View style={styles.trustIcon}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
            </View>
            <Text style={styles.trustLabel}>{item.label}</Text>
          </View>
        ))}

        <View style={styles.bottom}>
          <Text style={styles.copy}>&copy; {year} shopedoo — Tous droits réservés.</Text>
          <Text style={styles.copySub}>
            Paiement sécurisé · Disponibilité nationale · Service client réactif
          </Text>
        </View>
      </View>
    </View>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Text style={[styles.link, !onPress && styles.linkDisabled]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
  },
  main: {
    padding: theme.spacing.page,
    paddingVertical: 28,
  },
  logo: {
    marginBottom: 12,
  },
  desc: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 320,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    color: colors.foreground,
  },
  mt: { marginTop: 16 },
  link: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 8,
  },
  linkDisabled: {
    opacity: 0.5,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    marginBottom: 10,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  trustIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.lg,
    backgroundColor: 'rgba(255, 49, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
    flex: 1,
  },
  bottom: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  copy: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  copySub: {
    fontSize: 11,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
