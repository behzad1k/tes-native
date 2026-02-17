import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import ButtonView from "@/src/components/ui/ButtonView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { InspectionTask, DataCollector, Equipment } from "../types";
import { Wrench, User } from "phosphor-react-native";

interface MapViewInspectionTaskDrawerProps {
  inspectionTask: InspectionTask;
  onClaim?: (task: InspectionTask) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const MapViewInspectionTaskDrawer: React.FC<MapViewInspectionTaskDrawerProps> = ({
  inspectionTask,
  onClaim,
}) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();

  const handleClaim = () => {
    onClaim?.(inspectionTask);
    closeDrawer();
  };

  const formatDateTime = () => {
    const start = `${inspectionTask.startDate} - ${inspectionTask.startTime || "07:30"}`;
    const end = `${inspectionTask.endDate} - ${inspectionTask.endTime || "17:30"}`;
    return { start, end };
  };

  const { start, end } = formatDateTime();

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
        {/* Inspection Task Number */}
        <View style={styles.section}>
          <TextInputView
            label="Inspection Task Number :"
            value={inspectionTask.inspectionTaskNumber}
            editable={false}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Start Date Time */}
        <View style={styles.dateRow}>
          <TextInputView
            label="Start Date Time:"
            value={start}
            editable={false}
            containerStyle={styles.dateInput}
          />
          <TextInputView
            label="End Date Time :"
            value={end}
            editable={false}
            containerStyle={styles.dateInput}
          />
        </View>

        {/* Note */}
        <View style={styles.section}>
          <TextView style={styles.label}>Note :</TextView>
          <TextInputView
            value={inspectionTask.note || "You are about to export the data for"}
            editable={false}
            multiline
            numberOfLines={3}
            style={styles.noteInput}
            containerStyle={styles.fullWidth}
          />
        </View>

        {/* Data Collectors */}
        {inspectionTask.dataCollectors.length > 0 && (
          <View style={styles.section}>
            <TextView style={styles.label}>Data Collectors :</TextView>
            <View style={styles.collectorsContainer}>
              {inspectionTask.dataCollectors.map(renderDataCollector)}
            </View>
          </View>
        )}

        {/* Equipments */}
        {inspectionTask.equipments.length > 0 && (
          <View style={styles.section}>
            <TextView style={styles.label}>Equipments :</TextView>
            <View style={styles.equipmentsContainer}>
              {inspectionTask.equipments.map(renderEquipment)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Claim Button */}
      <View style={styles.actions}>
        <ButtonView
          variant="primary"
          onPress={handleClaim}
          style={styles.claimButton}
        >
          Claim
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
      maxHeight: SCREEN_HEIGHT * 0.85,
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
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    claimButton: {
      paddingVertical: spacing.sm,
    },
  });

export default MapViewInspectionTaskDrawer;
