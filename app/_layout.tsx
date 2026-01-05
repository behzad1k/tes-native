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
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ToastManager from "toastify-react-native";
import { ToastManagerProps } from "toastify-react-native/utils/interfaces";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, asyncStoragePersister } from "@/src/store/queryClient";
import { DatabaseProvider } from "@nozbe/watermelondb/react";
import { database } from "@/src/database";
import { syncEngine } from "@/src/services/sync/SyncEngine";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";
import { useAuthStore } from "@/src/store/auth";

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;

    const inProtectedGroup = segments[0] === "(protected)";

    if (!isAuthenticated && inProtectedGroup) {
      router.replace("/(global)");
    } else if (
      isAuthenticated &&
      !inProtectedGroup &&
      segments[0] !== "(global)"
    ) {
      router.replace("/(protected)/signs");
    }
  }, [isAuthenticated, segments, isLoading]);
}

function AppContent() {
  const { showSplash, textValue, hideSplash } = useSplash();
  const { theme, isDark } = useTheme();
  const { isRTL } = useI18nContext();
  const { isLanguageLoaded } = useLanguage();

  useProtectedRoute();

  const toastConfig: ToastManagerProps = {
    useModal: false,
    isRTL: isRTL,
    theme: isDark ? "dark" : "light",
    topOffset: 60,
  };

  // useEffect(() => {
  //   syncEngine.start();
  //   return () => {
  //     syncEngine.stop();
  //   };
  // }, []);

  useEffect(() => {
    const initializeApp = async () => {
      const themeToken = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (!themeToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, "light");
      }
    };

    initializeApp();
  }, []);

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
            <Slot />
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
            <ThemeProvider>
              <SplashProvider>
                <KeyboardProvider>
                  <AppContent />
                  <LoadingGlobal />
                </KeyboardProvider>
              </SplashProvider>
            </ThemeProvider>
          </LanguageProvider>
        </LoadingProvider>
      </PersistQueryClientProvider>
    </DatabaseProvider>
  );
}
