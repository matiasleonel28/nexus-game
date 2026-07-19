import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import apiClient from '../../api/client';
import { colors, fonts, fontSizes, spacing, radii } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
type Route = RouteProp<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const token = route.params?.token ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError('Completá ambos campos.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, new_password: password });
      setSuccess(true);
    } catch (err: any) {
      const detail = err?.detail || '';
      if (detail.includes('expirado') || detail.includes('inválido')) {
        setError('Este enlace expiró. Solicitá uno nuevo.');
      } else {
        setError(err?.message || 'No se pudo actualizar la contraseña.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.flex, styles.container]}>
        <Text style={styles.title}>Contraseña actualizada</Text>
        <Text style={styles.description}>Ya podés iniciar sesión con tu nueva contraseña.</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Ir a iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nueva contraseña</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Nueva contraseña"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirmar contraseña"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.buttonText}>Actualizar contraseña</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Solicitar nuevo enlace</Text>
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
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  buttonText: { fontFamily: fonts.uiMedium, fontSize: fontSizes.md, color: colors.ink },
  link: { fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.accent, textAlign: 'center' },
});
