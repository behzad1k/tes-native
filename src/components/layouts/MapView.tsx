import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import MapView, {
  Marker,
  PROVIDER_DEFAULT,
  Region,
  LatLng,
} from "react-native-maps";
import * as Location from "expo-location";
import { Toast } from "toastify-react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import { colors } from "@/src/styles/theme/colors";
import { spacing } from "@/src/styles/theme/spacing";
import {
  MagnifyingGlass,
  Plus,
  Minus,
  NavigationArrow,
  Moon,
  Sun,
  MapPin,
  X,
} from "phosphor-react-native";

export interface MapPinData {
  id: string;
  coordinate: LatLng;
  title?: string;
  description?: string;
  color?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
}

export interface MapLegendItem {
  label: string;
  color: string;
  icon?: React.ReactNode;
}

export interface MapControlsConfig {
  showSearch?: boolean;
  showZoomControls?: boolean;
  showCompass?: boolean;
  showStyleToggle?: boolean;
  showMyLocation?: boolean;
  showLegend?: boolean;
}

export type MapMode = "view" | "picker";

interface CustomMapViewProps {
  pins?: MapPinData[];

  legend?: MapLegendItem[];

  initialRegion?: Region;

  controls?: MapControlsConfig;

  mode?: MapMode;

  onLocationSelect?: (coordinate: LatLng) => void;
  selectedLocation?: LatLng;

  onSearch?: (query: string) => void;

  mapStyle?: "standard" | "satellite" | "hybrid";

  showUserLocation?: boolean;
  followUserLocation?: boolean;
  centerOnUserLocation?: boolean;
  onRegionChange?: (region: Region) => void;
}

const CustomMapView: React.FC<CustomMapViewProps> = ({
  pins = [],
  legend = [],
  initialRegion,
  controls = {
    showSearch: true,
    showZoomControls: true,
    showCompass: true,
    showStyleToggle: true,
    showMyLocation: true,
    showLegend: true,
  },
  mode = "view",
  onLocationSelect,
  selectedLocation,
  onSearch,
  mapStyle = "standard",
  showUserLocation = true,
  followUserLocation = false,
  centerOnUserLocation = false,
  onRegionChange,
}) => {
  const styles = useThemedStyles(createStyles);
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState(mapStyle);
  const [pickerCoordinate, setPickerCoordinate] = useState<LatLng | undefined>(
    selectedLocation,
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (pins.length > 0 && mapRef.current && mode === "view") {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          pins.map((p) => p.coordinate),
          {
            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
            animated: true,
          },
        );
      }, 500);
    }
  }, [pins.length]);

  useEffect(() => {
    if (centerOnUserLocation) {
      handleMyLocation();
    }
  }, [centerOnUserLocation]);

  useEffect(() => {
    if (selectedLocation) {
      setPickerCoordinate(selectedLocation);
    }
  }, [selectedLocation]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      setRegion(newRegion);
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  const handleMyLocation = async () => {
    if (isLoadingLocation) return;
    try {
      setIsLoadingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Toast.error("Location permission denied");
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(userRegion, 500);
      }

      setRegion(userRegion);
      setIsLoadingLocation(false);
    } catch (error) {
      console.error("Error getting location:", error);
      Toast.error("Failed to get current location");
      setIsLoadingLocation(false);
    }
  };

  const handleStyleToggle = () => {
    setIsDarkMode(!isDarkMode);
    setCurrentMapStyle(isDarkMode ? "standard" : "satellite");
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleMapPress = (event: any) => {
    if (mode === "picker") {
      const coordinate = event.nativeEvent.coordinate;
      setPickerCoordinate(coordinate);
      if (onLocationSelect) {
        onLocationSelect(coordinate);
      }
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  };

  const getMapType = () => {
    switch (currentMapStyle) {
      case "satellite":
        return "satellite";
      case "hybrid":
        return "hybrid";
      default:
        return "standard";
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={showUserLocation}
        followsUserLocation={followUserLocation}
        mapType={getMapType()}
        onPress={handleMapPress}
      >
        {mode === "view" &&
          pins.map((pin) => (
            <Marker
              key={pin.id}
              coordinate={pin.coordinate}
              title={pin.title}
              description={pin.description}
              onPress={pin.onPress}
            >
              {pin.icon ? (
                <View
                  style={[
                    styles.customMarker,
                    { backgroundColor: pin.color || colors.lightGreen },
                  ]}
                >
                  {pin.icon}
                </View>
              ) : (
                <View
                  style={[
                    styles.customMarker,
                    { backgroundColor: pin.color || colors.lightGreen },
                  ]}
                >
                  <MapPin size={20} color={colors.white} weight="fill" />
                </View>
              )}
            </Marker>
          ))}

        {mode === "picker" && pickerCoordinate && (
          <Marker coordinate={pickerCoordinate} draggable>
            <View style={[styles.pickerMarker]}>
              <MapPin size={30} color={colors.error} weight="fill" />
            </View>
          </Marker>
        )}
      </MapView>

      {controls.showSearch && (
        <View style={styles.searchContainer}>
          {showSearchBar ? (
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowSearchBar(false)}>
                <X size={24} color={colors.lightGreen} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowSearchBar(true)}
            >
              <MagnifyingGlass size={24} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {controls.showZoomControls && (
        <View style={styles.zoomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleZoomIn}>
            <Plus size={24} color={colors.white} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.controlButtonSpaced]}
            onPress={handleZoomOut}
          >
            <Minus size={24} color={colors.white} weight="bold" />
          </TouchableOpacity>
        </View>
      )}

      {controls.showMyLocation && (
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.myLocationButton,
            isLoadingLocation && styles.controlButtonLoading,
          ]}
          onPress={handleMyLocation}
          disabled={isLoadingLocation}
        >
          <NavigationArrow
            size={24}
            color={colors.white}
            weight={isLoadingLocation ? "regular" : "fill"}
          />
        </TouchableOpacity>
      )}

      {controls.showStyleToggle && (
        <TouchableOpacity
          style={[styles.controlButton, styles.styleToggleButton]}
          onPress={handleStyleToggle}
        >
          {isDarkMode ? (
            <Sun size={24} color={colors.white} weight="fill" />
          ) : (
            <Moon size={24} color={colors.white} weight="fill" />
          )}
        </TouchableOpacity>
      )}

      {controls.showLegend && legend.length > 0 && (
        <View style={styles.legend}>
          <TextView variant="caption" style={styles.legendTitle}>
            Legend
          </TextView>
          {legend.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              {item.icon ? (
                <View
                  style={[styles.legendIcon, { backgroundColor: item.color }]}
                >
                  {item.icon}
                </View>
              ) : (
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
              )}
              <TextView variant="caption" style={styles.legendText}>
                {item.label}
              </TextView>
            </View>
          ))}
        </View>
      )}

      {mode === "picker" && (
        <View style={styles.pickerIndicator}>
          <MapPin size={16} color={colors.white} weight="fill" />
          <TextView variant="caption" style={styles.pickerText}>
            Tap map to select location
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
    map: {
      flex: 1,
    },
    customMarker: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.white,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    pickerMarker: {
      width: 50,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    searchContainer: {
      position: "absolute",
      top: spacing.md,
      left: spacing.md,
      right: spacing.md,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.white,
      borderRadius: 25,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingRight: spacing.sm,
    },
    controlButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.lightGreen,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    controlButtonSpaced: {
      marginTop: spacing.sm,
    },
    controlButtonLoading: {
      opacity: 0.6,
    },
    zoomControls: {
      position: "absolute",
      right: spacing.md,
      top: "50%",
      marginTop: -60,
    },
    myLocationButton: {
      position: "absolute",
      right: spacing.md,
      bottom: spacing.xl,
    },
    styleToggleButton: {
      position: "absolute",
      right: spacing.md,
      bottom: 90,
    },
    legend: {
      position: "absolute",
      bottom: 70,
      left: spacing.md,
      backgroundColor: colors.white,
      padding: spacing.sm,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    legendTitle: {
      color: theme.text,
      fontWeight: "600",
      marginBottom: spacing.xs,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: spacing.xs,
    },
    legendIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.xs,
    },
    legendText: {
      color: theme.secondary,
      fontSize: 11,
    },
    pickerIndicator: {
      position: "absolute",
      top: spacing.md,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.error,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    pickerText: {
      color: colors.white,
      fontWeight: "600",
    },
  });

export default CustomMapView;
