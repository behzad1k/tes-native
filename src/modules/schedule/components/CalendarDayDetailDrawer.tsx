import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { Task, InspectionTask } from "../types";
import { MONTHS, TASK_STATUS, WEEKDAYS } from "@/src/constants/schedule";

interface CalendarDayDetailDrawerProps {
  date: Date;
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onInspectionTaskPress?: (task: InspectionTask, parentTask: Task) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const CalendarDayDetailDrawer: React.FC<CalendarDayDetailDrawerProps> = ({
  date,
  tasks,
  onTaskPress,
  onInspectionTaskPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const formatDate = (d: Date) => {
    const dayName = WEEKDAYS[d.getDay()];
    const day = d.getDate().toString().padStart(2, "0");
    const month = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Flatten tasks to show both tasks and their inspection tasks
  const allItems = tasks.flatMap((task) => {
    const items: {
      type: "task" | "inspection";
      data: Task | InspectionTask;
      parent?: Task;
      index: number;
    }[] = [];

    // Add inspection tasks
    task.inspectionTasks.forEach((inspection, idx) => {
      items.push({
        type: "inspection",
        data: inspection,
        parent: task,
        index: items.length + 1,
      });
    });

    // If no inspection tasks, add the task itself
    if (task.inspectionTasks.length === 0) {
      items.push({
        type: "task",
        data: task,
        index: items.length + 1,
      });
    }

    return items;
  });

  const renderItem = (item: {
    type: "task" | "inspection";
    data: Task | InspectionTask;
    parent?: Task;
    index: number;
  }) => {
    const isInspection = item.type === "inspection";
    const taskNumber = isInspection
      ? (item.data as InspectionTask).inspectionTaskNumber
      : (item.data as Task).taskNumber;
    const status = item.data.status;
    const location = isInspection
      ? item.parent?.location || ""
      : (item.data as Task).location;

    return (
      <TouchableOpacity
        key={`${item.type}-${item.data.id}`}
        style={styles.itemCard}
        onPress={() => {
          if (isInspection && item.parent) {
            onInspectionTaskPress?.(item.data as InspectionTask, item.parent);
          } else {
            onTaskPress?.(item.data as Task);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.itemIndex}>
          <TextView style={styles.indexText}>{item.index}</TextView>
        </View>

        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <TextView style={styles.itemTitle}>{taskNumber}</TextView>
            <TextView
              style={[styles.itemStatus, { color: TASK_STATUS[status].color }]}
            >
              {TASK_STATUS[status].label}
            </TextView>
          </View>
          <TextView style={styles.itemLocation}>Location : {location}</TextView>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>{formatDate(date)}</TextView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {allItems.length > 0 ? (
          allItems.map(renderItem)
        ) : (
          <View style={styles.emptyState}>
            <TextView style={styles.emptyText}>No tasks for this day</TextView>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SCREEN_HEIGHT * 0.6,
    },
    header: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: spacing.lg,
    },
    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    itemIndex: {
      width: scale(32),
      height: scale(32),
      borderRadius: scale(16),
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    indexText: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    itemContent: {
      flex: 1,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    itemTitle: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    itemStatus: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
    },
    itemLocation: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
      marginTop: 2,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: "center",
    },
    emptyText: {
      fontSize: FontSizes.base,
      color: theme.secondary,
    },
  });

export default CalendarDayDetailDrawer;
