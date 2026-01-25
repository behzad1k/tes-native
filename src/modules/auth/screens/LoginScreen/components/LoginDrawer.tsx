import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import React from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

const LoginDrawer: React.FC = () => {
  const styles = useThemedStyles(createStyles);

  return (
    <KeyboardAvoidingView style={styles.loginContainer}>
      <TouchableWithoutFeedback
        style={styles.container}
        onPress={() => Platform.OS == "ios" && Keyboard.dismiss()}
      >
        <View style={styles.formContainer}></View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    loginContainer: {
      flex: 1,
      height: 460,
      backgroundColor: "rgba(0, 0, 0, 0)",
      justifyContent: "center",
      alignItems: "center",
    },
    container: {
      flex: 1,
    },
    formContainer: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
    },
  });

export default LoginDrawer;
