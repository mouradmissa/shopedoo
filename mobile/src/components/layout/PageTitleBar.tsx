import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, theme } from '../../theme';

interface Props {
  title: string;
  backLabel?: string;
  onBack?: () => void;
  icon?: ReactNode;
}

export function PageTitleBar({ title, backLabel = 'Retour', onBack, icon }: Props) {
  return (
    <View style={styles.bar}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={18} color={colors.mutedForeground} />
          <Text style={styles.backText}>{backLabel}</Text>
        </Pressable>
      )}
      <View style={styles.titleRow}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: theme.spacing.page,
    paddingVertical: 12,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  backText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.foreground,
  },
});
