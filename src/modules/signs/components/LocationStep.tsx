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
import { useTranslation } from "react-i18next";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { LatLng } from "react-native-maps";
import { SignFormData, SupportFormData } from "../types";

// Minimum shape this component requires from any form data
interface LocationFormValues {
  latitude?: number;
  longitude?: number;
  locationTypeId: string;
  supportId?: string;
}

interface BaseLocationStepProps<T extends LocationFormValues> {
  control: Control<T>;
  errors: any;
  trigger: any;
  getValues: () => T;
}

interface SignLocationStepProps extends BaseLocationStepProps<SignFormData> {
  variant: "sign";
}

interface SupportLocationStepProps extends BaseLocationStepProps<SupportFormData> {
  variant: "support";
}

type LocationStepProps = SignLocationStepProps | SupportLocationStepProps;

export default function LocationStep(props: LocationStepProps) {
  const { variant, trigger, getValues } = props;
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const signLocationTypes = useAppSelector((state) =>
    variant === "sign" ? state.signs.locationTypes : [],
  );
  const supportLocationTypes = useAppSelector((state) =>
    variant === "support" ? state.supports.locationTypes : [],
  );
  const locationTypes =
    variant === "sign" ? signLocationTypes : supportLocationTypes;

  const supports = useAppSelector((state) =>
    variant === "sign" ? state.supports.supports : [],
  );

  const locationTypeOptions = locationTypes.map((type) => ({
    label: type.name,
    value: type.id,
  }));

  const supportOptions = supports.map((support) => ({
    label: `${support.supportId} - ${support.supportCodeId}`,
    value: support.id,
  }));

  const handleLocationSelect = (coordinate: LatLng) => {
    if (variant === "sign") {
      (props.control._formValues as SignFormData).latitude =
        coordinate.latitude;
      (props.control._formValues as SignFormData).longitude =
        coordinate.longitude;
    } else {
      (props.control._formValues as SupportFormData).latitude =
        coordinate.latitude;
      (props.control._formValues as SupportFormData).longitude =
        coordinate.longitude;
    }
    trigger(["latitude", "longitude"]);
  };

  const currentLatitude = getValues().latitude;
  const currentLongitude = getValues().longitude;

  const selectedLocation: LatLng | undefined =
    currentLatitude && currentLongitude
      ? { latitude: currentLatitude, longitude: currentLongitude }
      : undefined;

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
        {variant === "sign" && (
          <FormSelectBox
            id="supportId"
            label={`${t("signs.assignToSupport")} :`}
            control={props.control as unknown as Control<SignFormData>}
            name="supportId"
            options={supportOptions}
            placeholder={t("signs.noSupport")}
            title={t("signs.assignToSupport")}
            searchable={true}
          />
        )}

        <FormSelectBox
          id="location-type"
          label={`${t("locationType")} :`}
          control={props.control as unknown as Control<SupportFormData>}
          name="locationTypeId"
          options={locationTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("locationType")}
          searchable={true}
        />

        <TextView style={styles.sectionTitle}>{t("location")}</TextView>

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

        {!currentLatitude && !currentLongitude && (
          <View style={styles.validationMessage}>
            <TextView style={styles.validationText}>
              {t("validation.selectLocation")}
            </TextView>
          </View>
        )}

        <Controller
          control={props.control as unknown as Control<SignFormData>}
          name="latitude"
          render={() => null}
        />
        <Controller
          control={props.control as unknown as Control<SignFormData>}
          name="longitude"
          render={() => null}
        />
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1 },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    section: { gap: spacing.sm },
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
