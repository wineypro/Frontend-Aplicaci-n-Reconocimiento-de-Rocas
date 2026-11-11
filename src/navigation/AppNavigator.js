import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/theme';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

import HomeDashboardScreen from '../screens/HomeDashboardScreen';
import CatalogScreen from '../screens/catalog/CatalogScreen';
import RockDetailScreen from '../screens/catalog/RockDetailScreen';
import RecognitionScreen from '../screens/recognition/RecognitionScreen';
import CollectionScreen from '../screens/collection/CollectionScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import AdminScreen from '../screens/admin/AdminScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { mode } = useAuth();
  const [hasTappedStart, setHasTappedStart] = useState(false);

  const navOptions = {
    headerStyle: { backgroundColor: COLORS.primary },
    headerTintColor: '#FFFFFF',
    headerTitleStyle: { fontWeight: '800' },
  };

  if (!hasTappedStart) {
    return <SplashScreen onStart={() => setHasTappedStart(true)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator key={mode} screenOptions={navOptions}>
        {mode === 'anonymous' ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Crear Cuenta' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={HomeDashboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CatalogList" component={CatalogScreen} options={{ title: 'Catálogo de Bloques' }} />
            <Stack.Screen name="RockDetail" component={RockDetailScreen} options={{ title: 'Ficha del Mineral' }} />
            <Stack.Screen name="Recognition" component={RecognitionScreen} options={{ title: 'Escanear Roca' }} />
            <Stack.Screen name="Collection" component={CollectionScreen} options={{ title: 'Mi Inventario y Fusión' }} />
            <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Logros y Perfil' }} />
            <Stack.Screen name="Admin" component={AdminScreen} options={{ title: 'Panel de Administración' }} />
            {mode === 'guest' && (
              <>
                <Stack.Screen name="GuestUpgrade" component={RegisterScreen} options={{ title: 'Guardar Progreso' }} />
                <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión' }} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}