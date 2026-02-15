import { useAppSelector } from "@/src/store/hooks";
import { Theme } from "@/src/types/theme";
import React, { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { router, useRouter } from "expo-router";
import TextView from "@/src/components/ui/TextView";
import ModuleCard from "@/src/components/layouts/ModuleCard";
import { LOCAL_IMAGES } from "@/src/constants/images";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { ROUTES } from "@/src/constants/navigation";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import ProfileHeader from "../components/ProfileHeader";

export default function HomeScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ProfileHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <ModuleCard
          title="Traffic Counter"
          description="You can count the number of vehicles and determine the direction of each one."
          backgroundImage={LOCAL_IMAGES.TRAFFIC_COUNTER_CARD}
          onPress={() => router.push(ROUTES.TRAFFIC_COUNT_LIST)}
        />
        <ModuleCard
          title="Maintenance"
          description="You can count the number of vehicles and determine the direction of each one."
          onPress={() => router.push(ROUTES.MAINTENCANCE_LIST)}
          backgroundImage={LOCAL_IMAGES.MAINTENANCE_CARD}
        />
        <ModuleCard
          title={t("signs.title")}
          description="You can count the number of vehicles and determine the direction of each one."
          backgroundImage={LOCAL_IMAGES.SING_INVENTORY_CARD}
          onPress={() => router.push(ROUTES.SIGNS_LIST)}
        />
        <ModuleCard
          title="Collision"
          description="You can count the number of vehicles and determine the direction of each one."
          onPress={() => {}}
          backgroundImage={LOCAL_IMAGES.COLLISION_CARD}
        />
        <ModuleCard
          title="Schedule"
          description="You can count the number of vehicles and determine the direction of each one."
          onPress={() => {}}
          backgroundImage={LOCAL_IMAGES.SCHEDULE_CARD}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 10,
      paddingHorizontal: 16,
    },
    content: {
      gap: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
