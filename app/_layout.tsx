import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";
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
import { useAppDispatch, useAppSelector } from "@/src/configs/redux/hooks";
import { fetchUser } from "@/src/configs/redux/slices/userSlice";
import { store } from "@/src/configs/redux/store";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Theme } from "@/src/types/theme";
import { STORAGE_KEYS } from "@/src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import Head from "expo-router/head";
import { useEffect } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider } from "react-redux";
import ToastManager from "toastify-react-native";
import { ToastManagerProps } from "toastify-react-native/utils/interfaces";

function AppContent() {
  const { showSplash, textValue } = useSplash();
  const { theme, isDark } = useTheme();
  const { isRTL } = useI18nContext();
  const toastConfig: ToastManagerProps = {
    useModal: false,
    isRTL: isRTL,
    theme: isDark ? "dark" : "light",
    topOffset: 60,
  };
  const { t, isLanguageLoaded } = useLanguage();
  const dispatch = useAppDispatch();
  const { hideSplash } = useSplash();
  const { checkAuthStatus } = useAuth();
  const initializeApp = async () => {
    const themeToken = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    if (!themeToken) {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, "dark");
    }

    if (await checkAuthStatus()) {
      await Promise.all([dispatch(fetchUser())]);
    } else {
      AsyncStorage.removeItem("token");
    }
  };

  useEffect(() => {
    initializeApp();
  }, [dispatch, t]);

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
            <Head>
              <title data-rh="true">Tes - Beauty Service Provider</title>

              <link rel="icon" type="image/png" href="./newLogo.png" />
              <link rel="apple-touch-icon" href="./newLogo.png" />

              <link rel="manifest" href="./manifest.json" />
            </Head>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
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
    <Provider store={store}>
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
    </Provider>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });
