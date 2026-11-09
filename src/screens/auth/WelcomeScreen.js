import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { AppButton, ErrorState } from '../../components/UI';
import { COLORS, SPACING } from '../../theme/theme';

export default function WelcomeScreen({ navigation }) {
  const { startGuestSession } = useAuth();
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [error, setError] = useState(null);

  const handleGuestAccess = async () => {
    setError(null);
    setLoadingGuest(true);
    try {
      await startGuestSession();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingGuest(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.heroBox}>
          <Feather name="map" size={50} color={COLORS.primary} />
          <Text style={styles.title}>Menú Principal</Text>
          <Text style={styles.subtitle}>Selecciona tu modo de acceso</Text>
        </View>

        {error ? <ErrorState message={error} onRetry={handleGuestAccess} /> : null}

        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Modo Online (Guardado Automático)</Text>
          <Text style={styles.sectionDesc}>
            Acceso ilimitado al escáner, guardado en la nube de tu colección e historial de fusiones.
          </Text>
          <AppButton
            title="Entrar a mi Partida (Iniciar Sesión)"
            onPress={() => navigation.navigate('Login')}
            style={{ marginBottom: SPACING.md }}
          />
          <AppButton
            title="Crear Nuevo Personaje (Registro)"
            variant="outline"
            onPress={() => navigation.navigate('Register')}
          />
        </View>

        <View style={styles.guestCard}>
          <View style={styles.guestHeader}>
            <Feather name="compass" size={24} color={COLORS.guestBadge} style={{ marginRight: 8 }} />
            <Text style={styles.guestTitle}>Jugar Modo Demo</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Explora el mundo sin registrarte. Tienes 10 escaneos temporales disponibles.
          </Text>
          <AppButton
            title="Continuar como Invitado"
            variant="secondary"
            loading={loadingGuest}
            onPress={handleGuestAccess}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SPACING.lg, flexGrow: 1, justifyContent: 'center' },
  heroBox: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  guestCard: {
    backgroundColor: COLORS.guestBg,
    padding: SPACING.lg,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.guestBadge,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 8,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.guestBadge,
  },
  sectionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
});