export default {
  expo: {
    name: "Tes",
    slug: "Tes",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/logo.png",
    scheme: "tes",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    jsEngine: "hermes",
    splash: {
      image: "./src/assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.bhzd1k.tes",
      supportsTablet: true,
    },
    android: {
      package: "com.tes.app",
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/logo.png",
        backgroundColor: "#FFFFFF",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
    },
    experiments: {
      typedRoutes: true,
      reactCompiler: false,
    },
    extra: {
      router: {},
      eas: {
        projectId: "e74d8537-a1e8-432b-acb0-0e6d62eddb89",
      },
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT,
      APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
      MODE: process.env.EXPO_PUBLIC_APP_ENV,
    },
  },
  plugins: [
    [
      "expo-router",
      {
        origin: "http://localhost:8081",
      },
    ],
    "expo-location",
    {
      locationAlwaysAndWhenInUsePermission:
        "Allow $(PRODUCT_NAME) to use your location.",
    },
    [
      "expo-dev-client",
      {
        addGeneratedSchema: false,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./src/assets/images/logo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
};
