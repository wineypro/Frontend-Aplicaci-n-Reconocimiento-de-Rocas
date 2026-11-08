import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { AppButton, FormField, ErrorState } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function LoginScreen({ navigation }) {
  const { login, isGuest, guestInfo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [migrateGuest, setMigrateGuest] = useState(true);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Ingresa tu correo electrónico';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'El formato del correo no es válido';
    }
    if (!password) nextErrors.password = 'Ingresa tu contraseña';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setApiError(null);
    if (!validate()) return;

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title} accessibilityRole="header">
            Iniciar Sesión
          </Text>
          <Text style={styles.subtitle}>
            Ingresa con tus credenciales para acceder a tu colección y herramientas avanzadas.
          </Text>

          {apiError ? <ErrorState message={apiError} /> : null}

          <View style={styles.card}>
            <FormField
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.cl"
              keyboardType="email-address"
              error={errors.email}
            />
            <FormField
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              error={errors.password}
            />

            {isGuest && guestInfo ? (
              <View style={styles.migrateRow}>
                <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                  <Text style={styles.migrateTitle}>Transferir mi sesión de invitado</Text>
                  <Text style={styles.migrateSub}>
                    Mover mis {guestInfo.recognitionCount || 0} reconocimientos temporales a esta cuenta.
                  </Text>
                </View>
                <Switch
                  value={migrateGuest}
                  onValueChange={setMigrateGuest}
                  accessibilityLabel="Transferir datos de invitado al iniciar sesión"
                />
              </View>
            ) : null}

            <AppButton
              title="Entrar a mi cuenta"
              loading={loading}
              onPress={handleSubmit}
              style={{ marginTop: SPACING.xs }}
            />
          </View>

          <AppButton
            title="¿No tienes cuenta? Regístrate aquí"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
            style={{ marginTop: SPACING.md }}
          />
          <AppButton
            title="Volver"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ marginTop: SPACING.sm }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.lg },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  migrateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.guestBg,
    padding: SPACING.sm,
    borderRadius: 10,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.guestBadge
  },
  migrateTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  migrateSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }
});