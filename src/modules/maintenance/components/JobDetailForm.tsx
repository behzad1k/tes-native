import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { MaintenanceJob, JobAsset, MaintenanceImage } from "@/src/types/models";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { Toast } from "toastify-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import TextInputView from "@/src/components/ui/TextInputView";
import SignSupportCard from "../../signs/screens/SignsListScreen/components/SignCard";
import ImagePicker from "@/src/components/ui/ImagePicker";
import { useMaintenanceOperations } from "../hooks/useMaintenanceOperations";

interface JobDetailFormProps {
  job: MaintenanceJob;
}

const JobDetailForm = ({ job }: JobDetailFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const [editedJob, setEditedJob] = useState(job);
  const { t } = useTranslation();
  const supports = useAppSelector((state) => state.supports.supports);
  const signs = useAppSelector((state) => state.signs.signs);
  const { editJob, getJobImages, saveJobImages, jobStatuses } =
    useMaintenanceOperations();
  const [images, setImages] = useState<MaintenanceImage[]>(
    getJobImages(job.id || ""),
  );

  const handleCancel = () => {
    const imagesChanged = images.length !== getJobImages(job.id || "").length;

    if (imagesChanged) {
      Alert.alert(t("cancel"), "Discard unsaved changes?", [
        { text: t("buttons.cancel"), style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => closeDrawer() },
      ]);
    } else {
      closeDrawer();
    }
  };

  const onSubmit = async () => {
    if (!job.id || !job) return;

    try {
      const result = await editJob(job.id, {
        statusId: editedJob.statusId,
        duration: job.duration,
        note: editedJob.note,
      });

      saveJobImages(job.id, images);

      if (result.success) {
        Toast.success("Job updated successfully!");
        closeDrawer();
      } else {
        Toast.error("Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      Toast.error("An error occurred while updating the job");
    }
  };

  const renderSignSupport = (asset: JobAsset, index: number) => {
    const item = [...signs, ...supports].find((s) => s.id === asset.assetId);
    if (!item) return null;

    return <SignSupportCard item={item} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>{t("maintenance.jobDetails")}</TextView>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TextInputView
            label={`${t("name")} :`}
            value={editedJob.name}
            containerStyle={styles.formInput}
            editable={false}
          />
          <TextInputView
            label={`${t("type")} :`}
            value={editedJob.typeName}
            containerStyle={styles.formInput}
            editable={false}
          />
          {editedJob.assets.length > 0 && (
            <View style={styles.jobs}>
              {editedJob.assets.map((asset, index) =>
                renderSignSupport(asset, index),
              )}
            </View>
          )}

          <View style={styles.inputGroup}>
            <TextInputView
              label={`${t("assignDate")} :`}
              value={editedJob.assignDate}
              containerStyle={{ width: "60%" }}
              editable={false}
            />
            <TextInputView
              label={`${t("duration")} :`}
              value={editedJob.duration.toString()}
              containerStyle={{ maxWidth: "20%" }}
              onChangeText={(text) =>
                setEditedJob({
                  ...editedJob,
                  duration: Number(text) || editedJob.duration,
                })
              }
            />
            {/*<TextInputView
              label={`-`}
              value={editedJob.duration.toString()}
              containerStyle={{ maxWidth: "20%" }}
            />*/}
          </View>

          <TextView style={styles.label}>{t("status")} :</TextView>
          <View style={styles.statusButtons}>
            {jobStatuses.map((status) => (
              <TouchableOpacity
                key={status.id}
                onPress={() =>
                  setEditedJob({ ...editedJob, statusId: status.id })
                }
                style={[
                  styles.statusButton,
                  editedJob.statusId === status.id && styles.statusButtonActive,
                ]}
              >
                <TextView
                  style={[
                    styles.statusButtonText,
                    editedJob.statusId === status.id &&
                      styles.statusButtonTextActive,
                  ]}
                >
                  {status.name}
                </TextView>
              </TouchableOpacity>
            ))}
          </View>

          <TextView style={styles.label}>{t("notes")} :</TextView>
          <TextInputView
            style={styles.notesInput}
            containerStyle={styles.formInput}
            value={editedJob.note}
            onChangeText={(text) => setEditedJob({ ...editedJob, note: text })}
            multiline
            numberOfLines={4}
            placeholder="Add notes..."
            textAlignVertical="top"
          />
          <View>
            <ImagePicker
              images={images}
              onChange={setImages}
              extraImageFields={{
                jobId: job.id || "",
                isSynced: false,
              }}
            />
          </View>
        </View>
      </ScrollView>
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
          onPress={onSubmit}
          style={styles.actionButton}
        >
          Update
        </ButtonView>
      </View>
    </View>
  );
};
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SCREEN_HEIGHT * 0.8,
      paddingBottom: scale(54),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      maxHeight: scale(58),
    },
    title: { fontSize: FontSizes.base, fontWeight: FontWeights.semiBold },
    content: { flex: 1 },
    section: {
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: scale(16),
    },
    sectionTitle: { color: theme.text, marginBottom: spacing.sm },
    jobs: {
      borderBottomColor: theme.border,
      borderBottomWidth: 1,
    },
    formInput: {
      paddingHorizontal: spacing.sm,
      flex: 1,
    },
    inputGroup: {
      flexDirection: "row",
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
    },
    label: {
      fontSize: FontSizes.base,
      fontWeight: 600,
      paddingHorizontal: spacing.sm,
    },
    valueText: { color: theme.text, paddingVertical: spacing.xs },
    statusButtons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    statusButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 100,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statusButtonActive: {
      backgroundColor: colors.lightGreen,
      borderColor: colors.lightGreen,
    },
    statusButtonText: { color: theme.secondary },
    statusButtonTextActive: { color: colors.white, fontWeight: "600" },
    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    durationInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      width: 60,
      textAlign: "center",
      color: theme.text,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: spacing.sm,
      flex: 1,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: { flex: 1, paddingVertical: 10 },
  });

export default JobDetailForm;
