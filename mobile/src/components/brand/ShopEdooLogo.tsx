import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../../theme';

const LOGO = require('../../../assets/shopedoo-logo.png');

interface Props {
  height?: number;
  sectionLabel?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function ShopEdooLogo({ height = 40, sectionLabel, onPress, style }: Props) {
  const content = (
    <View style={[styles.row, style]}>
      <Image
        source={LOGO}
        style={{ height, width: height * 3.4, maxWidth: '70%' }}
        resizeMode="contain"
      />
      {sectionLabel ? (
        <Text style={styles.label} numberOfLines={1}>
          {sectionLabel}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    flexShrink: 1,
  },
});
