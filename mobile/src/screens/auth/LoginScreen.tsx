import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../context/AuthContext';
import { colors, fonts, fontSizes, spacing, radii } from '../../theme';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Completá ambos campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nexus</Text>
        <Text style={styles.subtitle}>Iniciá sesión</Text>

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

        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor={colors.muted}
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
        />

        <View style={styles.rememberRow}>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: colors.surface2, true: colors.accent }}
            thumbColor={colors.text}
          />
          <Text style={styles.rememberLabel}>Recordarme</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={styles.buttonText}>Iniciar sesión</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Crear cuenta</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontFamily: fonts.uiBold, fontSize: fontSizes.xxxl, color: colors.accent, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontFamily: fonts.ui, fontSize: fontSizes.lg, color: colors.text, textAlign: 'center', marginBottom: spacing.xl },
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
  rememberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  rememberLabel: { fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.muted, marginLeft: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  buttonText: { fontFamily: fonts.uiMedium, fontSize: fontSizes.md, color: colors.ink },
  link: { fontFamily: fonts.ui, fontSize: fontSizes.sm, color: colors.accent, textAlign: 'center', marginTop: spacing.sm },
});
