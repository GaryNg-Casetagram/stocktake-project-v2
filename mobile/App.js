import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScanScreen from './src/screens/ScanScreen';
import SessionsScreen from './src/screens/SessionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Import stores and services
import { useAuthStore } from './src/stores/authStore';
import { useOfflineStore } from './src/stores/offlineStore';

// Import theme
import { theme } from './src/theme/theme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const queryClient = new QueryClient();

// Tab Navigator for authenticated users
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen}
        options={{
          title: 'Scan',
        }}
      />
      <Tab.Screen 
        name="Sessions" 
        component={SessionsScreen}
        options={{
          title: 'Sessions',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const { isAuthenticated, initializeAuth } = useAuthStore();
  const { initializeOffline } = useOfflineStore();

  const [fontsLoaded] = useFonts({
    'Roboto-Regular': require('./assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Medium': require('./assets/fonts/Roboto-Medium.ttf'),
    'Roboto-Bold': require('./assets/fonts/Roboto-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize authentication and offline stores
        await initializeAuth();
        await initializeOffline();
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        // Tell the application to render
        SplashScreen.hideAsync();
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded, initializeAuth, initializeOffline]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <Stack.Screen name="Main" component={TabNavigator} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}