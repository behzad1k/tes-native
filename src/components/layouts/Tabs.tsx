import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { TabsType } from "@/src/types/layouts";
import { Theme } from "@/src/types/theme";
import { StyleProp, StyleSheet, TouchableOpacity, View } from "react-native";
import TextView from "../ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import Typography from "@/src/styles/theme/typography";
import { ViewStyle } from "react-native/Libraries/StyleSheet/StyleSheetTypes";

interface TabsProps {
  tab: string;
  setTab: React.Dispatch<React.SetStateAction<string>>;
  tabs: TabsType;
  containerStyle?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
}
const Tabs = ({
  tab,
  setTab,
  tabs,
  containerStyle = {},
  tabStyle = {},
}: TabsProps) => {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.container, containerStyle]}>
      {Object.entries(tabs)?.map(([t, v]) => (
        <TouchableOpacity
          onPress={() => setTab(t)}
          key={t}
          style={[styles.tab, tabStyle, tab == t ? styles.activeTab : {}]}
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
      paddingVertical: 12,
      borderBottomColor: theme.primary,
    },
    activeTab: {
      borderBottomColor: colors.lightGreen,
    },
    tabText: {
      color: theme.text,
      fontSize: 16,
      fontWeight: 600,
      lineHeight: 19,
    },
    tabTextActive: { color: colors.lightGreen },
  });

export default Tabs;
