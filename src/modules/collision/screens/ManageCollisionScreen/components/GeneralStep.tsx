import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import MapLocationPicker from "@/src/components/ui/MapLocationPicker";
import TextView from "@/src/components/ui/TextView";
import { CollisionFormData } from "../../../types";
import { useCollisionFields } from "../../../hooks/useCollisionOperations";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import { colors } from "@/src/styles/theme/colors";

interface GeneralStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
  trigger: any;
}

const GeneralStep = ({
  control,
  errors,
  getValues,
  setValue,
  trigger,
}: GeneralStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { divisionOptions, generalFields } = useCollisionFields();

  const handleLocationSelect = (
    latitude: number,
    longitude: number,
    address?: string
  ) => {
    setValue("latitude", latitude);
    setValue("longitude", longitude);
    trigger(["latitude", "longitude"]);
  };

  const currentLatitude = getValues("latitude");
  const currentLongitude = getValues("longitude");

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Division Selection */}
      <View style={styles.section}>
        <FormSelectBox
          control={control}
          name="divisionId"
          label={`${t("division")} :*`}
          options={divisionOptions}
          placeholder={t("pressToSelect")}
          title={t("division")}
          searchable={divisionOptions.length > 5}
          rules={{ required: t("validation.required") }}
        />
      </View>

      {/* Dynamic General Fields */}
      <View style={styles.section}>
        {generalFields.map((field) => (
          <DynamicFieldRenderer
            key={field.name}
            field={field}
            control={control}
            name={`general.${field.name}` as any}
            errors={errors?.general}
          />
        ))}
      </View>

      {/* Map Location */}
      <View style={styles.section}>
        <TextView style={styles.sectionTitle}>{t("location")}</TextView>
        <View style={styles.mapContainer}>
          <MapLocationPicker
            initialLatitude={currentLatitude}
            initialLongitude={currentLongitude}
            onLocationSelect={handleLocationSelect}
            height={250}
          />
        </View>

        {/* Validation Message */}
        {!currentLatitude && !currentLongitude && (
          <View style={styles.validationMessage}>
            <TextView style={styles.validationText}>
              {t("validation.selectLocation")}
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
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.sm,
    },
    mapContainer: {
      borderRadius: 12,
      borderWidth: 1,
      height: scale(250),
      borderColor: theme.border,
      overflow: "hidden",
    },
    validationMessage: {
      backgroundColor: colors.warning + "20",
      padding: spacing.sm,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      marginTop: spacing.sm,
    },
    validationText: {
      fontSize: 14,
      color: colors.warning,
      fontWeight: "500",
    },
  });

export default GeneralStep;
