import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING } from '../theme/theme';

export default function SplashScreen({ navigation }) {
  // Obtenemos 'initializing' (leyendo sesión) y 'mode' (anónimo, invitado, usuario, admin)
  const { initializing, mode } = useAuth();

  const handleTap = () => {
    // Si sigue cargando la sesión en segundo plano, no hacemos nada al tocar
    if (initializing) return;

    // Dependiendo del estado de sesión, redirigimos a la ruta correspondiente
    if (mode === 'anonymous') {
      navigation.replace('Welcome');
    } else {
      navigation.replace('Dashboard');
    }
  };

  return (
    <Pressable style={styles.container} onPress={handleTap}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Feather name="box" size={80} color={COLORS.surface} />
        </View>
        <Text style={styles.title}>GEODEX</Text>
        <Text style={styles.subtitle}>M O B I L E</Text>
      </View>

      <View style={styles.footer}>
        {initializing ? (
          <>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando recursos del mundo...</Text>
          </>
        ) : (
          <Text style={styles.tapText}>- TOCA LA PANTALLA PARA COMENZAR -</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl * 2,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    backgroundColor: COLORS.primary,
    padding: 20,
    borderRadius: 24,
    marginBottom: SPACING.md,
    transform: [{ rotate: '45deg' }], // Estilo isométrico
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 8,
    marginTop: 4,
  },
  footer: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tapText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 1,
    opacity: 0.8,
  },
});