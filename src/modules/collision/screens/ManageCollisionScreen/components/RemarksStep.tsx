import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Control,
  Controller,
  UseFormGetValues,
  UseFormSetValue,
} from "react-hook-form";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import { CollisionFormData } from "../../../types";
import { useCollisionFields } from "../../../hooks/useCollisionOperations";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import { colors } from "@/src/styles/theme/colors";
import { Note } from "phosphor-react-native";

interface RemarksStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
}

const RemarksStep = ({
  control,
  errors,
  getValues,
  setValue,
}: RemarksStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { remarkFields } = useCollisionFields();

  // Handle field change
  const handleFieldChange = (fieldName: string, value: any) => {
    const currentRemark = getValues("remark") || {};
    setValue("remark", {
      ...currentRemark,
      [fieldName]: value,
    });
  };

  // Get field value
  const getFieldValue = (fieldName: string) => {
    const remark = getValues("remark") || {};
    return remark[fieldName];
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Note size={24} color={colors.lightGreen} />
        </View>
        <View style={styles.headerText}>
          <TextView style={styles.sectionTitle}>
            {t("collision.remarks")}
          </TextView>
          <TextView style={styles.sectionSubtitle}>
            {t("collision.remarksDescription")}
          </TextView>
        </View>
      </View>

      {/* Remark Fields */}
      {remarkFields.length === 0 ? (
        <View style={styles.emptyState}>
          <TextView style={styles.emptyText}>
            {t("collision.noRemarkFields")}
          </TextView>
        </View>
      ) : (
        <View style={styles.fieldsContainer}>
          {remarkFields.map((field) => (
            <View key={field.name} style={styles.fieldWrapper}>
              <TextView style={styles.fieldLabel}>
                {field.labelText}
                {field.isRequired && (
                  <TextView style={styles.required}> *</TextView>
                )}
              </TextView>
              <Controller
                control={control}
                name={`remark.${field.name}` as any}
                rules={{
                  required: field.isRequired
                    ? t("validation.required")
                    : undefined,
                }}
                render={({ field: formField }) => (
                  <DynamicFieldRenderer
                    name={formField.name}
                    control={control}
                    field={field}
                    value={formField.value}
                    onChange={formField.onChange}
                    errors={errors?.remark?.[field.name]?.message}
                  />
                )}
              />
              {errors?.remark?.[field.name] && (
                <TextView style={styles.errorText}>
                  {errors.remark[field.name].message}
                </TextView>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <TextView style={styles.tipsTitle}>{t("collision.tips")}</TextView>
        <View style={styles.tipRow}>
          <TextView style={styles.tipBullet}>•</TextView>
          <TextView style={styles.tipText}>
            {t("collision.remarksTip1")}
          </TextView>
        </View>
        <View style={styles.tipRow}>
          <TextView style={styles.tipBullet}>•</TextView>
          <TextView style={styles.tipText}>
            {t("collision.remarksTip2")}
          </TextView>
        </View>
        <View style={styles.tipRow}>
          <TextView style={styles.tipBullet}>•</TextView>
          <TextView style={styles.tipText}>
            {t("collision.remarksTip3")}
          </TextView>
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
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: spacing.lg,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${colors.lightGreen}20`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    headerText: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.xs,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    fieldsContainer: {
      gap: spacing.md,
    },
    fieldWrapper: {
      marginBottom: spacing.sm,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: spacing.xs,
    },
    required: {
      color: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: spacing.xs,
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
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    tipsContainer: {
      marginTop: spacing.xl,
      padding: spacing.md,
      backgroundColor: `${colors.info}10`,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.info}30`,
    },
    tipsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.info,
      marginBottom: spacing.sm,
    },
    tipRow: {
      flexDirection: "row",
      marginBottom: spacing.xs,
    },
    tipBullet: {
      color: colors.info,
      marginRight: spacing.xs,
    },
    tipText: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
  });

export default RemarksStep;
