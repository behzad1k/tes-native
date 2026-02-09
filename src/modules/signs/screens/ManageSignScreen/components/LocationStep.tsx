import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Control, Controller } from "react-hook-form";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { SignFormData } from "../../../types";
import SelectBoxView from "@/src/components/ui/SelectBoxView";
import { useAppSelector } from "@/src/store/hooks";
import MapLocationPicker from "@/src/components/ui/MapLocationPicker";
import { colors } from "@/src/styles/theme/colors";
import { MapPin, MapTrifold } from "phosphor-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import FormSelectBox from "@/src/components/ui/FormSelectBox";

interface LocationStepProps {
  control: Control<SignFormData>;
  errors: any;
  trigger: any;
  getValues: () => SignFormData;
}

export default function LocationStep({
  control,
  errors,
  trigger,
  getValues,
}: LocationStepProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const customers = useAppSelector((state) => state.appData.customers);
  const locationTypes = useAppSelector((state) => state.appData.locationTypes);
  const customerOptions = customers.map((customer) => ({
    label: customer.name,
    value: customer.id,
  }));

  const locationTypeOptions = locationTypes.map((type) => ({
    label: type.name,
    value: type.id,
  }));

  const handleLocationSelect = (
    latitude: number,
    longitude: number,
    address?: string,
  ) => {
    // Update form values with selected coordinates
    const currentValues = getValues();
    control._formValues.latitude = latitude;
    control._formValues.longitude = longitude;

    if (address) {
      control._formValues.address = address;
    }

    trigger(["latitude", "longitude"]);
  };

  const currentLatitude = getValues().latitude;
  const currentLongitude = getValues().longitude;
  const currentAddress = getValues().address;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <FormSelectBox
          id={"customer"}
          label={`${t("customer")} :`}
          control={control}
          name="customerId"
          options={customerOptions}
          placeholder={t("pressToSelect")}
          title={t("customer")}
          searchable={true}
        />
        <FormSelectBox
          id={"location-type"}
          label={`${t("locationType")} :`}
          control={control}
          name="locationTypeId"
          options={locationTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("locationType")}
          searchable={true}
        />
        <TextView style={styles.sectionTitle}>{t("location")}</TextView>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapLocationPicker
            initialLatitude={currentLatitude}
            initialLongitude={currentLongitude}
            onLocationSelect={handleLocationSelect}
            height={500}
          />
        </View>

        {/* Validation Message */}
        {!currentLatitude && !currentLongitude && (
          <View style={styles.validationMessage}>
            <TextView style={styles.validationText}>
              Please select a location on the map
            </TextView>
          </View>
        )}

        {/* Hidden Controllers for latitude/longitude */}
        <Controller
          control={control}
          name="latitude"
          rules={{ required: "Location is required" }}
          render={() => null}
        />

        <Controller
          control={control}
          name="longitude"
          rules={{ required: "Location is required" }}
          render={() => null}
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    mapToggleButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: theme.primary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: spacing.md,
    },
    mapToggleText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.secondary,
    },
    mapContainer: {
      marginBottom: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      height: scale(300),
      borderColor: theme.border,
    },
    selectedLocationCard: {
      backgroundColor: theme.primary,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.success + "40",
      marginBottom: spacing.md,
    },
    selectedLocationHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    selectedLocationTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    addressText: {
      fontSize: 14,
      color: theme.secondary,
      marginBottom: spacing.sm,
      lineHeight: 20,
    },
    coordsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    coordsLabel: {
      fontSize: 14,
      color: theme.secondary,
    },
    coordsValue: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    changeLocationButton: {
      marginTop: spacing.sm,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    changeLocationText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.info,
    },
    validationMessage: {
      backgroundColor: colors.warning + "20",
      padding: spacing.sm,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    validationText: {
      fontSize: 14,
      color: colors.warning,
      fontWeight: "500",
    },
  });
