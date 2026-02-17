import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { CollisionFormData } from "../../../types";
import { CollisionImage } from "@/src/types/models";
import { colors } from "@/src/styles/theme/colors";
import {
  Camera,
  Image as ImageIcon,
  Trash,
  CloudArrowUp,
  CheckCircle,
  Download,
} from "phosphor-react-native";
import { v4 as uuidv4 } from "uuid";
import * as ImagePicker from "expo-image-picker";
import { ImageStorage } from "@/src/store/persistence";

interface PicturesStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
  collisionId?: string;
  isEditing?: boolean;
}

const PicturesStep = ({
  control,
  errors,
  getValues,
  setValue,
  collisionId,
  isEditing,
}: PicturesStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const images = getValues("images") || [];

  // Request camera permission
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permission.required"), t("permission.cameraDescription"));
      return false;
    }
    return true;
  };

  // Request gallery permission
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permission.required"), t("permission.galleryDescription"));
      return false;
    }
    return true;
  };

  // Take photo with camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        await addImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(t("error"), t("collision.cameraError"));
    }
  };

  // Pick from gallery
  const handlePickFromGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 10,
      });

      if (!result.canceled && result.assets) {
        for (const asset of result.assets) {
          await addImage(asset.uri);
        }
      }
    } catch (error) {
      console.error("Gallery error:", error);
      Alert.alert(t("error"), t("collision.galleryError"));
    }
  };

  // Add image to form
  const addImage = async (uri: string) => {
    setIsLoading(true);
    try {
      // Save image to local storage
      const savedPath = await ImageStorage.saveImage(
        uri,
        `collision_${collisionId || "new"}`,
      );

      const newImage: CollisionImage = {
        imageId: uuidv4(),
        localPath: savedPath,
        isSynced: false,
        collisionId: "",
        uri: "",
        isNew: false,
      };

      const currentImages = getValues("images") || [];
      setValue("images", [...currentImages, newImage]);
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert(t("error"), t("collision.saveImageError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Remove image
  const handleRemoveImage = (imageId: string) => {
    Alert.alert(t("warning"), t("collision.confirmDeleteImage"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          const image = images.find((img) => img.imageId === imageId);
          if (image?.localPath) {
            try {
              await ImageStorage.deleteImage(image.localPath);
            } catch (error) {
              console.error("Error deleting image file:", error);
            }
          }

          const currentImages = getValues("images") || [];
          setValue(
            "images",
            currentImages.filter((img) => img.imageId !== imageId),
          );
        },
      },
    ]);
  };

  // Get image source
  const getImageSource = (image: CollisionImage) => {
    if (image.localPath) {
      return { uri: image.localPath };
    }
    // if (image.serverPath) {
    // return { uri: image.serverPath };
    // }
    return null;
  };

  // Count synced and unsynced images
  const syncedCount = images.filter((img) => img.isSynced).length;
  const unsyncedCount = images.length - syncedCount;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with counts */}
      <View style={styles.header}>
        <TextView style={styles.sectionTitle}>
          {t("collision.pictures")}
        </TextView>
        <View style={styles.countsContainer}>
          {syncedCount > 0 && (
            <View style={styles.countBadge}>
              <CheckCircle size={14} color={colors.success} />
              <TextView style={styles.countText}>{syncedCount}</TextView>
            </View>
          )}
          {unsyncedCount > 0 && (
            <View style={[styles.countBadge, styles.unsyncedBadge]}>
              <CloudArrowUp size={14} color={colors.warning} />
              <TextView style={styles.countText}>{unsyncedCount}</TextView>
            </View>
          )}
        </View>
      </View>

      {/* Add Image Buttons */}
      <View style={styles.buttonRow}>
        <ButtonView
          variant="outline"
          onPress={handleTakePhoto}
          style={styles.addButton}
          disabled={isLoading}
        >
          <Camera size={20} color={colors.lightGreen} />
          <TextView style={styles.buttonText}>
            {t("collision.takePhoto")}
          </TextView>
        </ButtonView>
        <ButtonView
          variant="outline"
          onPress={handlePickFromGallery}
          style={styles.addButton}
          disabled={isLoading}
        >
          <ImageIcon size={20} color={colors.lightGreen} />
          <TextView style={styles.buttonText}>
            {t("collision.fromGallery")}
          </TextView>
        </ButtonView>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.lightGreen} />
          <TextView style={styles.loadingText}>
            {t("collision.savingImage")}
          </TextView>
        </View>
      )}

      {/* Images Grid */}
      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <ImageIcon size={48} color={colors.lightGrey} />
          <TextView style={styles.emptyText}>
            {t("collision.noPictures")}
          </TextView>
          <TextView style={styles.emptySubtext}>
            {t("collision.addPicturesHint")}
          </TextView>
        </View>
      ) : (
        <View style={styles.imagesGrid}>
          {images.map((image) => {
            const source = getImageSource(image);
            return (
              <View key={image.imageId} style={styles.imageContainer}>
                {source ? (
                  <Image source={source} style={styles.image} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <ImageIcon size={32} color={colors.lightGrey} />
                  </View>
                )}

                {/* Sync Status Indicator */}
                <View
                  style={[
                    styles.syncIndicator,
                    image.isSynced
                      ? styles.syncedIndicator
                      : styles.unsyncedIndicator,
                  ]}
                >
                  {image.isSynced ? (
                    <CheckCircle size={16} color={colors.white} weight="fill" />
                  ) : (
                    <CloudArrowUp size={16} color={colors.white} />
                  )}
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleRemoveImage(image.imageId)}
                >
                  <Trash size={16} color={colors.white} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Sync Info */}
      {unsyncedCount > 0 && (
        <View style={styles.syncInfo}>
          <CloudArrowUp size={20} color={colors.warning} />
          <TextView style={styles.syncInfoText}>
            {t("collision.unsyncedImagesInfo", { count: unsyncedCount })}
          </TextView>
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    countsContainer: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    countBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: `${colors.success}20`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
    },
    unsyncedBadge: {
      backgroundColor: `${colors.warning}20`,
    },
    countText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.text,
    },
    buttonRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    addButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
    },
    buttonText: {
      color: colors.lightGreen,
      fontWeight: "500",
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: theme.background,
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    loadingText: {
      color: theme.textSecondary,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
      gap: spacing.sm,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 16,
      fontWeight: "500",
    },
    emptySubtext: {
      color: theme.textSecondary,
      fontSize: 14,
      textAlign: "center",
    },
    imagesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    imageContainer: {
      width: "31%",
      aspectRatio: 1,
      borderRadius: 8,
      overflow: "hidden",
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    syncIndicator: {
      position: "absolute",
      top: 4,
      left: 4,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    syncedIndicator: {
      backgroundColor: colors.success,
    },
    unsyncedIndicator: {
      backgroundColor: colors.warning,
    },
    deleteButton: {
      position: "absolute",
      top: 4,
      right: 4,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.error,
      alignItems: "center",
      justifyContent: "center",
    },
    syncInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: `${colors.warning}10`,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.warning}40`,
    },
    syncInfoText: {
      flex: 1,
      color: colors.warning,
      fontSize: 14,
    },
  });

export default PicturesStep;
