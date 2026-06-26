import React, { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShopEdooLogo } from '../brand/ShopEdooLogo';
import { colors, theme } from '../../theme';

export interface NavItem {
  key: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}

interface AppHeaderProps {
  logoOnPress?: () => void;
  sectionLabel: string;
  tone?: 'shop' | 'staff' | 'default';
  navItems?: NavItem[];
  cartCount?: number;
  isAuthenticated?: boolean;
  userName?: string;
  userSubtitle?: string;
  onSignIn?: () => void;
  onCart?: () => void;
  onScanner?: () => void;
  onLogout?: () => void;
  trailing?: ReactNode;
  style?: ViewStyle;
}

export function AppHeader({
  logoOnPress,
  sectionLabel,
  tone = 'default',
  navItems = [],
  cartCount = 0,
  isAuthenticated,
  userName,
  userSubtitle,
  onSignIn,
  onCart,
  onScanner,
  onLogout,
  trailing,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const isShop = tone === 'shop';
  const isStaff = tone === 'staff';
  const showAuthActions = Boolean(isAuthenticated || onLogout);

  return (
    <View
      style={[
        styles.header,
        isShop && styles.shopHeader,
        isStaff && styles.staffHeader,
        { paddingTop: insets.top },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.logoWrap}>
          <ShopEdooLogo
            height={34}
            sectionLabel={sectionLabel}
            onPress={logoOnPress}
          />
        </View>

        <View style={styles.trailing}>
          {trailing}
          {showAuthActions ? (
            <>
              {onScanner && (
                <Pressable
                  onPress={onScanner}
                  style={styles.iconBtn}
                  accessibilityLabel="Scanner QR"
                >
                  <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
                </Pressable>
              )}
              {onCart && (
                <Pressable
                  onPress={onCart}
                  style={styles.iconBtn}
                  accessibilityLabel="Panier"
                >
                  <Ionicons name="cart-outline" size={22} color={colors.foreground} />
                  {cartCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {cartCount > 99 ? '99+' : cartCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              )}
              {onLogout && (
                <Pressable
                  onPress={onLogout}
                  style={[styles.iconBtn, styles.logoutBtn]}
                  accessibilityLabel="Déconnexion"
                  accessibilityRole="button"
                >
                  <Ionicons name="log-out-outline" size={22} color={colors.primary} />
                </Pressable>
              )}
            </>
          ) : onSignIn ? (
            <Pressable onPress={onSignIn} style={styles.signInBtn}>
              <Ionicons name="log-in-outline" size={16} color={colors.primaryForeground} />
              <Text style={styles.signInText}>Connexion</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {(userName || userSubtitle) && (
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color={colors.primary} />
          </View>
          <View style={styles.userText}>
            {userName ? (
              <Text style={styles.userName} numberOfLines={1}>
                {userName}
              </Text>
            ) : null}
            {userSubtitle ? (
              <Text style={styles.userSubtitle} numberOfLines={1}>
                {userSubtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {navItems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navScroll}
        >
          {navItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              style={[styles.navPill, item.active && styles.navPillActive]}
            >
              <Text style={[styles.navText, item.active && styles.navTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shopHeader: {
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 49, 49, 0.15)',
    ...theme.shadow.card,
  },
  staffHeader: {
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 49, 49, 0.2)',
    backgroundColor: '#fff',
    ...theme.shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.page,
    paddingVertical: 10,
    gap: 8,
    minHeight: 56,
  },
  logoWrap: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 8,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.lg,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 49, 49, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 49, 49, 0.25)',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: theme.radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontSize: 10,
    fontWeight: '800',
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radius.xl,
    ...theme.shadow.primary,
  },
  signInText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 13,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: theme.spacing.page,
    paddingBottom: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 49, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: { flex: 1, minWidth: 0 },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  userSubtitle: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  navScroll: {
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  navPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.lg,
    backgroundColor: colors.muted,
    marginRight: 8,
  },
  navPillActive: {
    backgroundColor: colors.primary,
  },
  navText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  navTextActive: {
    color: colors.primaryForeground,
  },
});
