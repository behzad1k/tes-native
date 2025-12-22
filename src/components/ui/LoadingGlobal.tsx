import { useLoading } from "@/src/components/contexts/LoadingContext";
import React from "react";
import {
  View,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import TextView from "./TextView";
import { Theme } from "@/src/types/theme";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
  color?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message,
  transparent = true,
  color = "#007AFF",
}) => {
  const styles = useThemedStyles(createStyles);

  const { theme } = useTheme();
  return (
    <Modal
      transparent={transparent}
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size={70} color={"white"} />
          {message && <TextView style={styles.message}>{message}</TextView>}
        </View>
      </View>
    </Modal>
  );
};

export const LoadingGlobal: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  return <LoadingOverlay visible={isLoading} message={loadingMessage} />;
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, .7)",
      justifyContent: "center",
      alignItems: "center",
    },
    container: {
      backgroundColor: "transparent",
      alignItems: "center",
    },
    message: {
      marginTop: 15,
      fontSize: 16,
      color: theme.text,
      textAlign: "center",
      maxWidth: Dimensions.get("window").width * 0.7,
    },
  });
