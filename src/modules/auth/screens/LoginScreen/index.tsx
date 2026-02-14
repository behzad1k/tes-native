import React from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ForgotPasswordModal from "./components/ForgotPasswordForm";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import ModuleCard from "@/src/components/layouts/ModuleCard";
import { LOCAL_IMAGES } from "@/src/constants/images";
import { LinearGradient } from "expo-linear-gradient";
import ButtonView from "@/src/components/ui/ButtonView";
import { useAuth } from "../../hooks/useAuth";
import { Toast } from "toastify-react-native";

export default function LoginScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { openDrawer, closeDrawer } = useDrawer();

  const { login, forgotPassword, isReady, isLoading } = useAuth();

  const onForgotPassword = () => {
    openDrawer(
      "forgot-password",
      <ForgotPasswordModal
        onSubmit={handleForgotPassword}
        onClose={() => closeDrawer("forgot-password")}
      />,
      {
        drawerHeight: "auto",
      },
    );
  };

  const handleForgotPassword = async (email: string) => {
    const success = await forgotPassword({ email });
    if (success) {
      Toast.success(t("auth.forgotPasswordSuccess"));
      closeDrawer("forgot-password");
    } else {
      Toast.error(t("error.forgotPasswordFailed"));
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.window}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          <View style={styles.content}>
            <LinearGradient
              style={styles.gradiant}
              colors={["rgba(255,255,255,.0)", "rgba(255,255,255,1)"]}
              start={[0.5, 0.01]}
              locations={[0.4, 0.9]}
            />
            <View style={styles.background}>
              <ModuleCard
                title="Maintenance"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.MAINTENANCE_CARD}
                containerStyle={{ width: "49%" }}
              />
              <ModuleCard
                title="Collision"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.COLLISION_CARD}
                containerStyle={{ width: "49%" }}
              />
              <ModuleCard
                title="Sign Inventory"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.SING_INVENTORY_CARD}
                containerStyle={{ width: "49%" }}
              />
              <ModuleCard
                title="Schedule"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.SCHEDULE_CARD}
                containerStyle={{ width: "49%" }}
              />
              <ModuleCard
                title="Traffic Counter"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.TRAFFIC_COUNTER_CARD}
                containerStyle={{ width: "49%" }}
              />
              <ModuleCard
                title="Collision"
                description="You can count the number of vehicles and determine the direction of each one."
                backgroundImage={LOCAL_IMAGES.COLLISION_CARD}
                containerStyle={{ width: "49%" }}
              />
            </View>
          </View>
        </View>

        <View style={styles.textBox}>
          <TextView variant="h1" style={styles.title}>
            {t("auth.welcome")}
          </TextView>
          <TextView variant="h1" style={styles.descriptionText}>
            {t("auth.appDescription")}
          </TextView>

          <ButtonView
            style={styles.submitButton}
            onPress={login}
            disabled={!isReady || isLoading}
            loading={isLoading}
          >
            {isLoading ? "Signing in..." : t("auth.signIn")}
          </ButtonView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    window: {
      flex: 1,
    },
    background: {
      position: "absolute",
      top: -120,
      left: -190,
      flex: 1,
      height: "100%",
      width: "225%",
      padding: spacing.lg,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      justifyContent: "flex-start",
      transform: "rotate(330deg)",
    },
    gradiant: { height: "90%", zIndex: 2 },
    container: {
      flex: 1,
      backgroundColor: "#FFF",
      padding: 20,
    },
    keyboardView: {
      flex: 1,
    },
    content: {
      borderRadius: 30,
      overflow: "hidden",
      flex: 1,
    },
    title: {
      color: colors.darkGreen,
      fontSize: 32,
      fontWeight: "bold",
      textAlign: "center",
    },
    descriptionText: {
      color: colors.darkGreen,
      fontSize: 12,
      fontWeight: "500",
      textAlign: "center",
      maxWidth: "80%",
      lineHeight: 15,
      marginBottom: 20,
    },
    textBox: {
      position: "absolute",
      alignItems: "center",
      bottom: 35,
      left: 0,
      right: 0,
      marginInline: "auto",
      gap: 10,
      justifyContent: "center",
      padding: 20,
    },
    submitButton: {
      width: "100%",
      borderRadius: 30,
    },
  });
