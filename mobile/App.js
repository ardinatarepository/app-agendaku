import { setupURLPolyfill } from 'react-native-url-polyfill';
setupURLPolyfill();
// App.js - Entry point AgendaKu Mobile
// Perbaikan: main entry point benar, ikon dari @expo/vector-icons

import { useEffect, useCallback } from 'react';
import { Platform, Text, View, LogBox } from 'react-native';

// Supress pesan error/warning expo-notifications di Expo Go
// Ini HARUS dipanggil sebelum modul expo-notifications dimuat
const originalConsoleError = console.error;
console.error = (...args) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (msg.includes('expo-notifications') && msg.includes('Push notifications')) {
    return; // Abaikan error push notification di Expo Go
  }
  originalConsoleError(...args);
};

LogBox.ignoreLogs([
  'expo-notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'setLayoutAnimationEnabledExperimental is currently a no-op',
  'Android Push notifications'
]);

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { 
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black 
} from '@expo-google-fonts/poppins';

SplashScreen.preventAutoHideAsync();

import { AuthProvider, useAuth }         from './src/context/AuthContext';
import { ThemeProvider }                 from './src/context/ThemeContext';
import { requestNotificationPermission } from './src/utils/notifications';
import { COLORS, FONT, SHADOW }            from './src/utils/theme';

import LoginScreen     from './src/screens/auth/LoginScreen';
import RegisterScreen  from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/app/DashboardScreen';
import TaskListScreen  from './src/screens/app/TaskListScreen';
import CalendarScreen  from './src/screens/app/CalendarScreen';
import ProfileScreen   from './src/screens/app/ProfileScreen';
import EditProfileScreen from './src/screens/app/EditProfileScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60 * 1000 } },
});

// Peta nama tab ke nama ikon MaterialIcons (active & inactive)
const TAB_ICONS = {
  Dashboard: { active: 'home', inactive: 'home' },
  Tugas:     { active: 'assignment', inactive: 'assignment' },
  Kalender:  { active: 'event', inactive: 'event' },
  Profil:    { active: 'person', inactive: 'person' },
};

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.border,
          height:          Platform.OS === 'ios' ? 84 : 70,
          paddingBottom:   Platform.OS === 'ios' ? 24 : 16,
          paddingTop:      10,
          ...SHADOW.md,
        },
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name  = focused ? icons?.active : icons?.inactive;
          return (
            <View style={focused ? { 
              backgroundColor: COLORS.primaryLight, 
              paddingHorizontal: 20, 
              paddingVertical: 10, 
              borderRadius: 24 
            } : null}>
              <MaterialIcons name={name} size={size ?? 28} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tugas"     component={TaskListScreen} />
      <Tab.Screen name="Kalender"  component={CalendarScreen} />
      <Tab.Screen name="Profil"    component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <Text style={{ fontSize: 26, ...FONT.black, color: COLORS.primary }}>AgendaKu</Text>
        <Text style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 8 }}>Memuat...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="App" component={AppTabs} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login"    component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Fallback: Pastikan splash screen tertutup jika onLayout tidak terpanggil
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="dark" backgroundColor={COLORS.bg} />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
