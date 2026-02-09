import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import * as Location from "expo-location";
import TextView from "./TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import { MapPin, NavigationArrow, CheckCircle, X } from "phosphor-react-native";
import { useTheme } from "@/src/contexts/ThemeContext";

interface MapLocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  onLocationSelect: (
    latitude: number,
    longitude: number,
    address?: string,
  ) => void;
  onCancel?: () => void;
  height?: number;
}

export default function MapLocationPicker({
  initialLatitude,
  initialLongitude,
  onLocationSelect,
  onCancel,
  height = 400,
}: MapLocationPickerProps) {
  const styles = useThemedStyles(createStyles);
  const { theme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(
    initialLatitude && initialLongitude
      ? { latitude: initialLatitude, longitude: initialLongitude }
      : null,
  );

  const [region, setRegion] = useState<Region>({
    latitude: initialLatitude || 37.78825,
    longitude: initialLongitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>("");

  // Get current location on mount if no initial location
  useEffect(() => {
    if (!initialLatitude && !initialLongitude) {
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (selectedLocation)
      onLocationSelect(
        selectedLocation.latitude,
        selectedLocation.longitude,
        address,
      );
  }, [selectedLocation]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to use this feature",
        );
        setLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Animate to current location
      mapRef.current?.animateToRegion(newRegion, 1000);

      // Get address for current location
      await reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results && results.length > 0) {
        const result = results[0];
        const addressParts = [
          result.street,
          result.city,
          result.region,
          result.postalCode,
          result.country,
        ].filter(Boolean);

        setAddress(addressParts.join(", "));
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({ latitude, longitude });

    // Get address for selected location
    await reverseGeocode(latitude, longitude);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(
        selectedLocation.latitude,
        selectedLocation.longitude,
        address,
      );
    } else {
      Alert.alert(
        "No Location Selected",
        "Please select a location on the map",
      );
    }
  };

  const handleRecenter = () => {
    if (selectedLocation) {
      const newRegion = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <TextView style={styles.loadingText}>
            Getting your location...
          </TextView>
        </View>
      )}

      <MapView
        ref={mapRef}
        // provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            draggable
            onDragEnd={handleMapPress}
          >
            <View style={styles.markerContainer}>
              <MapPin size={40} color={colors.error} weight="fill" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Address Display */}
      {address && selectedLocation && (
        <View style={styles.addressCard}>
          <MapPin size={16} color={theme.secondary} weight="fill" />
          <TextView style={styles.addressText} numberOfLines={2}>
            {address}
          </TextView>
        </View>
      )}

      {/* Coordinates Display */}
      {selectedLocation && (
        <View style={styles.coordsCard}>
          <TextView style={styles.coordsLabel}>Coordinates:</TextView>
          <TextView style={styles.coordsText}>
            {selectedLocation.latitude.toFixed(6)},{" "}
            {selectedLocation.longitude.toFixed(6)}
          </TextView>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <NavigationArrow size={24} color={colors.white} weight="fill" />
        </TouchableOpacity>

        {selectedLocation && (
          <TouchableOpacity
            style={styles.recenterButton}
            onPress={handleRecenter}
          >
            <MapPin size={24} color={colors.white} weight="fill" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      height: "100%",
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.background,
    },
    map: {
      flex: 1,
    },
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    loadingText: {
      marginTop: spacing.sm,
      color: colors.white,
      fontSize: 16,
    },
    markerContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    addressCard: {
      position: "absolute",
      top: spacing.md,
      left: spacing.md,
      right: spacing.md,
      backgroundColor: theme.background,
      padding: spacing.sm,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    addressText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
    },
    coordsCard: {
      position: "absolute",
      bottom: 30,
      left: spacing.md,
      backgroundColor: theme.background,
      padding: spacing.sm,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    coordsLabel: {
      fontSize: 12,
      color: theme.secondary,
      marginBottom: 2,
    },
    coordsText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    actionButtons: {
      position: "absolute",
      right: spacing.md,
      bottom: 30,
      gap: spacing.sm,
    },
    currentLocationButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    recenterButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.info,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    bottomBar: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row",
      padding: spacing.sm,
      backgroundColor: theme.background,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      gap: spacing.xs,
    },
    cancelButton: {
      backgroundColor: theme.primary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    confirmButton: {
      backgroundColor: colors.success,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.white,
    },
  });
