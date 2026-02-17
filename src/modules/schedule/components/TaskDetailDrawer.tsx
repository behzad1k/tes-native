import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions, Alert } from "react-native";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import ButtonView from "@/src/components/ui/ButtonView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { Task, TaskStatus, TimePeriod } from "../types";
import StatusToggle from "./StatusToggle";
import TimePeriodInput from "./TimePeriodInput";

interface TaskDetailDrawerProps {
  task: Task;
  onSave?: (updatedTask: Task) => void;
  onResume?: (task: Task) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  onSave,
  onResume,
}) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const { t } = useTranslation();

  // Local state
  const [editedTask, setEditedTask] = useState<Task>({ ...task });
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      editedTask.status !== task.status ||
      editedTask.note !== task.note ||
      JSON.stringify(editedTask.timePeriods) !==
        JSON.stringify(task.timePeriods);
    setHasChanges(changed);
  }, [editedTask, task]);

  const handleStatusChange = (status: TaskStatus) => {
    setEditedTask((prev) => ({ ...prev, status }));
  };

  const handleNoteChange = (note: string) => {
    setEditedTask((prev) => ({ ...prev, note }));
  };

  const handleTimePeriodsChange = (timePeriods: TimePeriod[]) => {
    setEditedTask((prev) => ({ ...prev, timePeriods }));
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(t("cancel"), "Discard unsaved changes?", [
        { text: t("buttons.cancel"), style: "cancel" },
        { text: "Discard", style: "destructive", onPress: closeDrawer },
      ]);
    } else {
      closeDrawer();
    }
  };

  const handleSave = () => {
    onSave?.(editedTask);
    closeDrawer();
  };

  const handleResume = () => {
    onResume?.(editedTask);
    closeDrawer();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>Task Details</TextView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Status */}
        <View style={styles.section}>
          <TextView style={styles.label}>Status :</TextView>
          <StatusToggle
            value={editedTask.status}
            onChange={handleStatusChange}
          />
        </View>

        {/* Task Number */}
        <View style={styles.section}>
          <TextInputView
            label="Task Number :"
            value={editedTask.taskNumber}
            editable={false}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Study Type */}
        <View style={styles.section}>
          <TextInputView
            label="Study Type :"
            value={editedTask.studyType}
            editable={false}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Date Row */}
        <View style={styles.dateRow}>
          <TextInputView
            label="Start Date :"
            value={editedTask.startDate}
            editable={false}
            containerStyle={styles.dateInput}
          />
          <TextInputView
            label="End Date :"
            value={editedTask.endDate}
            editable={false}
            containerStyle={styles.dateInput}
          />
        </View>

        {/* Time Period */}
        <View style={styles.section}>
          <TextView style={styles.label}>Time Period :</TextView>
          <TimePeriodInput
            timePeriods={editedTask.timePeriods}
            onChange={handleTimePeriodsChange}
            editable={editedTask.status !== "DONE"}
          />
        </View>

        {/* Note */}
        <View style={styles.section}>
          <TextView style={styles.label}>Note :</TextView>
          <TextInputView
            value={editedTask.note || ""}
            onChangeText={handleNoteChange}
            placeholder="You are about to export the data for"
            multiline
            numberOfLines={3}
            style={styles.noteInput}
            containerStyle={styles.fullWidth}
          />
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <ButtonView
          variant="outline"
          onPress={handleCancel}
          style={styles.actionButton}
        >
          Cancel
        </ButtonView>
        {editedTask.status === "DONE" ? (
          <ButtonView
            variant="primary"
            onPress={handleSave}
            style={styles.actionButton}
            disabled={!hasChanges}
          >
            Save
          </ButtonView>
        ) : (
          <ButtonView
            variant="primary"
            onPress={handleResume}
            style={styles.actionButton}
          >
            Resume Task
          </ButtonView>
        )}
      </View>
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SCREEN_HEIGHT * 0.85,
      paddingBottom: scale(20),
    },
    header: {
      paddingVertical: spacing.sm,
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
      padding: spacing.md,
      gap: spacing.md,
    },
    section: {
      gap: spacing.xs,
    },
    label: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
      marginBottom: 4,
    },
    fullWidth: {
      width: "100%",
    },
    dateRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    dateInput: {
      flex: 1,
    },
    noteInput: {
      minHeight: scale(80),
      textAlignVertical: "top",
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      flex: 1,
      paddingVertical: spacing.xs,
    },
  });

export default TaskDetailDrawer;
