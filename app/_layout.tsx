import { AuthProvider } from "@/src/contexts/AuthContext";
import { DrawerProvider } from "@/src/contexts/DrawerContext";
import {
  LanguageProvider,
  useI18nContext,
} from "@/src/contexts/LanguageContext";
import { LoadingProvider } from "@/src/contexts/LoadingContext";
import { SplashProvider, useSplash } from "@/src/contexts/SplashContext";
import { ThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
import Splash from "@/src/components/layouts/Splash";
import { Drawer } from "@/src/components/ui/Drawer";
import { LoadingGlobal } from "@/src/components/ui/LoadingGlobal";
import { useLanguage } from "@/src/hooks/useLanguage";
import { STORAGE_KEYS } from "@/src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";
import { ToastManagerProps } from "toastify-react-native/utils/interfaces";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "@/src/store/queryClient";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { database } from "@/src/database";
import { syncEngine } from "@/src/services/sync/SyncEngine";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";

function AppContent() {
  const { showSplash, textValue, hideSplash } = useSplash();
  const { theme, isDark } = useTheme();
  const { isRTL } = useI18nContext();
  const { t, isLanguageLoaded } = useLanguage();
  const { isOnline } = useNetworkStatus();

  const toastConfig: ToastManagerProps = {
    useModal: false,
    isRTL: isRTL,
    theme: isDark ? "dark" : "light",
    topOffset: 60,
  };

  // Start sync engine
  useEffect(() => {
    syncEngine.start();
    return () => {
      syncEngine.stop();
    };
  }, []);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      const themeToken = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (!themeToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, "dark");
      }
    };

    initializeApp();
  }, []);

  // Hide splash when language is loaded
  useEffect(() => {
    if (isLanguageLoaded) {
      const timer = setTimeout(() => {
        hideSplash();
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [hideSplash, isLanguageLoaded]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DrawerProvider>
          <Drawer>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="signs" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar
              barStyle={isDark ? "light-content" : "dark-content"}
              backgroundColor={theme.background}
            />
            {showSplash && <Splash textValue={textValue} />}
          </Drawer>
        </DrawerProvider>
        <ToastManager {...toastConfig} />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <DatabaseProvider database={database}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister: asyncStoragePersister }}
      >
        <LoadingProvider>
          <LanguageProvider>
            <AuthProvider>
              <ThemeProvider>
                <SplashProvider>
                  <KeyboardProvider>
                    <AppContent />
                    <LoadingGlobal />
                  </KeyboardProvider>
                </SplashProvider>
              </ThemeProvider>
            </AuthProvider>
          </LanguageProvider>
        </LoadingProvider>
      </PersistQueryClientProvider>
    </DatabaseProvider>
  );
}
