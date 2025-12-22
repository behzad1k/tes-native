import LogoIcon from "@/src/components/icons/LogoIcon";
import ThemeSwitchButton from "@/src/components/ui/DarkModeButton";
import LanguageSwitchButton from "@/src/components/ui/LanguageSwitchButton";
import TextView from "@/src/components/ui/TextView";
import { useLanguage } from "@/src/hooks/useLanguage";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { Theme } from "@/src/types/theme";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ArrowLeft, ArrowRight } from "react-native-feather";

interface HeaderProps {
  title?: string;
  onBackPress?: (() => void) | true;
}

export const Header: React.FC<HeaderProps> = ({
  title = "tes",
  onBackPress = undefined,
}) => {
  const navigation = useNavigation();
  const styles = useThemedStyles(createStyles);
  const { currentLanguage } = useLanguage();
  const handleBackPress = () => {
    if (typeof onBackPress === "function") {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return <View style={styles.container}></View>;
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      height: 50,
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      borderStyle: "solid",
    },
  });
