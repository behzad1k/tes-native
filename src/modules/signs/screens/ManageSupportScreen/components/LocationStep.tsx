import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Control, Controller } from "react-hook-form";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useAppSelector } from "@/src/store/hooks";
import MapLocationPicker from "@/src/components/ui/MapLocationPicker";
import { colors } from "@/src/styles/theme/colors";
import { MapPin, MapTrifold } from "phosphor-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";
import { SupportFormData } from "../../../types";
import SelectBoxView from "@/src/components/ui/SelectBoxView";

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
  const { theme } = useTheme();
  const [showMap, setShowMap] = useState(false);

  // Get dropdown data from Redux
  const customers = useAppSelector((state) => state.appData.customers);
  const supportLocationTypes = useAppSelector(
    (state) => state.appData.locationTypes,
  );

  // Convert to select options
  const customerOptions = customers.map((customer) => ({
    label: customer.name,
    value: customer.id,
  }));

  const locationTypeOptions = supportLocationTypes.map((type) => ({
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

    // Store latitude and longitude in the form
    control._formValues.latitude = latitude;
    control._formValues.longitude = longitude;

    if (address) {
      control._formValues.address = address;
    }

    setShowMap(false);
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
        <TextView style={styles.sectionTitle}>
          Customer & Location Type
        </TextView>

        <Controller
          control={control}
          name="customerId"
          rules={{ required: "Customer is required" }}
          render={({ field: { onChange, value } }) => (
            <SelectBoxView
              label="Customer *"
              placeholder="Select customer"
              value={value}
              onChange={onChange}
              options={customerOptions}
              error={errors.customerId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="supportLocationTypeId"
          rules={{ required: "Support location type is required" }}
          render={({ field: { onChange, value } }) => (
            <SelectBoxView
              label="Support Location Type *"
              placeholder="Select support location type"
              value={value}
              onChange={onChange}
              options={locationTypeOptions}
              error={errors.supportLocationTypeId?.message}
            />
          )}
        />
      </View>

      <View style={styles.section}>
        <TextView style={styles.sectionTitle}>Geographic Location</TextView>

        {/* Map Toggle Button */}
        <TouchableOpacity
          style={styles.mapToggleButton}
          onPress={() => setShowMap(!showMap)}
        >
          <MapTrifold size={24} color={theme.secondary} weight="duotone" />
          <TextView style={styles.mapToggleText}>
            {showMap ? "Hide Map" : "Pick Location on Map"}
          </TextView>
        </TouchableOpacity>

        {/* Selected Location Display */}
        {currentLatitude && currentLongitude && !showMap && (
          <View style={styles.selectedLocationCard}>
            <View style={styles.selectedLocationHeader}>
              <MapPin size={20} color={colors.success} weight="fill" />
              <TextView style={styles.selectedLocationTitle}>
                Selected Location
              </TextView>
            </View>

            {currentAddress && (
              <TextView style={styles.addressText}>{currentAddress}</TextView>
            )}

            <View style={styles.coordsRow}>
              <TextView style={styles.coordsLabel}>Latitude:</TextView>
              <TextView style={styles.coordsValue}>
                {currentLatitude.toFixed(6)}
              </TextView>
            </View>

            <View style={styles.coordsRow}>
              <TextView style={styles.coordsLabel}>Longitude:</TextView>
              <TextView style={styles.coordsValue}>
                {currentLongitude.toFixed(6)}
              </TextView>
            </View>

            <TouchableOpacity
              style={styles.changeLocationButton}
              onPress={() => setShowMap(true)}
            >
              <TextView style={styles.changeLocationText}>
                Change Location
              </TextView>
            </TouchableOpacity>
          </View>
        )}

        {/* Map View */}
        {showMap && (
          <View style={styles.mapContainer}>
            <MapLocationPicker
              initialLatitude={currentLatitude}
              initialLongitude={currentLongitude}
              onLocationSelect={handleLocationSelect}
              onCancel={() => setShowMap(false)}
              height={500}
            />
          </View>
        )}

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
      paddingBottom: 100,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.md,
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
      overflow: "hidden",
      borderWidth: 1,
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
