import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

interface NumTextProps extends TextProps {
  children: React.ReactNode;
}

export function NumText({ style, children, ...props }: NumTextProps) {
  return (
    <Text style={[styles.num, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  num: {
    fontFamily: fonts.num,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
});
