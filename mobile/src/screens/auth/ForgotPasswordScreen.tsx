import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../api/client';
import { colors, fonts, fontSizes, spacing, radii } from '../../theme';

export function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'No se pudo enviar el enlace.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.flex, styles.container]}>
        <Text style={styles.title}>Revisá tu email</Text>
        <Text style={styles.description}>
          Si tu email está registrado, vas a recibir un enlace para restablecer tu contraseña.
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Volver a iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.description}>
          Ingresá el email con el que te registraste y te enviaremos un enlace para restablecer tu contraseña.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.buttonText}>Enviar enlace</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontFamily: fonts.uiBold, fontSize: fontSizes.xxl, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
  description: { fontFamily: fonts.ui, fontSize: fontSizes.md, color: colors.muted, textAlign: 'center', marginBottom: spacing.xl },
  error: { fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    padding: spacing.lg,
    fontFamily: fonts.ui,
    fontSize: fontSizes.md,
    color: colors.text,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonText: { fontFamily: fonts.uiMedium, fontSize: fontSizes.md, color: colors.ink },
  link: { fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.accent, textAlign: 'center' },
});
