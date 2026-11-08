import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/UI';
import { COLORS, SPACING } from '../theme/theme';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CatalogScreen from '../screens/catalog/CatalogScreen';
import RockDetailScreen from '../screens/catalog/RockDetailScreen';
import RecognitionScreen from '../screens/recognition/RecognitionScreen';
import CollectionScreen from '../screens/collection/CollectionScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import AdminScreen from '../screens/admin/AdminScreen';

const RootStack = createNativeStackNavigator();
const CatalogStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function SessionHeaderRight({ navigation }) {
  const { isAuthenticated, isGuest, user, guestInfo, logout } = useAuth();

  return (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        onPress={() => navigation.navigate('ProgressTab')}
        accessibilityRole="button"
        accessibilityLabel="Ver mi cuenta y progreso"
        style={styles.accountPill}
      >
        <Text style={styles.accountPillText} numberOfLines={1}>
          {isAuthenticated
            ? `👤 ${user?.userName || 'Mi Cuenta'}`
            : `🧭 Invitado (${guestInfo?.remaining ?? 10}/10)`}
        </Text>
      </TouchableOpacity>

      {isGuest ? (
        <TouchableOpacity
          onPress={() => navigation.navigate('GuestUpgrade')}
          accessibilityRole="button"
          style={styles.upgradeHeaderBtn}
        >
          <Text style={styles.upgradeHeaderText}>Crear Cuenta</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={logout}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
        style={styles.logoutHeaderBtn}
      >
        <Text style={styles.logoutHeaderText}>
          {isGuest ? 'Salir' : 'Cerrar sesión'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function CatalogStackNavigator({ navigation }) {
  return (
    <CatalogStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <SessionHeaderRight navigation={navigation} />
      }}
    >
      <CatalogStack.Screen
        name="CatalogList"
        component={CatalogScreen}
        options={{ title: 'Enciclopedia / Catálogo' }}
      />
      <CatalogStack.Screen
        name="RockDetail"
        component={RockDetailScreen}
        options={{ title: 'Ficha del Espécimen' }}
      />
    </CatalogStack.Navigator>
  );
}

function MainTabs() {
  const { isAdmin, isGuest } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        headerRight: () => <SessionHeaderRight navigation={navigation} />,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6 }
      })}
    >
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStackNavigator}
        options={{
          headerShown: false,
          title: 'Catálogo',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📖</Text>
        }}
      />
      <Tab.Screen
        name="RecognitionTab"
        component={RecognitionScreen}
        options={{
          title: 'Reconocer',
          headerTitle: 'Reconocimiento por IA',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📷</Text>
        }}
      />
      <Tab.Screen
        name="CollectionTab"
        component={CollectionScreen}
        options={{
          title: isGuest ? 'Mis Hallazgos' : 'Mi Colección',
          headerTitle: isGuest ? 'Mis Hallazgos (Sesión Invitado)' : 'Mi Colección y Fusión',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>⛏️</Text>
        }}
      />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressScreen}
        options={{
          title: 'Cuenta y Logros',
          headerTitle: 'Mi Cuenta, Progreso y Logros',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏆</Text>
        }}
      />
      {isAdmin ? (
        <Tab.Screen
          name="AdminTab"
          component={AdminScreen}
          options={{
            title: 'Admin',
            headerTitle: 'Administración y Supervisión',
            tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { initializing, mode } = useAuth();

  if (initializing) {
    return <LoadingState message="Restaurando sesión de GeoDex..." />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator
        key={mode}
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' }
        }}
      >
        {mode === 'anonymous' ? (
          <>
            <RootStack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Iniciar Sesión' }}
            />
            <RootStack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Crear Cuenta' }}
            />
          </>
        ) : mode === 'guest' ? (
          <>
            <RootStack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <RootStack.Screen
              name="GuestUpgrade"
              component={RegisterScreen}
              options={{ title: 'Guardar Progreso en una Cuenta' }}
            />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: 'Iniciar Sesión' }}
            />
          </>
        ) : (
          <RootStack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md
  },
  accountPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8
  },
  accountPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  upgradeHeaderBtn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8
  },
  upgradeHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  logoutHeaderBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  logoutHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});