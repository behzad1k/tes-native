import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { TabsType } from "@/src/types/layouts";
import { Theme } from "@/src/types/theme";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import TextView from "../ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import Typography from "@/src/styles/theme/typography";

interface TabsProps {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  tabs: TabsType;
}
const Tabs = ({ tab, setTab, tabs }: TabsProps) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.container}>
      {Object.entries(tabs)?.map(([t, v]) => (
        <TouchableOpacity
          onPress={() => setTab(t)}
          key={t}
          style={[styles.tab, tab == t ? styles.activeTab : {}]}
        >
          <TextView
            style={[styles.tabText, tab == t ? styles.tabTextActive : {}]}
          >
            {v.value}
          </TextView>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor: theme.background,
      flexDirection: "row",
      height: "auto",
    },
    tab: {
      flex: 1,
      alignItems: "center",
      borderBottomWidth: 2,
      paddingVertical: 16,
      borderBottomColor: theme.primary,
    },
    activeTab: {
      borderBottomColor: colors.lightGreen,
    },
    tabText: {
      color: theme.text,
      fontSize: 18,
      ...Typography?.weights.semiBold,
    },
    tabTextActive: { color: colors.lightGreen },
  });

export default Tabs;
