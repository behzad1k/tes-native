import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Control, Controller } from "react-hook-form";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { useAppSelector } from "@/src/store/hooks";
import CustomMapView from "@/src/components/layouts/MapView";
import { colors } from "@/src/styles/theme/colors";
import { SupportFormData } from "../../../types";
import { useTranslation } from "react-i18next";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { LatLng } from "react-native-maps";

interface LocationStepProps {
  control: Control<SupportFormData>;
  errors: any;
  trigger: any;
  getValues: () => SupportFormData;
}

export default function LocationStep({
  control,
  errors,
  trigger,
  getValues,
}: LocationStepProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  // Get setup options from Redux store
  const locationTypes = useAppSelector((state) => state.supports.locationTypes);

  // Transform to select options
  const locationTypeOptions = locationTypes.map((type) => ({
    label: type.name,
    value: type.id,
  }));

  const handleLocationSelect = (coordinate: LatLng) => {
    // Update form values with selected coordinates
    control._formValues.latitude = coordinate.latitude;
    control._formValues.longitude = coordinate.longitude;

    trigger(["latitude", "longitude"]);
  };

  const currentLatitude = getValues().latitude;
  const currentLongitude = getValues().longitude;

  // Build selected location if coordinates exist
  const selectedLocation: LatLng | undefined =
    currentLatitude && currentLongitude
      ? { latitude: currentLatitude, longitude: currentLongitude }
      : undefined;

  // Build initial region based on current coordinates or default
  const initialRegion = {
    latitude: currentLatitude || 37.78825,
    longitude: currentLongitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <FormSelectBox
          id="location-type"
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
          <CustomMapView
            mode="picker"
            initialRegion={initialRegion}
            selectedLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            showUserLocation={true}
            centerOnUserLocation={!selectedLocation}
            controls={{
              showSearch: false,
              showZoomControls: true,
              showCompass: true,
              showStyleToggle: false,
              showMyLocation: true,
              showLegend: false,
            }}
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

        {/* Hidden Controllers for latitude/longitude */}
        <Controller control={control} name="latitude" render={() => null} />

        <Controller control={control} name="longitude" render={() => null} />
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
      paddingBottom: 100,
    },
    section: {
      gap: spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginTop: spacing.sm,
    },
    mapContainer: {
      marginBottom: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      height: scale(300),
      borderColor: theme.border,
      overflow: "hidden",
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
