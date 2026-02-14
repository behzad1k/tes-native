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
import { store, persistor } from "@/src/store";
import { initializeAuth, updateToken } from "@/src/store/slices/authSlice";
import { STORAGE_KEYS } from "@/src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { Slot, useRouter, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import ToastManager from "toastify-react-native";
import { ToastManagerProps } from "toastify-react-native/utils/interfaces";
import { fetchJobs, fetchSignSupportSetups } from "@/src/store/thunks";
import { BUser } from "@/src/types/api";
import ENDPOINTS from "@/src/services/api/endpoints";
import { apiClient } from "@/src/services/api/apiClient";
import { ReduxStorage } from "@/src/store/persistence";

function AppContent() {
  const { showSplash, textValue, hideSplash, setTextValue } = useSplash();
  const { theme, isDark } = useTheme();
  const { isRTL } = useI18nContext();
  const { isLanguageLoaded } = useLanguage();
  const [loading, setIsLoading] = useState(true);
  const router = useRouter();

  const toastConfig: ToastManagerProps = {
    useModal: false,
    isRTL: isRTL,
    theme: isDark ? "dark" : "light",
    topOffset: 60,
  };

  const fetchUser = async () => {
    const userResponse: BUser = await apiClient.get(ENDPOINTS.USER.PROFIlE);

    await ReduxStorage.saveState("auth_user", userResponse);

    return userResponse;
  };

  const initializeApp = async () => {
    setIsLoading(true);
    try {
      const themeToken = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      if (!themeToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, "light");
      }

      // 1. Initialize auth from storage
      await store.dispatch(initializeAuth());

      const authState = store.getState().auth;

      if (!authState.isAuthenticated) {
        if (router) {
          router.navigate(ROUTES.LOGIN);
        }
        return;
      }

      // 2. Check network status
      const netState = await NetInfo.fetch();
      const isOnline = netState.isConnected ?? false;

      if (isOnline) {
        try {
          // 3. Update token if online
          setTextValue("Fetching User...");
          const user = await fetchUser();
          // await getVehicleClassification(token);
          // await getClientGeneralSetting(token);
          // await getModuleOfModule(token);
          setTextValue("Fetching Jobs and signs...");
          await Promise.all([
            store.dispatch(fetchSignSupportSetups(user.defaultCustomerId)),
            store.dispatch(fetchJobs(user.defaultCustomerId)),
          ]);
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      } else {
        console.log("Working offline with cached data");
      }

      // Navigate to main screen
      router.replace(ROUTES.HOME);
    } catch (error) {
      console.error("App initialization failed:", error);
      router.navigate(ROUTES.LOGIN);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (router && isLanguageLoaded) {
      initializeApp();
    }
  }, [router, isLanguageLoaded]);

  useEffect(() => {
    if (isLanguageLoaded && !loading) {
      hideSplash();
    }
  }, [hideSplash, isLanguageLoaded, loading]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DrawerProvider>
          <Drawer>
            {/*<Stack>
              <Stack.Screen name="(global)" />
              <Stack.Screen name="(protected)" />
            </Stack>*/}
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
      <PersistGate loading={null} persistor={persistor}>
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
      </PersistGate>
    </Provider>
  );
}
