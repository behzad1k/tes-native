export default {
  expo: {
    name: "Tes",
    slug: "Tes",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/images/newLogo.png",
    scheme: "tes",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    jsEngine: "hermes",
    splash: {
      image: "./src/assets/images/newLogo.png",
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
        foregroundImage: "./src/assets/images/newLogo.png",
        backgroundColor: "#FFFFFF",
      },
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./src/assets/images/newLogo.png",
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
    },
  },
  plugins: [
    "expo-router",
    "@maplibre/maplibre-react-native",
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
        image: "./src/assets/images/newLogo.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
};
