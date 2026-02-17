import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { Task, TaskStatus } from "../types";
import { ArrowsClockwise, Warning } from "phosphor-react-native";
import { TASK_STATUS } from "@/src/constants/schedule";

interface ScheduleCardProps {
  task: Task;
  index: number;
  onPress?: () => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({
  task,
  index,
  onPress,
}) => {
  const styles = useThemedStyles(createStyles);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "DONE":
        return colors.lightGreen;
      case "IN_PROGRESS":
        return colors.yellow;
      case "TO_DO":
      default:
        return colors.lightGreen;
    }
  };

  const getSyncBadge = () => {
    if (task.isSynced) {
      return (
        <View style={[styles.syncBadge, styles.syncedBadge]}>
          <ArrowsClockwise size={12} color={colors.white} weight="bold" />
          <TextView style={styles.syncBadgeText}>Synced</TextView>
        </View>
      );
    }
    return (
      <View style={[styles.syncBadge, styles.notSyncedBadge]}>
        <Warning size={12} color={colors.white} weight="bold" />
        <TextView style={styles.syncBadgeText}>Not Synced</TextView>
      </View>
    );
  };

  const formatDateRange = () => {
    return `${task.startDate}, 7:30 / ${task.endDate}, 17:30`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left accent bar */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: getStatusColor(task.status) },
        ]}
      />

      <View style={styles.content}>
        {/* Header row with task number and sync badge */}
        <View style={styles.headerRow}>
          <View style={styles.taskNumberContainer}>
            <TextView style={styles.taskNumber}>{task.taskNumber}</TextView>
            {getSyncBadge()}
          </View>
          <TextView
            style={[styles.statusText, { color: getStatusColor(task.status) }]}
          >
            {TASK_STATUS[task.status].label}
          </TextView>
        </View>

        {/* Location */}
        <TextView style={styles.location}>Location : {task.location}</TextView>

        {/* Date and time */}
        <TextView style={styles.dateTime}>{formatDateRange()}</TextView>

        {/* Study type */}
        <TextView style={styles.studyType}>{task.studyType}</TextView>
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      overflow: "hidden",
    },
    accentBar: {
      width: 4,
      backgroundColor: colors.lightGreen,
    },
    content: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      gap: spacing.xxs,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    taskNumberContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    taskNumber: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    syncBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    syncedBadge: {
      backgroundColor: colors.lightGreen,
    },
    notSyncedBadge: {
      backgroundColor: colors.error,
    },
    syncBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.white,
    },
    statusText: {
      fontSize: 14,
      fontWeight: "500",
    },
    location: {
      fontSize: 12,
      color: theme.secondary,
    },
    dateTime: {
      fontSize: 12,
      color: theme.secondary,
    },
    studyType: {
      fontSize: 12,
      color: theme.secondary,
    },
  });

export default ScheduleCard;
