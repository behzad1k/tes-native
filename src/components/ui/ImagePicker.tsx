import { SYNC_STATUS } from "@/src/constants/global";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { useSignImages } from "@/src/modules/signs/hooks/useSignOperations";
import { colors } from "@/src/styles/theme/colors";
import { FontWeights, FontSizes } from "@/src/styles/theme/fonts";
import { spacing } from "@/src/styles/theme/spacing";
import { SignImage } from "@/src/types/models";
import {
  Images,
  Camera,
  FolderOpen,
  CloudArrowDown,
  Trash,
} from "phosphor-react-native";
import { useTranslation } from "react-i18next";
import { Alert, View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { SCALE } from "toastify-react-native/utils/helpers";
import ButtonView from "./ButtonView";
import TextView from "./TextView";
import { Theme } from "@/src/types/theme";
import * as ExpoImagePicker from "expo-image-picker";

interface ImagePickerProps {
  images: any[];
  itemId: string;
  setTempImages?: React.Dispatch<React.SetStateAction<SignImage[]>>;
  isCreateMode?: boolean;
}
const ImagePicker = ({
  isCreateMode,
  itemId,
  setTempImages,
  images,
}: ImagePickerProps) => {
  const styles = useThemedStyles(createStyles);
  const { addImageFromCamera, addImageFromGallery, deleteImage } =
    useSignImages();
  const { t } = useTranslation();

  const handleTakePhoto = async () => {
    if (isCreateMode) {
      await handleTempImageFromCamera();
    } else {
      if (!itemId) {
        Alert.alert("Error", "Sign ID is required");
        return;
      }
      const result = await addImageFromCamera(itemId);
      if (result.success) {
      }
    }
  };

  const handleBrowseFiles = async () => {
    if (isCreateMode) {
      await handleTempImageFromGallery();
    } else {
      if (!itemId) {
        Alert.alert("Error", "Sign ID is required");
        return;
      }
      const result = await addImageFromGallery(itemId);
      if (result.success) {
      }
    }
  };

  // At the top of the component, fix the temp image ID generation:

  const handleTempImageFromCamera = async () => {
    try {
      const permission = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos",
        );
        return;
      }

      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        // Use URI as imageId for temp images - makes it easier to track
        const tempImageId = imageUri.split("/").pop() || `temp_${Date.now()}`;

        const newImage: SignImage = {
          uri: imageUri,
          signId: "temp",
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
        await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Gallery permission is required to select photos",
        );
        return;
      }

      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true, // Allow multiple
      });

      if (!result.canceled && result.assets) {
        const newImages: SignImage[] = result.assets.map((asset) => {
          const tempImageId =
            asset.uri.split("/").pop() || `temp_${Date.now()}`;

          return {
            uri: asset.uri,
            signId: "temp",
            isNew: true,
            status: SYNC_STATUS.NOT_SYNCED,
            imageId: tempImageId,
            localPath: asset.uri,
          };
        });

        if (setTempImages) {
          setTempImages((prev) => [...prev, ...newImages]);
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
          } else if (itemId) {
            const result = await deleteImage(itemId, imageId);
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
                <TextView style={styles.uploadActionsText}>Take photo</TextView>
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
                <TextView variant="bodySmall" style={styles.uploadedTitleText}>
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
              ? "Add images before creating the sign"
              : "Add images to this sign"}
          </TextView>
        </View>
      )}
    </View>
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
export default ImagePicker;
