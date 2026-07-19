import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes } from '../../theme';

export function SearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.ink },
  title: { fontFamily: fonts.uiMedium, fontSize: fontSizes.xl, color: colors.text },
});
