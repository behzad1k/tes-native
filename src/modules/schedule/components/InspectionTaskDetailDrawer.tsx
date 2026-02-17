import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  Image,
  TouchableOpacity,
} from "react-native";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import ButtonView from "@/src/components/ui/ButtonView";
import ImagePicker from "@/src/components/ui/ImagePicker";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import {
  InspectionTask,
  TaskStatus,
  TimePeriod,
  ScheduleAttachment,
  DataCollector,
  Equipment,
} from "../types";
import StatusToggle from "./StatusToggle";
import TimePeriodInput from "./TimePeriodInput";
import { Images, Wrench, User } from "phosphor-react-native";

interface InspectionTaskDetailDrawerProps {
  inspectionTask: InspectionTask;
  onSave?: (updatedTask: InspectionTask) => void;
  onResume?: (task: InspectionTask) => void;
  showDataCollectors?: boolean;
  showEquipments?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const InspectionTaskDetailDrawer: React.FC<InspectionTaskDetailDrawerProps> = ({
  inspectionTask,
  onSave,
  onResume,
  showDataCollectors = false,
  showEquipments = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const { t } = useTranslation();

  // Local state
  const [editedTask, setEditedTask] = useState<InspectionTask>({
    ...inspectionTask,
  });
  const [attachments, setAttachments] = useState<ScheduleAttachment[]>(
    inspectionTask.attachments || [],
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const changed =
      editedTask.status !== inspectionTask.status ||
      editedTask.note !== inspectionTask.note ||
      JSON.stringify(editedTask.timePeriods) !==
        JSON.stringify(inspectionTask.timePeriods) ||
      attachments.length !== inspectionTask.attachments.length;
    setHasChanges(changed);
  }, [editedTask, attachments, inspectionTask]);

  const handleStatusChange = (status: TaskStatus) => {
    setEditedTask((prev) => ({ ...prev, status }));
  };

  const handleNoteChange = (note: string) => {
    setEditedTask((prev) => ({ ...prev, note }));
  };

  const handleTimePeriodsChange = (timePeriods: TimePeriod[]) => {
    setEditedTask((prev) => ({ ...prev, timePeriods }));
  };

  const handleAttachmentsChange = (newAttachments: ScheduleAttachment[]) => {
    setAttachments(newAttachments);
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
    const updatedTask = { ...editedTask, attachments };
    onSave?.(updatedTask);
    closeDrawer();
  };

  const handleResume = () => {
    const updatedTask = { ...editedTask, attachments };
    onResume?.(updatedTask);
    closeDrawer();
  };

  const renderDataCollector = (collector: DataCollector) => (
    <View key={collector.id} style={styles.collectorRow}>
      <View style={styles.avatarContainer}>
        {collector.avatar ? (
          <Image source={{ uri: collector.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <User size={24} color={colors.white} />
          </View>
        )}
      </View>
      <View style={styles.collectorInfo}>
        <TextView style={styles.collectorName}>{collector.name}</TextView>
        <TextView style={styles.collectorRegion}>{collector.region}</TextView>
      </View>
    </View>
  );

  const renderEquipment = (equipment: Equipment) => (
    <View key={equipment.id} style={styles.equipmentRow}>
      <View style={styles.equipmentIcon}>
        <Wrench size={20} color={colors.lightGreen} />
      </View>
      <View style={styles.equipmentInfo}>
        <TextView style={styles.equipmentName}>{equipment.name}</TextView>
        <TextView style={styles.equipmentDesc}>
          {equipment.description || "No Description"}
        </TextView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>Inspection Task Detail</TextView>
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

        {/* Inspection Task Number */}
        <View style={styles.section}>
          <TextInputView
            label="Inspection Task Number :"
            value={editedTask.inspectionTaskNumber}
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

        {/* Data Collectors (shown in Map View detail) */}
        {showDataCollectors && editedTask.dataCollectors.length > 0 && (
          <View style={styles.section}>
            <TextView style={styles.label}>Data Collectors :</TextView>
            <View style={styles.collectorsContainer}>
              {editedTask.dataCollectors.map(renderDataCollector)}
            </View>
          </View>
        )}

        {/* Equipments (shown in Map View detail) */}
        {showEquipments && editedTask.equipments.length > 0 && (
          <View style={styles.section}>
            <TextView style={styles.label}>Equipments :</TextView>
            <View style={styles.equipmentsContainer}>
              {editedTask.equipments.map(renderEquipment)}
            </View>
          </View>
        )}

        {/* Upload Attachment */}
        <View style={styles.section}>
          <TextView style={styles.label}>Upload Attachment :</TextView>
          <View style={styles.uploadArea}>
            <Images size={40} color={colors.lightGreen} weight="thin" />
          </View>
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
        <ButtonView
          variant="primary"
          onPress={handleResume}
          style={styles.actionButton}
        >
          Resume Task
        </ButtonView>
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
      height: SCREEN_HEIGHT * 0.9,
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
    uploadArea: {
      borderWidth: 2,
      borderStyle: "dashed",
      borderColor: colors.lightGreen,
      borderRadius: 8,
      paddingVertical: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
    },
    collectorsContainer: {
      gap: spacing.sm,
    },
    collectorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    avatarContainer: {
      width: scale(48),
      height: scale(48),
      borderRadius: scale(24),
      overflow: "hidden",
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
    avatarPlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: colors.lightGreen,
      alignItems: "center",
      justifyContent: "center",
    },
    collectorInfo: {
      flex: 1,
    },
    collectorName: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    collectorRegion: {
      fontSize: FontSizes.sm,
      color: theme.secondary,
    },
    equipmentsContainer: {
      gap: spacing.sm,
    },
    equipmentRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    equipmentIcon: {
      width: scale(40),
      height: scale(40),
      borderRadius: scale(20),
      backgroundColor: `${colors.lightGreen}20`,
      alignItems: "center",
      justifyContent: "center",
    },
    equipmentInfo: {
      flex: 1,
    },
    equipmentName: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      color: theme.text,
    },
    equipmentDesc: {
      fontSize: FontSizes.sm,
      color: theme.secondary,
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

export default InspectionTaskDetailDrawer;
