import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <View style={styles.heroCard}>
          <Text style={styles.badge}>GEODEX MOBILE · UCN</Text>
          <Text style={styles.title} accessibilityRole="header">
            Identificación y Catálogo Geológico
          </Text>
          <Text style={styles.subtitle}>
            Explora el catálogo de rocas, clasifica muestras con inteligencia artificial, completa logros geológicos y construye tu colección personal.
          </Text>
        </View>

        {error ? <ErrorState message={error} onRetry={handleGuestAccess} /> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso con cuenta</Text>
          <Text style={styles.sectionDesc}>
            Reconocimientos ilimitados, colección persistente, laboratorio de fusión y evaluación de resultados de la IA.
          </Text>
          <AppButton
            title="Iniciar Sesión"
            onPress={() => navigation.navigate('Login')}
            style={{ marginBottom: SPACING.sm }}
          />
          <AppButton
            title="Crear Cuenta Nueva"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </View>

        <View style={styles.guestSection}>
          <Text style={styles.guestTitle}>🧭 ¿Quieres probar sin registrarte?</Text>
          <Text style={styles.sectionDesc}>
            Como invitado dispones de hasta 10 reconocimientos por sesión temporal y puedes migrar tus descubrimientos al crear una cuenta más adelante.
          </Text>
          <AppButton
            title="Continuar como Invitado (10 intentos)"
            variant="outline"
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
  heroCard: {
    backgroundColor: COLORS.primary,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg
  },
  badge: {
    color: '#A7F3D0',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: SPACING.xs
  },
  title: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: SPACING.xs
  },
  subtitle: {
    color: '#E6F4EC',
    fontSize: 15,
    lineHeight: 22
  },
  section: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md
  },
  guestSection: {
    backgroundColor: COLORS.guestBg,
    padding: SPACING.lg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.guestBadge
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4
  },
  guestTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.guestBadge,
    marginBottom: 4
  },
  sectionDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md
  }
});