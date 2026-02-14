import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { MaintenanceJob, JobAsset, MaintenanceImage } from "@/src/types/models";
import { useAppSelector } from "@/src/store/hooks";
import { Toast } from "toastify-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import TextInputView from "@/src/components/ui/TextInputView";
import SignSupportCard from "../../signs/screens/SignsListScreen/components/SignCard";
import ImagePicker from "@/src/components/ui/ImagePicker";
import { useMaintenanceOperations } from "../hooks/useMaintenanceOperations";
import { SYNC_STATUS } from "@/src/constants/global";
import { CloudArrowDown } from "phosphor-react-native";

interface JobDetailFormProps {
  job: MaintenanceJob;
}

const JobDetailForm = ({ job }: JobDetailFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const { t } = useTranslation();

  // Get supports and signs from store
  const supports = useAppSelector((state) => state.supports.supports);
  const signs = useAppSelector((state) => state.signs.signs);

  // Use maintenance operations hook
  const {
    editJob,
    getJobImages,
    saveJobImages,
    fetchJobAttachments,
    jobStatuses,
    isSyncing,
  } = useMaintenanceOperations();

  // Local state
  const [editedJob, setEditedJob] = useState<MaintenanceJob>({ ...job });
  const [images, setImages] = useState<MaintenanceImage[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load images on mount
  useEffect(() => {
    const existingImages = getJobImages(job.id || "");
    setImages(existingImages);
  }, [job.id, getJobImages]);

  // Track changes
  useEffect(() => {
    const jobChanged =
      editedJob.statusId !== job.statusId ||
      editedJob.duration !== job.duration ||
      editedJob.note !== job.note;

    const imagesChanged =
      images.length !== getJobImages(job.id || "").length ||
      images.some((img) => img.isNew && !img.isSynced);

    setHasChanges(jobChanged || imagesChanged);
  }, [editedJob, images, job, getJobImages]);

  // Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(t("cancel"), "Discard unsaved changes?", [
        { text: t("buttons.cancel"), style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => closeDrawer(),
        },
      ]);
    } else {
      closeDrawer();
    }
  };

  // Handle save
  const onSubmit = async () => {
    if (!job.id) return;

    try {
      // Update job data
      const result = await editJob(job.id, {
        statusId: editedJob.statusId,
        duration: editedJob.duration,
        note: editedJob.note,
      });

      // Save images
      saveJobImages(job.id, images);

      if (result.success) {
        Toast.success("Job updated successfully!");
        closeDrawer();
      } else {
        Toast.error(result.error || "Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      Toast.error("An error occurred while updating the job");
    }
  };

  // Handle downloading attachments from server
  const handleFetchFromServer = async () => {
    if (!job.id) return;

    setIsDownloading(true);
    try {
      const result = await fetchJobAttachments(job.id);
      if (result.success && result.images) {
        // Merge downloaded images with existing local images
        const existingLocalImages = images.filter(
          (img) => img.isNew && !img.isSynced,
        );
        const downloadedImages = result.images || [];

        // Combine: downloaded images + new local images
        setImages([...downloadedImages, ...existingLocalImages]);
        Toast.success(`Downloaded ${downloadedImages.length} images`);
      } else {
        Toast.error(result.error || "Failed to download attachments");
      }
    } catch (error) {
      console.error("Error fetching attachments:", error);
      Toast.error("Failed to fetch attachments");
    } finally {
      setIsDownloading(false);
    }
  };

  // Render asset (sign or support)
  const renderSignSupport = (asset: JobAsset, index: number) => {
    // Find in signs or supports
    const allSigns = [...signs, ...supports.flatMap((s) => s.signs || [])];
    const allItems = [...allSigns, ...supports];

    const item = allItems.find((s) => s.id === asset.assetId);
    if (!item) return null;

    return <SignSupportCard key={`asset-${index}`} item={item as any} />;
  };

  // Handle image changes
  const handleImagesChange = (newImages: MaintenanceImage[]) => {
    // Ensure all new images have proper metadata
    const processedImages = newImages.map((img) => ({
      ...img,
      jobId: job.id || "",
      status: img.isSynced ? SYNC_STATUS.SYNCED : SYNC_STATUS.NOT_SYNCED,
    }));
    setImages(processedImages);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>{t("maintenance.jobDetails")}</TextView>
        {!job.isSynced && (
          <View style={styles.unsyncedBadge}>
            <TextView style={styles.unsyncedText}>Unsynced</TextView>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {/* Job Name (read-only) */}
          <TextInputView
            label={`${t("name")} :`}
            value={editedJob.name}
            containerStyle={styles.formInput}
            editable={false}
          />

          {/* Job Type (read-only) */}
          <TextInputView
            label={`${t("type")} :`}
            value={editedJob.typeName}
            containerStyle={styles.formInput}
            editable={false}
          />

          {/* Assets */}
          {editedJob.assets.length > 0 && (
            <View style={styles.assetsSection}>
              <TextView style={styles.sectionLabel}>Assets:</TextView>
              <View style={styles.assetsList}>
                {editedJob.assets.map((asset, index) =>
                  renderSignSupport(asset, index),
                )}
              </View>
            </View>
          )}

          {/* Assign Date & Duration */}
          <View style={styles.inputGroup}>
            <TextInputView
              label={`${t("assignDate")} :`}
              value={editedJob.assignDate}
              containerStyle={{ width: "60%" }}
              editable={false}
            />
            <TextInputView
              label={`${t("duration")} (min):`}
              value={editedJob.duration.toString()}
              containerStyle={{ maxWidth: "35%" }}
              keyboardType="numeric"
              onChangeText={(text) => {
                const duration = parseInt(text, 10);
                if (!isNaN(duration) && duration >= 0) {
                  setEditedJob({
                    ...editedJob,
                    duration,
                  });
                }
              }}
            />
          </View>

          {/* Status Selection */}
          <TextView style={styles.label}>{t("status")} :</TextView>
          <View style={styles.statusButtons}>
            {jobStatuses.map((status) => (
              <TouchableOpacity
                key={status.id}
                onPress={() =>
                  setEditedJob({
                    ...editedJob,
                    statusId: status.id,
                    statusName: status.name,
                  })
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

          {/* Notes */}
          <TextView style={styles.label}>{t("notes")} :</TextView>
          <TextInputView
            style={styles.notesInput}
            containerStyle={styles.formInput}
            value={editedJob.note || ""}
            onChangeText={(text) => setEditedJob({ ...editedJob, note: text })}
            multiline
            numberOfLines={4}
            placeholder="Add notes..."
            textAlignVertical="top"
          />

          {/* Images */}
          <View style={styles.imagesSection}>
            <ImagePicker
              images={images}
              onChange={handleImagesChange}
              extraImageFields={{
                jobId: job.id || "",
                isSynced: false,
              }}
              showFetchFromServer={true}
              onFetchFromServer={handleFetchFromServer}
            />

            {isDownloading && (
              <View style={styles.downloadingOverlay}>
                <ActivityIndicator size="small" color={colors.lightGreen} />
                <TextView style={styles.downloadingText}>
                  Downloading...
                </TextView>
              </View>
            )}
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
          {t("buttons.cancel")}
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={onSubmit}
          style={styles.actionButton}
          loading={isSyncing}
          disabled={!hasChanges}
        >
          {t("buttons.save")}
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
      height: SCREEN_HEIGHT * 0.85,
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
    title: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
    },
    unsyncedBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 4,
    },
    unsyncedText: {
      fontSize: FontSizes.xs,
      color: colors.black,
      fontWeight: FontWeights.semiBold,
    },
    content: {
      flex: 1,
    },
    section: {
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: scale(16),
    },
    sectionLabel: {
      fontSize: FontSizes.base,
      fontWeight: FontWeights.semiBold,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.xs,
    },
    assetsSection: {
      marginBottom: spacing.sm,
    },
    assetsList: {
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
      fontWeight: FontWeights.semiBold,
      paddingHorizontal: spacing.sm,
    },
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
    statusButtonText: {
      color: theme.secondary,
    },
    statusButtonTextActive: {
      color: colors.white,
      fontWeight: FontWeights.semiBold,
    },
    notesInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: spacing.sm,
      minHeight: 80,
      flex: 1,
    },
    imagesSection: {
      position: "relative",
    },
    downloadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "row",
      gap: spacing.xs,
    },
    downloadingText: {
      color: colors.lightGreen,
      fontWeight: FontWeights.semiBold,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 10,
    },
  });

export default JobDetailForm;
