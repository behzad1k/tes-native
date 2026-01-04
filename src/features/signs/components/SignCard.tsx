import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { Sign } from "@/src/database/models/Sign";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { CheckCircle, Clock, XCircle } from "phosphor-react-native";

interface SignCardProps {
  sign: Sign;
  onPress?: () => void;
}

export function SignCard({ sign, onPress }: SignCardProps) {
  const styles = useThemedStyles(createStyles);

  const getStatusIcon = () => {
    switch (sign.status) {
      case "synced":
        return <CheckCircle size={20} color={colors.success} weight="fill" />;
      case "pending":
        return <Clock size={20} color={colors.warning} weight="fill" />;
      case "failed":
        return <XCircle size={20} color={colors.error} weight="fill" />;
    }
  };

  const getStatusText = () => {
    switch (sign.status) {
      case "synced":
        return "Synced";
      case "pending":
        return "Pending Sync";
      case "failed":
        return "Sync Failed";
    }
  };

  const getConditionColor = () => {
    switch (sign.condition) {
      case "good":
        return colors.success;
      case "fair":
        return colors.warning;
      case "poor":
        return colors.error;
      case "damaged":
        return colors.red;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TextView variant="h4" style={styles.signType}>
            {sign.signType.replace("_", " ").toUpperCase()}
          </TextView>
          <View style={styles.statusBadge}>
            {getStatusIcon()}
            <TextView variant="caption" style={styles.statusText}>
              {getStatusText()}
            </TextView>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {sign.address && (
          <View style={styles.row}>
            <TextView variant="bodySmall" style={styles.label}>
              Address:
            </TextView>
            <TextView variant="bodySmall" style={styles.value}>
              {sign.address}
            </TextView>
          </View>
        )}

        <View style={styles.row}>
          <TextView variant="bodySmall" style={styles.label}>
            Condition:
          </TextView>
          <TextView
            variant="bodySmall"
            style={[styles.value, { color: getConditionColor() }]}
          >
            {sign.condition.toUpperCase()}
          </TextView>
        </View>

        <View style={styles.row}>
          <TextView variant="bodySmall" style={styles.label}>
            Location:
          </TextView>
          <TextView variant="bodySmall" style={styles.value}>
            {sign.locationLat.toFixed(6)}, {sign.locationLng.toFixed(6)}
          </TextView>
        </View>

        {sign.notes && (
          <View style={styles.notesContainer}>
            <TextView variant="bodySmall" style={styles.label}>
              Notes:
            </TextView>
            <TextView variant="bodySmall" style={styles.notes}>
              {sign.notes}
            </TextView>
          </View>
        )}

        <View style={styles.footer}>
          <TextView variant="caption" style={styles.timestamp}>
            Created: {new Date(sign.createdAt).toLocaleDateString()}
          </TextView>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      marginBottom: spacing.sm,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    signType: {
      flex: 1,
      color: theme.text,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: theme.background,
    },
    statusText: {
      fontSize: 11,
      color: theme.text,
    },
    content: {
      gap: spacing.xs,
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
