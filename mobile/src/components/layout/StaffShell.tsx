import React, { ReactNode } from 'react';
import {
  Alert,
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
import { AppHeader, NavItem } from './AppHeader';

interface StaffShellProps {
  sectionLabel: string;
  userSubtitle?: string;
  userName?: string;
  navItems: NavItem[];
  onLogout: () => void;
  logoOnPress?: () => void;
  children: ReactNode;
  style?: ViewStyle;
  /** Désactiver le scroll (ex. scanner caméra plein écran) */
  scrollable?: boolean;
}

export function StaffShell({
  sectionLabel,
  userName,
  userSubtitle,
  navItems,
  onLogout,
  logoOnPress,
  children,
  scrollable = true,
}: StaffShellProps) {
  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: onLogout },
    ]);
  };

  return (
    <View style={styles.root}>
      <AppHeader
        tone="staff"
        sectionLabel={sectionLabel}
        isAuthenticated
        userName={userName}
        userSubtitle={userSubtitle}
        onLogout={handleLogout}
        logoOnPress={logoOnPress}
        navItems={navItems}
      />
      {scrollable ? (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.contentFill}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 32 },
  contentFill: { flex: 1 },
});
