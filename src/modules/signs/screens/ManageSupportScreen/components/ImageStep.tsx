import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { SCALE } from "toastify-react-native/utils/helpers";
import { colors } from "@/src/styles/theme/colors";
import {
  CloudArrowDown,
  Images,
  Trash,
  Camera,
  FolderOpen,
} from "phosphor-react-native";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { FontSizes, FontWeights } from "@/src/styles/theme/typography";
import { Control } from "react-hook-form";
import { SupportFormData } from "../../../types";
import { useSupportImages } from "../../../hooks/useSupportOperations";
import { useAppSelector } from "@/src/store/hooks";
import * as ImagePicker from "expo-image-picker";
import { SupportImage } from "@/src/types/models";
import { SYNC_STATUS } from "@/src/constants/global";

interface ImageStepProps {
  supportFormControl: Control<SupportFormData, any, SupportFormData>;
  supportId?: string;
  tempImages?: SupportImage[];
  setTempImages?: React.Dispatch<React.SetStateAction<SupportImage[]>>;
  isCreateMode?: boolean;
}

const ImageStep = ({
  supportFormControl,
  supportId,
  tempImages = [],
  setTempImages,
  isCreateMode = false,
}: ImageStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { addImageFromCamera, addImageFromGallery, deleteImage } =
    useSupportImages();

  const supports = useAppSelector((state) => state.supports.supports);
  const currentSupport = supportId
    ? supports.find((s) => s.id === supportId)
    : null;
  const [images, setImages] = useState<SupportImage[]>(
    isCreateMode ? tempImages : currentSupport?.images || [],
  );

  useEffect(() => {
    if (isCreateMode) {
      setImages(tempImages);
    } else if (currentSupport) {
      setImages(currentSupport.images);
    }
  }, [currentSupport, tempImages, isCreateMode]);

  const handleTakePhoto = async () => {
    if (isCreateMode) {
      await handleTempImageFromCamera();
    } else {
      if (!supportId) {
        Alert.alert("Error", "Support ID is required");
        return;
      }
      const result = await addImageFromCamera(supportId);
      if (result.success) {
      }
    }
  };

  const handleBrowseFiles = async () => {
    if (isCreateMode) {
      await handleTempImageFromGallery();
    } else {
      if (!supportId) {
        Alert.alert("Error", "Support ID is required");
        return;
      }
      const result = await addImageFromGallery(supportId);
      if (result.success) {
      }
    }
  };

  const handleTempImageFromCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const tempImageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newImage: SupportImage = {
          uri: imageUri,
          supportId: "temp",
          isNew: true,
          status: SYNC_STATUS.NOT_SYNCED,
          imageId: tempImageId,
          localPath: imageUri,
        };

        if (setTempImages) {
          setTempImages((prev) => [...prev, newImage]);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  const handleTempImageFromGallery = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Gallery permission is required to select photos",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const tempImageId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newImage: SupportImage = {
          uri: imageUri,
          supportId: "temp",
          isNew: true,
          status: SYNC_STATUS.NOT_SYNCED,
          imageId: tempImageId,
          localPath: imageUri,
        };

        if (setTempImages) {
          setTempImages((prev) => [...prev, newImage]);
        }
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
    }
  };

  const handleDeleteImage = async (imageId: string, index: number) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (isCreateMode) {
            if (setTempImages) {
              setTempImages((prev) => prev.filter((_, i) => i !== index));
            }
          } else if (supportId) {
            const result = await deleteImage(supportId, imageId);
            if (!result.success) {
              Alert.alert("Error", "Failed to delete image");
            }
          }
        },
      },
    ]);
  };

  const handleFetchFromServer = () => {
    Alert.alert(
      "Coming Soon",
      "Fetch from server feature will be available soon",
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.uploadBox}>
          <View style={styles.uploadBoxContent}>
            <Images size={80} weight="thin" color={colors.lightGreen} />
            <TextView variant="h3">Take photo or browse files</TextView>
            <TextView variant="bodySmall" style={styles.uploadDescriptionText}>
              Upload your image from the gallery or take a photo or fetch from
              server
            </TextView>
            <View style={styles.uploadActions}>
              <TouchableOpacity onPress={handleTakePhoto}>
                <View style={styles.uploadActionButton}>
                  <Camera size={20} color={colors.lightGreen} />
                  <TextView style={styles.uploadActionsText}>
                    Take photo
                  </TextView>
                </View>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity onPress={handleBrowseFiles}>
                <View style={styles.uploadActionButton}>
                  <FolderOpen size={20} color={colors.lightGreen} />
                  <TextView style={styles.uploadActionsText}>
                    Browse files
                  </TextView>
                </View>
              </TouchableOpacity>
            </View>
            <ButtonView
              variant="outline"
              size="small"
              style={styles.uploadBoxFetchButton}
              onPress={handleFetchFromServer}
            >
              <CloudArrowDown size={18} color={colors.lightGreen} />
              <TextView style={styles.uploadBoxFetchText}>
                Fetch from server
              </TextView>
            </ButtonView>
          </View>
        </View>

        {/* Display uploaded images */}
        {images.length > 0 && (
          <View style={styles.imagesContainer}>
            <TextView variant="h4" style={styles.imagesTitle}>
              Uploaded Images ({images.length})
            </TextView>
            {images.map((image, index) => (
              <View key={image.imageId || index} style={styles.uploadedBox}>
                <Image
                  source={{ uri: image.localPath || image.uri }}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
                <View style={styles.imageInfo}>
                  <TextView
                    variant="bodySmall"
                    style={styles.uploadedTitleText}
                  >
                    Image-{index + 1}.jpg
                  </TextView>
                  {image.isNew && (
                    <TextView variant="caption" style={styles.newBadge}>
                      New
                    </TextView>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteImage(image.imageId || "", index)}
                  style={styles.deleteButton}
                >
                  <Trash size={26} weight="thin" color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {images.length === 0 && (
          <View style={styles.emptyState}>
            <TextView variant="body" style={styles.emptyText}>
              No images uploaded yet
            </TextView>
            <TextView variant="caption" style={styles.emptySubtext}>
              {isCreateMode
                ? "Add images before creating the support"
                : "Add images to this support"}
            </TextView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    form: {
      padding: spacing.md,
      paddingTop: 0,
      gap: spacing.md,
    },
    uploadBox: {
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 16,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      paddingHorizontal: spacing.xxl,
      borderColor: colors.lightGreen,
    },
    uploadBoxContent: {
      alignItems: "center",
      gap: 22,
    },
    uploadDescriptionText: {
      textAlign: "center",
      color: theme.secondary,
    },
    uploadActions: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-around",
      alignItems: "center",
      marginBottom: 12,
      gap: 16,
    },
    uploadActionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    uploadActionsText: {
      color: colors.lightGreen,
      textDecorationLine: "underline",
      textDecorationColor: colors.lightGreen,
      fontWeight: FontWeights.regular,
      fontSize: FontSizes.base,
    },
    divider: {
      width: 1,
      height: 20,
      backgroundColor: colors.lightGreen,
    },
    uploadBoxFetchButton: {
      gap: 4,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xs,
      borderRadius: 4,
    },
    uploadBoxFetchText: {
      fontSize: FontSizes.sm,
      color: colors.lightGreen,
      fontWeight: FontWeights.semiBold,
    },
    imagesContainer: {
      gap: spacing.xs,
    },
    imagesTitle: {
      marginBottom: spacing.sm,
      color: theme.text,
    },
    uploadedBox: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 16,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderColor: theme.border,
      backgroundColor: theme.primary,
    },
    uploadedImage: {
      width: SCALE(60),
      height: SCALE(60),
      borderRadius: 8,
      backgroundColor: theme.background,
    },
    imageInfo: {
      flex: 1,
      gap: 4,
    },
    uploadedTitleText: {
      fontSize: FontSizes.sm,
      color: theme.text,
      fontWeight: FontWeights.medium,
    },
    newBadge: {
      color: colors.lightGreen,
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.semiBold,
    },
    deleteButton: {
      padding: spacing.xs,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: "center",
      gap: spacing.xs,
    },
    emptyText: {
      color: theme.secondary,
    },
    emptySubtext: {
      color: theme.secondary,
      textAlign: "center",
    },
  });

export default ImageStep;
