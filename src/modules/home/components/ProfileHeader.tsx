import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { useAppSelector } from "@/src/store/hooks";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { Theme } from "@/src/types/theme";
import { DoorOpen, UserCircle } from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../../auth/hooks/useAuth";

export default function ProfileHeader() {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  return (
    <View style={styles.container}>
      <UserCircle size={60} />
      <View>
        <TextView>{`${user?.firstName} ${user?.lastName}`}</TextView>
        <TextView>{user?.email}</TextView>
      </View>
      <TouchableOpacity onPress={handleLogout} style={styles.logoutIcon}>
        <DoorOpen color={colors.red} size={35} />
      </TouchableOpacity>
    </View>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.xxs,
      alignItems: "center",
      paddingVertical: spacing.xxs,
    },
    logoutIcon: {
      marginLeft: "auto",
    },
  });
