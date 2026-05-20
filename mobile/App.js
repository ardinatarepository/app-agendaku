import { setupURLPolyfill } from 'react-native-url-polyfill';
setupURLPolyfill();
// App.js - Entry point AgendaKu Mobile
// Perbaikan: main entry point benar, ikon dari @expo/vector-icons

import { useEffect, useCallback, useState, useRef } from 'react';
import { Platform, Text, View, Image, LogBox, Animated, TouchableOpacity, StyleSheet, Easing, Dimensions } from 'react-native';

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
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { registerTabBarAnimator } from './src/utils/tabBarControl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { 
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black 
} from '@expo-google-fonts/poppins';
import { 
  Inter_700Bold,
  Inter_900Black
} from '@expo-google-fonts/inter';
import { ArchivoBlack_400Regular } from '@expo-google-fonts/archivo';

SplashScreen.preventAutoHideAsync();

import { AuthProvider, useAuth }         from './src/context/AuthContext';
import { ThemeProvider }                 from './src/context/ThemeContext';
import { requestNotificationPermission } from './src/utils/notifications';
import { COLORS, FONT, SHADOW }            from './src/utils/theme';
import { PremiumLoader }                 from './src/components/ui';
import Logo                              from './src/components/Logo';

import LoginScreen     from './src/screens/auth/LoginScreen';
import RegisterScreen  from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/app/DashboardScreen';
import TaskListScreen  from './src/screens/app/TaskListScreen';
import CalendarScreen  from './src/screens/app/CalendarScreen';
import ProfileScreen   from './src/screens/app/ProfileScreen';
import EditProfileScreen from './src/screens/app/EditProfileScreen';
import ChangePasswordScreen from './src/screens/app/ChangePasswordScreen';

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

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const tabBarAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    registerTabBarAnimator(
      // animateFn: untuk scroll hide/show (smooth)
      (visible) => {
        Animated.timing(tabBarAnim, {
          toValue: visible ? 0 : 100,
          duration: 250,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }).start();
      },
      // resetFn: untuk pindah tab (instan)
      () => {
        tabBarAnim.stopAnimation();
        tabBarAnim.setValue(0);
      }
    );
  }, []);

  const NAV_IMAGES = {
    Dashboard: { uri: 'https://cdn-icons-png.flaticon.com/512/9440/9440315.png' },
    Tugas:     { uri: 'https://cdn-icons-png.flaticon.com/512/6831/6831818.png' },
    Kalender:  { uri: 'https://cdn-icons-png.flaticon.com/512/10156/10156100.png' },
    Profil:    { uri: 'https://cdn-icons-png.flaticon.com/512/9131/9131549.png' },
  };

  return (
    <Animated.View style={[
      tabStyles.container,
      {
        height: 70 + (insets.bottom > 0 ? insets.bottom : 0),
        paddingBottom: insets.bottom > 0 ? insets.bottom : 0,
        transform: [{ translateY: tabBarAnim }],
      }
    ]}>

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={tabStyles.tabItem}
            activeOpacity={0.8}
          >
            <View style={tabStyles.iconContainer}>
              <Image
                source={NAV_IMAGES[route.name]}
                style={{
                  width: 26,
                  height: 26,
                  tintColor: isFocused ? '#1E293B' : '#94A3B8'
                }}
                resizeMode="contain"
              />
            </View>
            <Text 
              style={[
                tabStyles.tabLabel, 
                { color: isFocused ? '#1e293b' : '#94A3B8', marginTop: 4 }
              ]}
            >
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    height: 70,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    zIndex: 1000,
    paddingHorizontal: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  iconContainer: {
    width: 50,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary, // Kuning cerah AgendaKu
  },
  tabLabel: {
    fontSize: 10,
    ...FONT.bold,
    letterSpacing: 0.2,
  },
});

function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <Image 
          source={require('./assets/logo.png')} 
          style={{ width: 120, height: 120 }} 
          resizeMode="contain" 
        />
        <PremiumLoader size={36} color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="App" component={AppTabs} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
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
    Inter_700Bold,
    Inter_900Black,
    'ArchivoBlack_400Regular': 'https://github.com/google/fonts/raw/main/ofl/archivoblack/ArchivoBlack-Regular.ttf',
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Fallback: Pastikan splash screen tertutup jika onLayout tidak terpanggil
  useEffect(() => {
    if (fontError) {
      console.log('Font Load Error:', fontError);
    }
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
              <NavigationContainer>
                <View style={Platform.OS === 'web' ? { 
                  flex: 1, 
                  backgroundColor: COLORS.bg, // Background full layar
                  width: '100%',
                } : { flex: 1 }}>
                  <View style={Platform.OS === 'web' ? { 
                    flex: 1, 
                    maxWidth: 500, 
                    width: '100%', 
                    alignSelf: 'center', 
                    backgroundColor: COLORS.bg,
                  } : { flex: 1 }}>

                    <RootNavigator />
                  </View>
                </View>
              </NavigationContainer>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
