import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { MaintenanceJob, JobAsset, MaintenanceImage } from "@/src/types/models";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { updateJob } from "@/src/store/slices/maintenanceSlice";
import { Toast } from "toastify-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import TextInputView from "@/src/components/ui/TextInputView";
import SignSupportCard from "../../signs/screens/SignsListScreen/components/SignCard";
import ImagePicker from "@/src/components/ui/ImagePicker";

interface JobDetailFormProps {
  job: MaintenanceJob;
}

const JobDetailForm = ({ job }: JobDetailFormProps) => {
  const styles = useThemedStyles(createStyles);
  const dispatch = useAppDispatch();
  const { closeDrawer } = useDrawer();

  const [editedJob, setEditedJob] = useState(job);
  const [hours, setHours] = useState(Math.floor(job.duration / 60).toString());
  const [minutes, setMinutes] = useState((job.duration % 60).toString());
  const { t } = useTranslation();
  const jobStatuses = useAppSelector((state) => state.maintenances.jobStatuses);
  const supports = useAppSelector((state) => state.supports.supports);
  const signs = useAppSelector((state) => state.signs.signs);
  const jobImages = useAppSelector((state) => state.maintenances.jobImages);
  const currentJobImages = jobImages.filter((img) => img.jobId === job.id);
  const [tempImages, setTempImages] = useState<any[]>([]);
  const [images, setImages] = useState<any[]>(currentJobImages);

  const handleUpdate = async () => {
    try {
      const totalDuration =
        parseInt(hours || "0") * 60 + parseInt(minutes || "0");

      const updatedJob: MaintenanceJob = {
        ...editedJob,
        duration: totalDuration,
        statusName:
          jobStatuses.find((s) => s.id === editedJob.statusId)?.name ||
          editedJob.statusName,
      };

      await dispatch(updateJob(updatedJob)).unwrap();

      Toast.success("Job updated successfully");
      closeDrawer();
    } catch (error) {
      Toast.error("Failed to update job");
    }
  };

  const renderSignSupport = (asset: JobAsset, index: number) => {
    const item = [...signs, ...supports].find((s) => s.id === asset.assetId);
    if (!item) return null;

    return <SignSupportCard item={item} />;
  };

  // useEffect(() => {
  //   setImages([...currentJobImages, ...tempImages]);
  // }, [currentJobImages, tempImages]);

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
              itemId={job.id}
              setTempImages={setTempImages}
              isCreateMode={true}
            />
          </View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <ButtonView
          variant="outline"
          onPress={() => closeDrawer()}
          style={styles.actionButton}
        >
          Cancel
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={handleUpdate}
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
