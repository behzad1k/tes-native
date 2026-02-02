import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Alert,
  Modal,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { MaintenanceJob, JobAsset, MaintenanceImage } from "@/src/types/models";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
  updateJob,
  updateJobAsset,
  addJobImagesLocally,
  removeJobImage,
  downloadJobAttachments,
} from "@/src/store/slices/maintenanceSlice";
import { Toast } from "toastify-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import {
  Calendar,
  MapPin,
  User,
  Clock,
  Wrench,
  X,
  Camera,
  Image as ImageIcon,
  Trash,
  Download,
  CheckCircle,
} from "phosphor-react-native";
import * as ImagePicker from "expo-image-picker";
import { Dimensions } from "react-native";
import { useTranslation } from "react-i18next";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import TextInputView from "@/src/components/ui/TextInputView";

const { width } = Dimensions.get("screen");

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
  const [newImages, setNewImages] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<JobAsset | null>(null);
  const [assetNote, setAssetNote] = useState("");
  const [assetStatusId, setAssetStatusId] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const noteTextInput = useRef<TextInput>(null);
  const assetNoteTextInput = useRef<TextInput>(null);
  const { t } = useTranslation();
  const jobStatuses = useAppSelector((state) => state.maintenances.jobStatuses);
  const jobTypes = useAppSelector((state) => state.maintenances.jobTypes);
  const supports = useAppSelector((state) => state.supports.supports);
  const signs = useAppSelector((state) => state.signs.signs);
  const signSymbolImages = signs.flatMap((e) => e.images);
  const jobImages = useAppSelector((state) => state.maintenances.jobImages);

  const allSigns = supports.flatMap((s) => s.signs || []);

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

      if (newImages.length > 0) {
        const imagesToAdd: MaintenanceImage[] = newImages.map((img) => ({
          uri: img.uri,
          isSynced: false,
          jobId: job.id,
          isNew: true,
        }));
        dispatch(addJobImagesLocally(imagesToAdd));
      }

      Toast.success("Job updated successfully");
      closeDrawer();
    } catch (error) {
      Toast.error("Failed to update job");
    }
  };

  const handleAssetUpdate = async () => {
    if (!selectedAsset) return;

    try {
      const updatedAsset: JobAsset = {
        ...selectedAsset,
        statusId: assetStatusId,
        note: assetNote,
      };

      await dispatch(
        updateJobAsset({ jobId: job.id, asset: updatedAsset }),
      ).unwrap();

      setEditedJob({
        ...editedJob,
        assets: editedJob.assets.map((a) =>
          a.id === updatedAsset.id ? updatedAsset : a,
        ),
      });

      Toast.success("Asset updated successfully");
      setSelectedAsset(null);
    } catch (error) {
      Toast.error("Failed to update asset");
    }
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.error("Camera roll permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setNewImages([...newImages, ...result.assets]);
    }
  };

  const takePhoto = () => {
    pickImageFromGallery();
  };

  const downloadAttachments = async () => {
    setIsDownloading(true);
    try {
      await dispatch(downloadJobAttachments(job.id)).unwrap();
      Toast.success("Attachments downloaded");
    } catch (error) {
      Toast.error("Failed to download attachments");
    } finally {
      setIsDownloading(false);
    }
  };

  const deleteNewImage = (uri: string) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setNewImages(newImages.filter((img) => img.uri !== uri)),
      },
    ]);
  };

  const deleteExistingImage = (uri: string) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => dispatch(removeJobImage(uri)),
      },
    ]);
  };

  const openAssetEditModal = (asset: JobAsset) => {
    setSelectedAsset(asset);
    setAssetStatusId(asset.statusId);
    setAssetNote(asset.note || "");
  };

  const renderSign = (asset: JobAsset, index: number) => {
    const sign = allSigns.find((s) => s.id === asset.assetId);
    if (!sign) return null;

    const signImage = signSymbolImages.find(
      (img) => img.imageId === sign.signCodeId,
    );

    return (
      <View key={index} style={styles.assetRow}>
        <View style={styles.assetContent}>
          {signImage ? (
            <Image source={{ uri: signImage.uri }} style={styles.assetImage} />
          ) : (
            <Wrench size={40} color={colors.lightGreen} />
          )}
          <View style={styles.assetInfo}>
            <TextView variant="body" style={styles.assetId}>
              {sign.signId}
            </TextView>
            <TextView variant="caption" style={styles.assetStatus}>
              {jobStatuses.find((s) => s.id === asset.statusId)?.name ||
                asset.statusId}
            </TextView>
          </View>
        </View>
        <TouchableOpacity onPress={() => openAssetEditModal(asset)}>
          <Wrench size={30} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSupport = (asset: JobAsset, index: number) => {
    const support = supports.find((s) => s.id === asset.assetId);
    if (!support) return null;

    return (
      <View key={index} style={styles.assetRow}>
        <View style={styles.assetContent}>
          <MapPin size={40} color={colors.lightGreen} weight="fill" />
          <View style={styles.assetInfo}>
            <TextView variant="body" style={styles.assetId}>
              {support.supportId}
            </TextView>
            <TextView variant="caption" style={styles.assetStatus}>
              {jobStatuses.find((s) => s.id === asset.statusId)?.name ||
                asset.statusId}
            </TextView>
          </View>
        </View>
        <TouchableOpacity onPress={() => openAssetEditModal(asset)}>
          <Wrench size={30} color={colors.lightGreen} />
        </TouchableOpacity>
      </View>
    );
  };

  const currentJobImages = jobImages.filter((img) => img.jobId === job.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>{t("maintenance.jobDetails")}</TextView>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <TextInputView label={`${t("name")} :`} editable={false} />
          <View style={styles.inputGroup}>
            <TextView style={styles.label}>Type</TextView>
            <TextView style={styles.valueText}>{editedJob.typeName}</TextView>
          </View>

          <View style={styles.inputGroup}>
            <TextView style={styles.label}>Assign Date</TextView>
            <TextView style={styles.valueText}>{editedJob.assignDate}</TextView>
          </View>

          <View style={styles.inputGroup}>
            <TextView style={styles.label}>Status</TextView>
            <View style={styles.statusButtons}>
              {jobStatuses.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  onPress={() =>
                    setEditedJob({ ...editedJob, statusId: status.id })
                  }
                  style={[
                    styles.statusButton,
                    editedJob.statusId === status.id &&
                      styles.statusButtonActive,
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
          </View>

          <View style={styles.inputGroup}>
            <TextView style={styles.label}>Duration (HH:MM)</TextView>
            <View style={styles.durationRow}>
              <TextInput
                style={styles.durationInput}
                value={hours}
                onChangeText={setHours}
                keyboardType="number-pad"
                maxLength={3}
                placeholder="HH"
              />
              <TextView variant="h4">:</TextView>
              <TextInput
                style={styles.durationInput}
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="MM"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TextView style={styles.label}>Notes</TextView>
            <TouchableOpacity onPress={() => noteTextInput.current?.focus()}>
              <TextInput
                ref={noteTextInput}
                style={styles.notesInput}
                value={editedJob.note}
                onChangeText={(text) =>
                  setEditedJob({ ...editedJob, note: text })
                }
                multiline
                numberOfLines={4}
                placeholder="Add notes..."
                textAlignVertical="top"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Signs */}
        {editedJob.assets.filter((a) => a.type === 1).length > 0 && (
          <View style={styles.section}>
            <TextView variant="h4" style={styles.sectionTitle}>
              Signs
            </TextView>
            {editedJob.assets
              .filter((a) => a.type === 1)
              .map((asset, index) => renderSign(asset, index))}
          </View>
        )}

        {/* Supports */}
        {editedJob.assets.filter((a) => a.type === 2).length > 0 && (
          <View style={styles.section}>
            <TextView variant="h4" style={styles.sectionTitle}>
              Supports
            </TextView>
            {editedJob.assets
              .filter((a) => a.type === 2)
              .map((asset, index) => renderSupport(asset, index))}
          </View>
        )}

        {/* Images */}
        <View style={styles.section}>
          <TextView variant="h4" style={styles.sectionTitle}>
            Images
          </TextView>

          <View style={styles.imageActions}>
            <TouchableOpacity
              onPress={pickImageFromGallery}
              style={styles.imageActionButton}
            >
              <ImageIcon size={30} color={colors.lightGreen} />
              <TextView variant="caption">Gallery</TextView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={takePhoto}
              style={styles.imageActionButton}
            >
              <Camera size={30} color={colors.lightGreen} />
              <TextView variant="caption">Camera</TextView>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={downloadAttachments}
              style={styles.imageActionButton}
            >
              <Download size={30} color={colors.lightGreen} />
              <TextView variant="caption">Download</TextView>
            </TouchableOpacity>
          </View>

          <View style={styles.imagesGrid}>
            {newImages.map((img, index) => (
              <View key={`new-${index}`} style={styles.imageContainer}>
                <ImageBackground
                  source={{ uri: img.uri }}
                  style={styles.imageThumb}
                >
                  <TouchableOpacity
                    onPress={() => deleteNewImage(img.uri)}
                    style={styles.deleteButton}
                  >
                    <Trash size={20} color={colors.white} weight="fill" />
                  </TouchableOpacity>
                </ImageBackground>
              </View>
            ))}
            {currentJobImages.map((img, index) => (
              <View key={`existing-${index}`} style={styles.imageContainer}>
                <ImageBackground
                  source={{ uri: img.uri }}
                  style={styles.imageThumb}
                >
                  <TouchableOpacity
                    onPress={() => deleteExistingImage(img.uri)}
                    style={styles.deleteButton}
                  >
                    <Trash size={20} color={colors.white} weight="fill" />
                  </TouchableOpacity>
                </ImageBackground>
              </View>
            ))}
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
      {/*{/* Asset Edit Modal */}
      {/*<Modal
        isVisible={selectedAsset !== null}
        onBackdropPress={() => setSelectedAsset(null)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TextView variant="h4">Update Asset</TextView>
            <TouchableOpacity onPress={() => setSelectedAsset(null)}>
              <X size={24} color={colors.lightGreen} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <TextView style={styles.label}>Status</TextView>
              <View style={styles.statusButtons}>
                {jobStatuses.map((status) => (
                  <TouchableOpacity
                    key={status.id}
                    onPress={() => setAssetStatusId(status.id)}
                    style={[
                      styles.statusButton,
                      assetStatusId === status.id && styles.statusButtonActive,
                    ]}
                  >
                    <TextView
                      style={[
                        styles.statusButtonText,
                        assetStatusId === status.id &&
                          styles.statusButtonTextActive,
                      ]}
                    >
                      {status.name}
                    </TextView>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.inputGroup}>
              <TextView style={styles.label}>Notes</TextView>
              <TouchableOpacity
                onPress={() => assetNoteTextInput.current?.focus()}
              >
                <TextInput
                  ref={assetNoteTextInput}
                  style={styles.notesInput}
                  value={assetNote}
                  onChangeText={setAssetNote}
                  multiline
                  numberOfLines={4}
                  placeholder="Add notes..."
                  textAlignVertical="top"
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.modalActions}>
            <ButtonView
              variant="outline"
              onPress={() => setSelectedAsset(null)}
              style={styles.actionButton}
            >
              Cancel
            </ButtonView>
            <ButtonView
              variant="primary"
              onPress={handleAssetUpdate}
              style={styles.actionButton}
            >
              Update
            </ButtonView>
          </View>
        </View>
      </Modal>

      <Modal isVisible={isDownloading}>
        <View style={styles.loadingModal}>
          <TextView variant="h4" style={styles.loadingText}>
            Downloading attachments...
          </TextView>
        </View>
      </Modal>*/}
      *
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
    },
    sectionTitle: { color: theme.text, marginBottom: spacing.sm },
    inputGroup: { marginBottom: spacing.md },
    label: { color: theme.secondary, marginBottom: spacing.xs },
    valueText: { color: theme.text, paddingVertical: spacing.xs },
    statusButtons: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    statusButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: theme.secondary,
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
      color: theme.text,
      minHeight: 100,
    },
    assetRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    assetContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      flex: 1,
    },
    assetImage: { width: 40, height: 40, borderRadius: 4 },
    assetInfo: { flex: 1 },
    assetId: { color: theme.text, fontWeight: "600" },
    assetStatus: { color: theme.secondary },
    imageActions: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginBottom: spacing.md,
      paddingVertical: spacing.sm,
    },
    imageActionButton: { alignItems: "center", gap: spacing.xs },
    imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    imageContainer: {
      width: width * 0.25,
      height: width * 0.25,
      borderRadius: 8,
      overflow: "hidden",
    },
    imageThumb: {
      width: "100%",
      height: "100%",
      justifyContent: "flex-end",
      alignItems: "flex-end",
    },
    deleteButton: {
      backgroundColor: colors.error,
      padding: spacing.xs,
      borderRadius: 4,
      margin: spacing.xs,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    actionButton: { flex: 1 },
    modalContent: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: spacing.md,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    modalBody: { marginBottom: spacing.md },
    modalActions: { flexDirection: "row", gap: spacing.sm },
    loadingModal: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: spacing.xl,
      alignItems: "center",
    },
    loadingText: { color: theme.text },
  });

export default JobDetailForm;
