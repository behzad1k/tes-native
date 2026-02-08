import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { Sign, Support } from "@/src/types/models";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import {
  CheckCircle,
  Clock,
  LineVertical,
  TrafficSign,
  XCircle,
  CloudArrowUp,
} from "phosphor-react-native";
import { SYNC_STATUS } from "@/src/constants/global";
import { useTheme } from "@/src/contexts/ThemeContext";
import { isSupport } from "..";

interface SignSupportCardProps {
  item: Sign | Support;
  onPress?: () => void;
}

export default function SignSupportCard({
  item,
  onPress,
}: SignSupportCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  const getStatusIcon = () => {
    switch (item.status) {
      case SYNC_STATUS.SYNCED:
        return <CheckCircle size={18} color={colors.success} weight="fill" />;
      case SYNC_STATUS.NOT_SYNCED:
        return <CloudArrowUp size={18} color={colors.warning} weight="fill" />;
      default:
        return <XCircle size={18} color={colors.error} weight="fill" />;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case SYNC_STATUS.SYNCED:
        return "Synced";
      case SYNC_STATUS.NOT_SYNCED:
        return item.isNew ? "New" : "Modified";
      default:
        return "Error";
    }
  };

  const getStatusColor = () => {
    switch (item.status) {
      case SYNC_STATUS.SYNCED:
        return colors.success;
      case SYNC_STATUS.NOT_SYNCED:
        return colors.warning;
      default:
        return colors.error;
    }
  };

  // Check if item has new images
  const hasNewImages = item.images?.some((img) => img.isNew) || false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.icon,
            item.status === SYNC_STATUS.NOT_SYNCED && styles.iconUnsynced,
          ]}
        >
          {isSupport(item) ? (
            <LineVertical size={24} color={theme.secondary} />
          ) : (
            <TrafficSign size={24} color={theme.secondary} />
          )}
        </View>
        {item.status === SYNC_STATUS.NOT_SYNCED && (
          <View style={styles.unsyncedBadge} />
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <TextView style={styles.signTitle}>
            {isSupport(item)
              ? (item as Support).supportId
              : (item as Sign).signId}
          </TextView>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor() + "20" },
            ]}
          >
            {getStatusIcon()}
            <TextView
              variant="caption"
              style={[styles.statusText, { color: getStatusColor() }]}
            >
              {getStatusText()}
            </TextView>
          </View>
        </View>

        <View style={styles.metaRow}>
          <TextView style={styles.signDescription} numberOfLines={1}>
            {item.note || "No description"}
          </TextView>

          {hasNewImages && (
            <View style={styles.imageBadge}>
              <TextView style={styles.imageBadgeText}>
                +{item.images.filter((img) => img.isNew).length} images
              </TextView>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    iconContainer: {
      position: "relative",
    },
    icon: {
      margin: "auto",
      borderRadius: 20,
      backgroundColor: theme.primary,
      padding: spacing.xs,
      width: 48,
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
    iconUnsynced: {
      borderWidth: 2,
      borderColor: colors.warning,
    },
    unsyncedBadge: {
      position: "absolute",
      top: 0,
      right: 0,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.warning,
      borderWidth: 2,
      borderColor: theme.background,
    },
    content: {
      flex: 1,
      gap: 4,
    },
    titleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
    },
    signTitle: {
      fontWeight: "600",
      fontSize: 15,
      lineHeight: 20,
      color: theme.text,
      flex: 1,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    signDescription: {
      fontWeight: "400",
      fontSize: 13,
      lineHeight: 18,
      color: theme.secondary,
      flex: 1,
    },
    imageBadge: {
      backgroundColor: colors.info + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    imageBadgeText: {
      fontSize: 10,
      color: colors.info,
      fontWeight: "600",
    },
  });
