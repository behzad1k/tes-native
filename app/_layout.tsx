import Splash from "@/src/components/layouts/Splash";
import { Drawer } from "@/src/components/ui/Drawer";
import { LoadingGlobal } from "@/src/components/ui/LoadingGlobal";
import { SYNC_STATUS } from "@/src/constants/global";
import { ROUTES } from "@/src/constants/navigation";
import { DrawerProvider } from "@/src/contexts/DrawerContext";
import {
  LanguageProvider,
  useI18nContext,
} from "@/src/contexts/LanguageContext";
import { LoadingProvider } from "@/src/contexts/LoadingContext";
import { SplashProvider, useSplash } from "@/src/contexts/SplashContext";
import { ThemeProvider, useTheme } from "@/src/contexts/ThemeContext";
import { useLanguage } from "@/src/hooks/useLanguage";
import { store } from "@/src/store";
import { ReduxStorage } from "@/src/store/persistence";
import { initializeAuth, updateToken } from "@/src/store/slices/authSlice";
import { fetchSigns, loadSavedSigns } from "@/src/store/slices/signSlice";
import { STORAGE_KEYS } from "@/src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import ToastManager from "toastify-react-native";
import { ToastManagerProps } from "toastify-react-native/utils/interfaces";

function AppContent() {
  const { showSplash, textValue, hideSplash } = useSplash();
  const { theme, isDark } = useTheme();
  const { isRTL } = useI18nContext();
  const { isLanguageLoaded } = useLanguage();
  const router = useRouter();

  const toastConfig: ToastManagerProps = {
    useModal: false,
    isRTL: isRTL,
    theme: isDark ? "dark" : "light",
    topOffset: 60,
  };

  const initializeApp = async () => {
    try {
      const themeToken = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (!themeToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, "light");
      }

      // 1. Initialize auth from storage
      await store.dispatch(initializeAuth());

      const authState = store.getState().auth;

      if (!authState.isAuthenticated) {
        if (router && router.canGoBack()) {
          router.navigate(ROUTES.HOME); // For Development
          // router.navigate(ROUTES.LOGIN);
        } else {
          setTimeout(() => router.navigate(ROUTES.HOME), 200);
        }
        return;
      }

      // 2. Check network status
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected ?? false;

      if (isOnline) {
        // 3. Update token if online
        await store.dispatch(updateToken());

        // 4. Fetch latest signs from backend
        await store.dispatch(fetchSigns());
      } else {
        // 5. Load saved signs from storage
        const savedSigns: any = await ReduxStorage.loadState("signs_data");
        if (savedSigns) {
          store.dispatch(loadSavedSigns(savedSigns));
        }
      }

      // 6. Calculate pending sync counts
      const signsState = store.getState().signs;
      const unsyncedSigns = signsState.signs.filter(
        (s) => s.status === SYNC_STATUS.NOT_SYNCED,
      );

      const pendingCounts = {
        creates: unsyncedSigns.filter((s) => s.isNew).length,
        updates: unsyncedSigns.filter((s) => !s.isNew).length,
        deletes: 0, // Track deletions separately if needed
        images: unsyncedSigns.reduce(
          (count, sign) =>
            count + sign.images.filter((img) => img.isNew).length,
          0,
        ),
      };

      // Update sync state with counts
      // dispatch(updatePendingCounts(pendingCounts));
    } catch (error) {
      console.error("App initialization failed:", error);
    }
  };

  useEffect(() => {
    if (router && isLanguageLoaded) {
      initializeApp();
    }
  }, [router, isLanguageLoaded]);

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
    <Provider store={store}>
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
    </Provider>
  );
}
