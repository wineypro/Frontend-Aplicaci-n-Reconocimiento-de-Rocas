import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, MIN_TOUCH_SIZE } from '../theme/theme';

export default function HomeDashboardScreen({ navigation }) {
  const { user, isGuest, guestInfo, logout } = useAuth();

  const menuItems = [
    { title: 'Catálogo', icon: 'book', route: 'CatalogList' },
    { title: 'Reconocer', icon: 'camera', route: 'Recognition' },
    { title: 'Colección', icon: 'briefcase', route: 'Collection' },
    { title: 'Progreso', icon: 'award', route: 'Progress' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hola, {isGuest ? 'Explorador' : user?.userName}
          </Text>
          <Text style={styles.subGreeting}>
            {isGuest ? `Invitado (${guestInfo?.remaining ?? 10}/10)` : 'Rango: Geólogo Jefe'}
          </Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Feather name="log-out" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroBox}>
          <Feather name="hexagon" size={60} color={COLORS.primary} style={{ opacity: 0.8 }} />
          <Text style={styles.title}>GeoDex Mobile</Text>
          <Text style={styles.subtitle}>¿Qué deseas hacer hoy?</Text>
        </View>

        <View style={styles.grid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route)}
              accessibilityRole="button"
            >
              <View style={styles.iconCircle}>
                <Feather name={item.icon} size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isGuest && (
          <TouchableOpacity
            style={styles.guestBanner}
            onPress={() => navigation.navigate('GuestUpgrade')}
          >
            <Feather name="save" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.guestText}>Guardar progreso de invitado</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E0F7FA' }, // Fondo cielo suave
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: COLORS.secondary },
  subGreeting: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  logoutBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
  },
  container: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  heroBox: { alignItems: 'center', marginBottom: SPACING.xl, marginTop: SPACING.md },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.primary, marginTop: SPACING.sm },
  subtitle: { fontSize: 16, color: COLORS.secondary, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    elevation: 3, // Sombra sutil
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F8E9', // Verde muy claro
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  menuText: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  guestBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.guestBadge,
    padding: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: MIN_TOUCH_SIZE,
  },
  guestText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});