import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { TrafficCountWorkOrder } from "../types";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { MapPin } from "phosphor-react-native";
import { router } from "expo-router";
import { ROUTES } from "@/src/constants/navigation";
import SiteTypeSelector from "./SiteTypeSelector";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get("window");

interface WorkOrderDetailProps {
  workOrder: TrafficCountWorkOrder;
  onClaim?: (workOrder: TrafficCountWorkOrder) => void;
}

const formatDateTimeDisplay = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${year} - ${hours}:${minutes}`;
};

const WorkOrderDetail = ({ workOrder, onClaim }: WorkOrderDetailProps) => {
  const styles = useThemedStyles(createStyles);
  const { closeDrawer } = useDrawer();
  const [showSiteTypeSelector, setShowSiteTypeSelector] = useState(false);

  const hasValidLocation =
    workOrder.latitude !== 0 &&
    workOrder.longitude !== 0 &&
    workOrder.latitude != null &&
    workOrder.longitude != null;

  const openInMaps = () => {
    if (!hasValidLocation) return;
    const scheme = Platform.select({
      ios: "maps:0,0?q=",
      android: "geo:0,0?q=",
    });
    const latLng = `${workOrder.latitude},${workOrder.longitude}`;
    const label = workOrder.locationName || "Count Location";
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`,
    });
    if (url) Linking.openURL(url);
  };

  const handleClaim = () => {
    // Show site type selector first
    setShowSiteTypeSelector(true);
  };

  const handleSiteTypeSelected = (siteType: number) => {
    setShowSiteTypeSelector(false);
    closeDrawer();

    // Navigate to the counter screen with work order ID and selected site type
    router.push({
      pathname: ROUTES.TRAFFIC_COUNT_COUNTER,
      params: {
        workOrderId: workOrder.id,
        siteType: String(siteType),
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TextView style={styles.title}>Work Order Details</TextView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Work Order NO */}
        <View style={styles.fieldGroup}>
          <TextView style={styles.label}>Work Order NO :</TextView>
          <View style={styles.fieldValue}>
            <TextView style={styles.valueText}>{workOrder.no}</TextView>
          </View>
        </View>

        {/* Site Name */}
        <View style={styles.fieldGroup}>
          <TextView style={styles.label}>Site Name :</TextView>
          <View style={styles.fieldValue}>
            <TextView style={styles.valueText}>
              {workOrder.locationName}
            </TextView>
          </View>
        </View>

        {/* Date Time Row */}
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <TextView style={styles.label}>Start Date Time:</TextView>
            <View style={styles.dateValue}>
              <TextView style={styles.dateText}>
                {formatDateTimeDisplay(workOrder.startDT)}
              </TextView>
            </View>
          </View>
          <View style={styles.dateField}>
            <TextView style={styles.label}>End Date Time :</TextView>
            <View style={styles.dateValue}>
              <TextView style={styles.dateText}>
                {formatDateTimeDisplay(workOrder.endDT)}
              </TextView>
            </View>
          </View>
        </View>

        {/* Note */}
        <View style={styles.fieldGroup}>
          <TextView style={styles.label}>Note :</TextView>
          <View style={styles.noteField}>
            <TextView style={styles.noteText}>
              {workOrder.note || "No notes available"}
            </TextView>
          </View>
        </View>

        {/* Location Map */}
        <View style={styles.fieldGroup}>
          <TextView style={styles.label}>Location :</TextView>
          {hasValidLocation ? (
            <View style={styles.mapContainer}>
              <MapView
                provider={PROVIDER_DEFAULT}
                style={styles.map}
                initialRegion={{
                  latitude: workOrder.latitude,
                  longitude: workOrder.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                onPress={openInMaps}
              >
                <Marker
                  coordinate={{
                    latitude: workOrder.latitude,
                    longitude: workOrder.longitude,
                  }}
                >
                  <View style={styles.markerContainer}>
                    <MapPin size={30} color={colors.error} weight="fill" />
                  </View>
                </Marker>
              </MapView>
            </View>
          ) : (
            <View style={styles.noLocationContainer}>
              <TextView style={styles.noLocationText}>
                No location data available
              </TextView>
            </View>
          )}
        </View>

        {/* Claim Button */}
        <View style={styles.claimButtonContainer}>
          <ButtonView
            variant="primary"
            size="large"
            onPress={handleClaim}
            style={styles.claimButton}
          >
            Claim
          </ButtonView>
        </View>
      </ScrollView>

      {/* Site Type Selector Modal */}
      <SiteTypeSelector
        visible={showSiteTypeSelector}
        currentSiteType={workOrder.siteType || 1}
        onSelect={handleSiteTypeSelected}
        onCancel={() => setShowSiteTypeSelector(false)}
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SCREEN_HEIGHT * 0.85,
      paddingBottom: scale(20),
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: theme.text,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    fieldGroup: {
      marginTop: spacing.sm,
    },
    label: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.bold,
      color: theme.text,
      marginBottom: 6,
    },
    fieldValue: {
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
    },
    valueText: {
      fontSize: FontSizes.sm,
      color: theme.secondary,
    },
    dateRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    dateField: {
      flex: 1,
    },
    dateValue: {
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dateText: {
      fontSize: FontSizes.xxs,
      color: theme.secondary,
    },
    noteField: {
      backgroundColor: theme.primary,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
      minHeight: 80,
    },
    noteText: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
    },
    mapContainer: {
      height: 180,
      borderRadius: 12,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    map: {
      flex: 1,
    },
    markerContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    noLocationContainer: {
      height: 120,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.primary,
    },
    noLocationText: {
      color: theme.secondary,
      fontSize: FontSizes.sm,
    },
    claimButtonContainer: {
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
      alignItems: "center",
    },
    claimButton: {
      width: SCREEN_WIDTH * 0.5,
      borderRadius: 25,
      paddingVertical: spacing.sm,
    },
  });

export default WorkOrderDetail;
