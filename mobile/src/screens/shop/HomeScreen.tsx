import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { AppHeader } from '../../components/layout/AppHeader';
import { ShopFooter } from '../../components/layout/ShopFooter';
import { ShopEdooLogo } from '../../components/brand/ShopEdooLogo';
import { ProductCard, ProductItem } from '../../components/ProductCard';
import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../../lib/productCategories';
import { colors, theme } from '../../theme';
import { ShopStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ShopStackParamList, 'Home'>;

const CATEGORIES = [
  { id: 'all', label: CATEGORY_LABELS.all },
  ...PRODUCT_CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

const FEATURES = [
  {
    icon: 'phone-portrait-outline' as const,
    title: 'Catalogue complet',
    text: 'Forfaits, accessoires et services sélectionnés pour vous, mis à jour en temps réel.',
  },
  {
    icon: 'location-outline' as const,
    title: 'Partout en Tunisie',
    text: 'Vérifiez la disponibilité par gouvernorat et récupérez en boutique près de chez vous.',
  },
  {
    icon: 'card-outline' as const,
    title: 'Payez comme vous voulez',
    text: 'Carte bancaire en ligne, espèces à la livraison ou règlement rapide à la caisse.',
  },
  {
    icon: 'qr-code-outline' as const,
    title: 'Scan QR instantané',
    text: 'Scannez un produit en magasin et ajoutez-le au panier en quelques secondes.',
  },
];

const STATS = [
  { value: '24', label: 'Gouvernorats' },
  { value: '100+', label: 'Produits' },
  { value: '3', label: 'Modes de paiement' },
  { value: '24/7', label: 'Commande en ligne' },
];

export function HomeScreen({ navigation }: Props) {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount, refreshCart } = useCart();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const catalogueY = useRef(0);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const response = await apiClient.getProductCatalog(
      category === 'all' ? undefined : category
    );
    if (response.success) {
      setProducts(
        ((response.data as ProductItem[]) || []).map((item) => ({
          ...item,
          stock: item.totalStock ?? item.stock ?? 0,
          defaultProductId:
            item.defaultProductId ||
            item.storeAvailability?.find((row) => row.stock > 0)?.productId,
        }))
      );
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  const handleAddToCart = async (productId: string, cardId: string) => {
    if (!isAuthenticated) {
      navigation.navigate('SignIn');
      return;
    }
    setAddingId(cardId);
    await apiClient.addToCart(productId, 1);
    await refreshCart();
    setAddingId(null);
  };

  const scrollToCatalogue = () => {
    scrollRef.current?.scrollTo({ y: catalogueY.current, animated: true });
  };

  return (
    <View style={styles.root}>
      <AppHeader
        tone="shop"
        sectionLabel="Boutique"
        logoOnPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        cartCount={itemCount}
        onCart={() => navigation.navigate('Cart')}
        onScanner={() => navigation.navigate('QRScanner')}
        onSignIn={() => navigation.navigate('SignIn')}
        onLogout={logout}
        navItems={[
          {
            key: 'home',
            label: 'Accueil',
            active: true,
            onPress: () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
          },
          {
            key: 'catalogue',
            label: 'Catalogue',
            onPress: scrollToCatalogue,
          },
          {
            key: 'scanner',
            label: 'Scanner QR',
            onPress: () => navigation.navigate('QRScanner'),
          },
        ]}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['rgba(255,49,49,0.08)', colors.background, colors.background]}
          style={styles.hero}
        >
          <View style={styles.heroInner}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Boutique officielle Shop-Edoo</Text>
            </View>
            <Text style={styles.heroTitle}>
              Shop-Edoo vous accompagne{' '}
              <Text style={styles.heroAccent}>partout en Tunisie</Text>
            </Text>
            <Text style={styles.heroSub}>
              Forfaits, smartphones et accessoires — commandez en ligne en toute sécurité ou
              passez en boutique. Stock disponible dans les 24 gouvernorats.
            </Text>
            <View style={styles.heroCtas}>
              <Pressable style={styles.ctaPrimary} onPress={scrollToCatalogue}>
                <Ionicons name="bag-handle-outline" size={18} color={colors.primaryForeground} />
                <Text style={styles.ctaPrimaryText}>Découvrir le catalogue</Text>
              </Pressable>
              {!isAuthenticated ? (
                <Pressable
                  style={styles.ctaSecondary}
                  onPress={() => navigation.navigate('SignUp')}
                >
                  <Text style={styles.ctaSecondaryText}>Créer mon compte gratuit</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={styles.ctaSecondary}
                  onPress={() => navigation.navigate('Cart')}
                >
                  <Text style={styles.ctaSecondaryText}>Voir mon panier</Text>
                </Pressable>
              )}
            </View>
            <ShopEdooLogo height={48} style={styles.heroLogo} />
            <View style={styles.statsGrid}>
              {STATS.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pourquoi choisir shopedoo ?</Text>
          <Text style={styles.sectionSub}>
            Une expérience d'achat simple, rapide et pensée pour les clients tunisiens.
          </Text>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offerBanner}>
          <LinearGradient
            colors={['rgba(245,196,0,0.18)', colors.background, 'rgba(245,196,0,0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.offerGradient}
          >
            <View style={styles.offerBadge}>
              <Text style={styles.offerBadgeText}>Offre</Text>
            </View>
            <Text style={styles.offerTitle}>Offre limitée — Ne ratez pas le stock</Text>
            <Text style={styles.offerSub}>
              Les meilleures offres partent vite. Ajoutez au panier avant rupture.
            </Text>
            <Pressable style={styles.ctaPrimary} onPress={scrollToCatalogue}>
              <Text style={styles.ctaPrimaryText}>Voir les offres</Text>
            </Pressable>
          </LinearGradient>
        </View>

        <View
          style={styles.section}
          onLayout={(e) => {
            catalogueY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionTitle}>Nos produits phares</Text>
          <Text style={styles.sectionSub}>
            Parcourez le catalogue et filtrez par catégorie pour trouver votre prochain achat.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                style={[styles.categoryPill, category === cat.id && styles.categoryPillActive]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : products.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Aucun produit dans cette catégorie pour le moment.
              </Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((item) => (
                <View key={item._id} style={styles.productCell}>
                  <ProductCard
                    product={item}
                    onPress={() =>
                      navigation.navigate('ProductDetail', {
                        productId: item.catalogProductId || item._id,
                      })
                    }
                    onAddToCart={(pid) => void handleAddToCart(pid, item._id)}
                    canAddToCart={isAuthenticated}
                    adding={addingId === item._id}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <ShopFooter
          onCatalogue={scrollToCatalogue}
          onCart={() => navigation.navigate('Cart')}
          onScanner={() => navigation.navigate('QRScanner')}
          onSignIn={() => navigation.navigate('SignIn')}
          onSignUp={() => navigation.navigate('SignUp')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  hero: { paddingBottom: 24 },
  heroInner: { padding: theme.spacing.page, paddingTop: 20 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,49,49,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,49,49,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    color: colors.foreground,
    marginBottom: 12,
  },
  heroAccent: { color: colors.primary },
  heroSub: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.mutedForeground,
    marginBottom: 20,
  },
  heroCtas: { gap: 10, marginBottom: 24 },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.xl,
    ...theme.shadow.primary,
  },
  ctaPrimaryText: {
    color: colors.primaryForeground,
    fontWeight: '800',
    fontSize: 15,
  },
  ctaSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radius.xl,
  },
  ctaSecondaryText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 15,
  },
  heroLogo: { alignSelf: 'center', marginBottom: 20 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: 'rgba(245,245,245,0.9)',
    borderRadius: theme.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: theme.spacing.page,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 14,
    color: colors.mutedForeground,
    lineHeight: 21,
    marginBottom: 16,
  },
  featureCard: {
    backgroundColor: colors.card,
    borderRadius: theme.radius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 12,
    ...theme.shadow.card,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(255,49,49,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: { fontWeight: '800', fontSize: 15, marginBottom: 6 },
  featureText: { fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
  offerBanner: {
    marginHorizontal: theme.spacing.page,
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(245,196,0,0.4)',
    marginBottom: 8,
  },
  offerGradient: { padding: 18, gap: 8 },
  offerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245,196,0,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(245,196,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  offerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.offerForeground,
    textTransform: 'uppercase',
  },
  offerTitle: { fontWeight: '800', fontSize: 17 },
  offerSub: { fontSize: 13, color: colors.mutedForeground, marginBottom: 8 },
  categories: { paddingBottom: 12, gap: 8 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...theme.shadow.primary,
  },
  categoryText: { fontSize: 13, fontWeight: '700', color: colors.foreground },
  categoryTextActive: { color: colors.primaryForeground },
  loader: { marginVertical: 40 },
  emptyBox: {
    padding: 40,
    borderRadius: theme.radius['2xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: 'rgba(245,245,245,0.5)',
    alignItems: 'center',
  },
  emptyText: { color: colors.mutedForeground, textAlign: 'center' },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productCell: {
    width: '50%',
    padding: 6,
  },
});
