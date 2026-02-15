import React, { useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import { SignImage, SupportImage } from "@/src/types/models";
import { colors } from "@/src/styles/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { v4 as uuidv4 } from "uuid";

// Type to handle both sign and support images
type ImageItem = SignImage | SupportImage;

interface ImagesStepProps {
  images: ImageItem[];
  onImagesChange: (images: ImageItem[]) => void;
  maxImages?: number;
  entityType: "sign" | "support";
  entityId: string;
}

export default function ImagesStep({
  images,
  onImagesChange,
  maxImages = 10,
  entityType,
  entityId,
}: ImagesStepProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = useCallback(async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(
        t("permissions.required"),
        t("permissions.cameraAndLibraryMessage"),
        [{ text: t("common.ok") }],
      );
      return false;
    }
    return true;
  }, [t]);

  const processImage = useCallback(
    (result: ImagePicker.ImagePickerResult): ImageItem | null => {
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const asset = result.assets[0];
      const imageId = uuidv4();

      const newImage: ImageItem = {
        imageId: imageId,
        localPath: asset.uri,
        isNew: true,
        isSynced: false,
        uri: asset.uri,
        ...(entityType === "sign"
          ? { signId: entityId }
          : { supportId: entityId }),
      };

      return newImage;
    },
    [entityId, entityType],
  );

  const handleTakePhoto = useCallback(async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        t("images.maxReached"),
        t("images.maxReachedMessage", { max: maxImages }),
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });

      const newImage = processImage(result);
      if (newImage) {
        onImagesChange([...images, newImage]);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert(t("common.error"), t("images.takingPhotoError"));
    } finally {
      setIsLoading(false);
    }
  }, [images, maxImages, requestPermissions, processImage, onImagesChange, t]);

  const handleSelectFromGallery = useCallback(async () => {
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      Alert.alert(
        t("images.maxReached"),
        t("images.maxReachedMessage", { max: maxImages }),
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets) {
        const newImages: ImageItem[] = [];

        for (const asset of result.assets) {
          const imageId = uuidv4();
          const newImage: ImageItem = {
            imageId: imageId,
            localPath: asset.uri,
            uri: asset.uri,
            isNew: true,
            isSynced: false,
            ...(entityType === "sign"
              ? { signId: entityId }
              : { supportId: entityId }),
          };
          newImages.push(newImage);
        }

        onImagesChange([...images, ...newImages]);
      }
    } catch (error) {
      console.error("Error selecting images:", error);
      Alert.alert(t("common.error"), t("images.selectingError"));
    } finally {
      setIsLoading(false);
    }
  }, [
    images,
    maxImages,
    requestPermissions,
    entityType,
    entityId,
    onImagesChange,
    t,
  ]);

  const handleRemoveImage = useCallback(
    (imageId: string) => {
      Alert.alert(t("images.removeTitle"), t("images.removeMessage"), [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () => {
            const updatedImages = images.filter(
              (img) => img.imageId !== imageId,
            );
            onImagesChange(updatedImages);
          },
        },
      ]);
    },
    [images, onImagesChange, t],
  );

  const showImageOptions = useCallback(() => {
    Alert.alert(t("images.addImage"), t("images.selectSource"), [
      {
        text: t("images.takePhoto"),
        onPress: handleTakePhoto,
      },
      {
        text: t("images.chooseFromGallery"),
        onPress: handleSelectFromGallery,
      },
      {
        text: t("common.cancel"),
        style: "cancel",
      },
    ]);
  }, [handleTakePhoto, handleSelectFromGallery, t]);

  const renderImageItem = useCallback(
    ({ item, index }: { item: ImageItem; index: number }) => {
      const imageSource = item.localPath || item.uri;

      return (
        <View style={styles.imageItemContainer}>
          <View style={styles.imageWrapper}>
            {imageSource ? (
              <Image
                source={{ uri: imageSource }}
                style={styles.imagePreview}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={colors.lightGrey}
                />
              </View>
            )}

            {/* Image Number Badge */}
            <View style={styles.imageBadge}>
              <TextView style={styles.imageBadgeText}>{index + 1}</TextView>
            </View>

            {/* Sync Status */}
            {!item.isSynced && (
              <View style={styles.unsyncedIndicator}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={14}
                  color={colors.white}
                />
              </View>
            )}

            {/* New Badge */}
            {item.isNew && (
              <View style={styles.newBadge}>
                <TextView style={styles.newBadgeText}>
                  {t("common.new")}
                </TextView>
              </View>
            )}

            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveImage(item.imageId)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [styles, handleRemoveImage, t],
  );

  const renderAddButton = useCallback(() => {
    if (images.length >= maxImages) return null;

    return (
      <TouchableOpacity
        style={styles.addImageButton}
        onPress={showImageOptions}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <>
            <Ionicons name="add" size={32} color={colors.primary} />
            <TextView style={styles.addImageText}>
              {t("images.addImage")}
            </TextView>
          </>
        )}
      </TouchableOpacity>
    );
  }, [images.length, maxImages, styles, showImageOptions, isLoading, t]);

  const renderEmptyState = useCallback(() => {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="images-outline" size={64} color={colors.lightGrey} />
        <TextView style={styles.emptyStateTitle}>
          {t("images.noImages")}
        </TextView>
        <TextView style={styles.emptyStateSubtitle}>
          {t("images.addImagesPrompt")}
        </TextView>

        <View style={styles.emptyStateActions}>
          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleTakePhoto}
            disabled={isLoading}
          >
            <Ionicons name="camera" size={24} color={colors.primary} />
            <TextView style={styles.emptyStateButtonText}>
              {t("images.takePhoto")}
            </TextView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emptyStateButton}
            onPress={handleSelectFromGallery}
            disabled={isLoading}
          >
            <Ionicons name="images" size={24} color={colors.primary} />
            <TextView style={styles.emptyStateButtonText}>
              {t("images.chooseFromGallery")}
            </TextView>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [styles, handleTakePhoto, handleSelectFromGallery, isLoading, t]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>{t("images.title")}</TextView>
        <TextView style={styles.subtitle}>
          {t("images.countLabel", { count: images.length, max: maxImages })}
        </TextView>
      </View>

      {/* Images Grid */}
      {images.length > 0 ? (
        <FlatList
          data={images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.imageId}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListFooterComponent={renderAddButton}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.md,
    },
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    gridContent: {
      paddingBottom: spacing.xl,
    },
    gridRow: {
      justifyContent: "space-between",
      marginBottom: spacing.md,
    },
    imageItemContainer: {
      width: "48%",
    },
    imageWrapper: {
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.border,
    },
    imagePreview: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    imagePlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.border,
    },
    imageBadge: {
      position: "absolute",
      top: spacing.xs,
      left: spacing.xs,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    imageBadgeText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.white,
    },
    unsyncedIndicator: {
      position: "absolute",
      top: spacing.xs,
      right: scale(32),
      backgroundColor: colors.warning,
      borderRadius: 10,
      padding: 4,
    },
    newBadge: {
      position: "absolute",
      bottom: spacing.xs,
      left: spacing.xs,
      backgroundColor: colors.success,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    newBadgeText: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.white,
    },
    removeButton: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
    },
    addImageButton: {
      width: "48%",
      aspectRatio: 1,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: "dashed",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primary + "10",
    },
    addImageText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary,
      marginTop: spacing.xs,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: spacing.xl,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginTop: spacing.md,
    },
    emptyStateSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      marginTop: spacing.xs,
    },
    emptyStateActions: {
      flexDirection: "row",
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    emptyStateButton: {
      alignItems: "center",
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      backgroundColor: colors.primary + "15",
    },
    emptyStateButtonText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.primary,
      marginTop: spacing.xs,
    },
  });
