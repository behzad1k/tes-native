import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { Collision } from "@/src/types/models";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import {
  CheckCircle,
  CloudArrowUp,
  XCircle,
  CarBattery,
  Calendar,
  MapPin,
} from "phosphor-react-native";
import { SYNC_STATUS } from "@/src/constants/global";
import { useTheme } from "@/src/contexts/ThemeContext";

interface CollisionCardProps {
  collision: Collision;
  divisionName: string;
  onPress?: () => void;
}

export default function CollisionCard({
  collision,
  divisionName,
  onPress,
}: CollisionCardProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();

  const getStatusIcon = () => {
    if (collision.isSynced && collision.syncStatus === SYNC_STATUS.SYNCED) {
      return <CheckCircle size={18} color={colors.success} weight="fill" />;
    }
    if (
      !collision.isSynced ||
      collision.syncStatus === SYNC_STATUS.NOT_SYNCED
    ) {
      return <CloudArrowUp size={18} color={colors.warning} weight="fill" />;
    }
    return <XCircle size={18} color={colors.error} weight="fill" />;
  };

  const getStatusText = () => {
    if (collision.isSynced && collision.syncStatus === SYNC_STATUS.SYNCED) {
      return "Synced";
    }
    if (
      !collision.isSynced ||
      collision.syncStatus === SYNC_STATUS.NOT_SYNCED
    ) {
      return collision.isNew ? "New" : "Modified";
    }
    return "Error";
  };

  const getStatusColor = () => {
    if (collision.isSynced && collision.syncStatus === SYNC_STATUS.SYNCED) {
      return colors.success;
    }
    if (
      !collision.isSynced ||
      collision.syncStatus === SYNC_STATUS.NOT_SYNCED
    ) {
      return colors.warning;
    }
    return colors.error;
  };

  // Format date
  const formattedDate = collision.submissionDT
    ? new Date(collision.submissionDT).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "No date";

  // Get collision number or ID
  const collisionNumber =
    collision.general?.collisionNumber ||
    collision.general?.CaseNumber ||
    collision.id.substring(0, 12) + "...";

  // Check if has new images
  const hasNewImages = collision.images?.some((img) => img.isNew) || false;

  // Count of roads, vehicles, persons
  const roadsCount = collision.roads?.length || 0;
  const vehiclesCount = collision.vehicles?.length || 0;
  const personsCount = collision.persons?.length || 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
        <View style={[styles.icon, !collision.isSynced && styles.iconUnsynced]}>
          <CarBattery size={24} color={theme.secondary} />
        </View>
        {!collision.isSynced && <View style={styles.unsyncedBadge} />}
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <TextView style={styles.collisionTitle} numberOfLines={1}>
            {collisionNumber}
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
          <View style={styles.metaItem}>
            <MapPin size={14} color={theme.secondary} />
            <TextView style={styles.metaText} numberOfLines={1}>
              {divisionName}
            </TextView>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.metaItem}>
            <Calendar size={14} color={theme.secondary} />
            <TextView style={styles.metaText}>{formattedDate}</TextView>
          </View>

          <View style={styles.statsContainer}>
            {roadsCount > 0 && (
              <View style={styles.statBadge}>
                <TextView style={styles.statText}>
                  {roadsCount} Road{roadsCount > 1 ? "s" : ""}
                </TextView>
              </View>
            )}
            {vehiclesCount > 0 && (
              <View style={styles.statBadge}>
                <TextView style={styles.statText}>
                  {vehiclesCount} Vehicle{vehiclesCount > 1 ? "s" : ""}
                </TextView>
              </View>
            )}
            {personsCount > 0 && (
              <View style={styles.statBadge}>
                <TextView style={styles.statText}>
                  {personsCount} Person{personsCount > 1 ? "s" : ""}
                </TextView>
              </View>
            )}
          </View>
        </View>

        {hasNewImages && (
          <View style={styles.imageBadge}>
            <TextView style={styles.imageBadgeText}>
              +{collision.images.filter((img) => img.isNew).length} images
            </TextView>
          </View>
        )}
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
    collisionTitle: {
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
      gap: 8,
    },
    metaItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    metaText: {
      fontWeight: "400",
      fontSize: 13,
      lineHeight: 18,
      color: theme.secondary,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 4,
    },
    statsContainer: {
      flexDirection: "row",
      gap: 4,
    },
    statBadge: {
      backgroundColor: theme.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    statText: {
      fontSize: 10,
      color: theme.secondary,
      fontWeight: "500",
    },
    imageBadge: {
      backgroundColor: colors.info + "20",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      alignSelf: "flex-start",
      marginTop: 4,
    },
    imageBadgeText: {
      fontSize: 10,
      color: colors.info,
      fontWeight: "600",
    },
  });
