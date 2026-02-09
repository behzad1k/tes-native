export default {
  expo: {
    name: "Tes",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/logo.png",
    scheme: "tes",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    jsEngine: "hermes",
    owner: "tes_info_tech",
    slug: "tes-new",
    splash: {
      image: "./src/assets/images/logo.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: "com.tes.rain",
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
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
        projectId: "81770c42-2d90-4d59-81ad-dd4b7ab4901d",
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
      ios: {
        infoPlist: {
          NSLocationWhenInUseUsageDescription:
            "This app needs access to your location to mark sign and support positions.",
          NSLocationAlwaysUsageDescription:
            "This app needs access to your location to mark sign and support positions.",
        },
      },
      android: {
        permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      },
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
