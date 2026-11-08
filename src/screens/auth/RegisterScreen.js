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

export default function RegisterScreen({ navigation }) {
  const { registerAndLogin, isGuest, guestInfo } = useAuth();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [migrateGuest, setMigrateGuest] = useState(true);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!userName.trim()) nextErrors.userName = 'El nombre de usuario es obligatorio';
    if (!email.trim()) nextErrors.email = 'El correo electrónico es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Ingresa un correo electrónico válido';
    }
    if (!password || password.length < 8) {
      nextErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    setApiError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await registerAndLogin({
        userName: userName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        migrateCurrentGuest: isGuest && migrateGuest
      });
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
            Crear Cuenta
          </Text>
          <Text style={styles.subtitle}>
            Regístrate para guardar tus descubrimientos de forma permanente y reconocer rocas sin límite.
          </Text>

          {apiError ? <ErrorState message={apiError} /> : null}

          <View style={styles.card}>
            <FormField
              label="Nombre de usuario *"
              value={userName}
              onChangeText={setUserName}
              placeholder="ej. geologo_norte"
              error={errors.userName}
            />
            <FormField
              label="Correo electrónico *"
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@ejemplo.cl"
              keyboardType="email-address"
              error={errors.email}
            />
            <FormField
              label="Teléfono (opcional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+56 9 1234 5678"
              keyboardType="phone-pad"
            />
            <FormField
              label="Contraseña (mínimo 8 caracteres) *"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
              error={errors.password}
            />

            {isGuest && guestInfo ? (
              <View style={styles.migrateBox}>
                <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                  <Text style={styles.migrateTitle}>
                    🧭 Conservar progreso de mi sesión de invitado
                  </Text>
                  <Text style={styles.migrateSub}>
                    Se migrarán tus descubrimientos y logros obtenidos en esta sesión temporal.
                  </Text>
                </View>
                <Switch
                  value={migrateGuest}
                  onValueChange={setMigrateGuest}
                  accessibilityLabel="Migrar progreso de invitado a la nueva cuenta"
                />
              </View>
            ) : null}

            <AppButton
              title={isGuest && migrateGuest ? 'Registrarme y Migrar Progreso' : 'Crear mi Cuenta'}
              loading={loading}
              onPress={handleRegister}
            />
          </View>

          <AppButton
            title="¿Ya tienes cuenta? Inicia sesión"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: SPACING.md }}
          />
          <AppButton
            title="Cancelar y volver"
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
  migrateBox: {
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