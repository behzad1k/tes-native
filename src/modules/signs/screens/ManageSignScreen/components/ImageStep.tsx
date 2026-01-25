import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Image } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextInputView from "@/src/components/ui/TextInputView";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import { SCALE } from "toastify-react-native/utils/helpers";
import { colors } from "@/src/styles/theme/colors";
import { CloudArrowDown, Images, Trash } from "phosphor-react-native";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import Typography, {
  FontSizes,
  FontWeights,
} from "@/src/styles/theme/typography";
import { Control } from "react-hook-form";
import { SignFormData } from "../../../types";

interface ImageStepProps {
  signFormControl: Control<SignFormData, any, SignFormData>;
}

const ImageStep = ({ signFormControl }: ImageStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.uploadBox}>
          <View style={styles.uploadBoxContent}>
            <Images size={80} weight="thin" />
            <TextView variant="h3">Take photo or browse files</TextView>
            <TextView variant="bodySmall" style={styles.uploadDescriptionText}>
              Upload your image from the gallery or take a photo or fetch from
              server
            </TextView>
            <View style={styles.uploadActions}>
              <TextView style={styles.uploadActionsText}>Take photo</TextView>
              <TextView style={styles.uploadActionsText}>|</TextView>
              <TextView style={styles.uploadActionsText}>Browse files</TextView>
            </View>
            <ButtonView
              variant="outline"
              size="small"
              style={styles.uploadBoxFetchButton}
              onPress={() => {}}
            >
              <CloudArrowDown size={18} color={colors.lightGreen} />
              <TextView style={styles.uploadBoxFetchText}>
                Fetch from server
              </TextView>
            </ButtonView>
          </View>
        </View>
        <View style={styles.uploadedBox}>
          <View style={styles.uploadedImage}></View>
          <TextView variant="bodySmall" style={styles.uploadedTitleText}>
            Image-600.jpg
          </TextView>
          <Trash style={styles.uploadedTrashIcon} size={26} weight="thin" />
        </View>
        <View style={styles.uploadedBox}>
          <View style={styles.uploadedImage}></View>
          <TextView variant="bodySmall" style={styles.uploadedTitleText}>
            Image-600.jpg
          </TextView>
          <Trash style={styles.uploadedTrashIcon} size={26} weight="thin" />
        </View>
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
      gap: spacing.xs,
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
    },
    uploadActions: {
      width: "100%",
      justifyContent: "space-around",
      flexDirection: "row",
      marginBottom: 12,
    },
    uploadActionsText: {
      color: colors.lightGreen,
      textDecorationLine: "underline",
      textDecorationColor: colors.lightGreen,
      fontWeight: FontWeights.regular,
      fontSize: FontSizes.base,
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
    uploadedBox: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 16,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderColor: colors.lightGreen,
    },
    uploadedImage: {
      backgroundColor: theme.primary,
      width: SCALE(36),
      height: SCALE(36),
      borderRadius: 4,
    },
    uploadedTitleText: {
      fontSize: FontSizes.xs,
      color: theme.textSecondary,
    },
    uploadedTrashIcon: {
      marginLeft: "auto",
    },
  });

export default ImageStep;
