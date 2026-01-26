import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { Sign } from "@/src/types/models";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import {
  CheckCircle,
  Clock,
  TrafficSign,
  XCircle,
} from "phosphor-react-native";
import { SYNC_STATUS } from "@/src/constants/global";
import { useTheme } from "@/src/contexts/ThemeContext";
import Typography from "@/src/styles/theme/typography";

interface SignCardProps {
  sign: Sign;
  onPress?: () => void;
}

export function SignCard({ sign, onPress }: SignCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const getStatusIcon = () => {
    switch (sign.status) {
      case SYNC_STATUS.SYNCED:
        return <CheckCircle size={20} color={colors.success} weight="fill" />;
      case SYNC_STATUS.NOT_SYNCED:
        return <XCircle size={20} color={colors.error} weight="fill" />;
      // case "failed":
      // return <Clock size={20} color={colors.warning} weight="fill" />;
    }
  };

  const getStatusText = () => {
    switch (sign.status) {
      case SYNC_STATUS.SYNCED:
        return "Synced";
      case SYNC_STATUS.NOT_SYNCED:
        return "Pending Failed";
    }
  };

  console.log(sign);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.icon}>
        <TrafficSign size={24} color={theme.secondary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <TextView style={styles.signTitle}>{sign.localId}</TextView>
          {/*<View style={styles.statusBadge}>
            {getStatusIcon()}
            <TextView variant="caption" style={styles.statusText}>
              {getStatusText()}
            </TextView>
          </View>*/}
        </View>
        <TextView style={styles.signDescription}>{sign.note}</TextView>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderColor: theme.border,
      gap: 10,
    },
    icon: {
      margin: "auto",
      borderRadius: 200,
      backgroundColor: theme.primary,
      padding: spacing.xxs,
    },
    header: {
      flex: 1,
    },
    titleRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    signTitle: {
      fontWeight: 600,
      fontSize: 14,
      lineHeight: 22,
    },
    signDescription: {
      fontWeight: 400,
      fontSize: 10,
      lineHeight: 18,
      color: theme.secondary,
    },
    content: {
      flex: 1,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: theme.secondary,
      fontWeight: "500",
    },
    value: {
      color: theme.text,
      flex: 1,
      textAlign: "right",
    },
    notesContainer: {
      marginTop: spacing.xs,
      gap: 4,
    },
    notes: {
      color: theme.text,
      fontStyle: "italic",
    },
    footer: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    timestamp: {
      color: theme.secondary,
    },
  });
