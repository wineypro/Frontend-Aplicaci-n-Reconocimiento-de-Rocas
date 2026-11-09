import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AppButton, FormField, ErrorState } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login, isGuest, guestInfo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [migrateGuest, setMigrateGuest] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Validación en tiempo real para activar/desactivar el botón
  const isFormValid = email.trim().length > 5 && password.trim().length > 0;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setApiError(null);
    setLoading(true);
    
    try {
      await login(email.trim(), password, { migrateCurrentGuest: isGuest && migrateGuest });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerBox}>
            <Feather name="user" size={40} color={COLORS.primary} />
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>Introduce tus credenciales de acceso</Text>
          </View>

          {apiError ? <ErrorState message={apiError} /> : null}

          <View style={styles.card}>
            <FormField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.cl"
              keyboardType="email-address"
            />
            <FormField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
            />

            {isGuest && guestInfo ? (
              <View style={styles.migrateRow}>
                <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                  <Text style={styles.migrateTitle}>Transferir mi partida de invitado</Text>
                  <Text style={styles.migrateSub}>
                    Se guardarán tus {guestInfo.recognitionCount || 0} hallazgos en esta cuenta.
                  </Text>
                </View>
                <Switch
                  value={migrateGuest}
                  onValueChange={setMigrateGuest}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={migrateGuest ? COLORS.primary : '#f4f3f4'}
                />
              </View>
            ) : null}

            <AppButton
              title="Entrar a mi cuenta"
              loading={loading}
              disabled={!isFormValid}
              onPress={handleSubmit}
              style={{ marginTop: SPACING.md }}
            />
          </View>

          <AppButton
            title="¿No tienes cuenta? Regístrate aquí"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: SPACING.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xl * 2 },
  headerBox: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  title: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: COLORS.text, 
    marginTop: SPACING.sm 
  },
  subtitle: { 
    fontSize: 14, 
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4 
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  migrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.guestBg,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.guestBadge,
  },
  migrateTitle: { fontSize: 14, fontWeight: '800', color: COLORS.guestBadge },
  migrateSub: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
});