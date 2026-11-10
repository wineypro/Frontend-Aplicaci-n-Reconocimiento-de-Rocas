import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AppButton, FormField, ErrorState } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function RegisterScreen({ navigation }) {
  const { registerAndLogin, isGuest, guestInfo } = useAuth();
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [migrateGuest, setMigrateGuest] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const isFormValid = userName.trim().length > 2 && email.trim().length > 5 && password.length >= 8;

  const handleRegister = async () => {
    if (!isFormValid) return;
    setApiError(null);
    setLoading(true);
    
    try {
      await registerAndLogin({
        userName: userName.trim(),
        email: email.trim(),
        password,
        migrateCurrentGuest: isGuest && migrateGuest
      });
      
      // SOLUCIÓN: Reiniciar el historial si veníamos de invitado
      if (isGuest) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Dashboard' }],
        });
      }
    } catch (err) {
      setApiError(err.message);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.headerBox}>
            <Feather name="user-plus" size={40} color={COLORS.primary} />
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Guarda tu inventario permanentemente</Text>
          </View>

          {apiError ? <ErrorState message={apiError} /> : null}

          <View style={styles.card}>
            <FormField
              label="Nombre de explorador *"
              value={userName}
              onChangeText={setUserName}
              placeholder="Ej. GeologoMaestro"
            />
            <FormField
              label="Correo electrónico *"
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@correo.cl"
              keyboardType="email-address"
            />
            <FormField
              label="Contraseña (mínimo 8 caracteres) *"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry
            />

            {isGuest && guestInfo ? (
              <View style={styles.migrateBox}>
                <View style={{ flex: 1, paddingRight: SPACING.sm }}>
                  <Text style={styles.migrateTitle}>Guardar progreso actual</Text>
                  <Text style={styles.migrateSub}>
                    Conservarás tus {guestInfo.recognitionCount || 0} hallazgos de invitado al crear la cuenta.
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
              title={isGuest && migrateGuest ? 'Registrarme y Migrar Progreso' : 'Crear mi Cuenta'}
              loading={loading}
              disabled={!isFormValid}
              onPress={handleRegister}
              style={{ marginTop: SPACING.sm }}
            />
          </View>

          <AppButton
            title="¿Ya tienes cuenta? Inicia sesión aquí"
            variant="outline"
            onPress={() => navigation.navigate('Login')}
            style={{ marginTop: SPACING.lg }}
          />

          {isGuest && (
            <AppButton
              title="Volver al Menú"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={{ marginTop: SPACING.sm, borderColor: 'transparent' }}
            />
          )}

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
  title: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginTop: SPACING.sm },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700', marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  migrateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.guestBg,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.guestBadge,
  },
  migrateTitle: { fontSize: 14, fontWeight: '900', color: COLORS.guestBadge },
  migrateSub: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
});