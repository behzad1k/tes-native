import TextView from "@/src/components/ui/TextView";
import { ROUTES } from "@/src/constants/navigation";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { spacing } from "@/src/styles/theme/spacing";
import { Theme } from "@/src/types/theme";
import { useRouter } from "expo-router";
import { LineVertical, Signpost, TrafficSign } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, TouchableOpacity } from "react-native";

const NewSignType = () => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { closeDrawer } = useDrawer();
  const router = useRouter();

  const handlePressItem = (item: "sign" | "support") => {
    closeDrawer("new-sign-type");
    console.log(item);
    router.navigate(
      item === "sign" ? ROUTES.SIGN_CREATE : ROUTES.SUPPORT_CREATE,
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView variant="h4">{t("signs.addingSignOrSupport")}</TextView>
      </View>
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => handlePressItem("sign")}
        >
          <View style={styles.itemIcon}>
            <TrafficSign size={40} />
          </View>
          <TextView style={styles.itemText}>{t("sign")}</TextView>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() => handlePressItem("support")}
        >
          <View style={styles.itemIcon}>
            <LineVertical size={40} />
          </View>
          <TextView style={styles.itemText}>{t("support")}</TextView>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor: theme.background,
      borderRadius: 20,
      paddingBottom: spacing.xxl,
      paddingTop: spacing.sm,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    content: {
      flexDirection: "row",
      justifyContent: "space-evenly",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
    },
    itemContainer: {
      gap: 16,
      alignItems: "center",
    },
    itemIcon: {
      backgroundColor: theme.primary,
      borderRadius: 20,
      padding: spacing.md,
    },
    itemText: {
      fontSize: 16,
      fontWeight: 600,
    },
  });

export default NewSignType;
