import React, { useMemo, useCallback, useRef, useState } from "react";
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Modal,
	Image,
	Dimensions,
} from "react-native";
import MapView, { Marker, Region, PROVIDER_GOOGLE } from "react-native-maps";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing, scale } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { Sign, Support, MapMarkerData, MapRegion } from "@/src/types/models";
import { useAppSelector } from "@/src/store/hooks";
import { colors } from "@/src/styles/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SignsStackParamList } from "@/src/navigation/types";

interface SignSupportMapViewProps {
	initialRegion?: MapRegion;
	showSigns?: boolean;
	showSupports?: boolean;
	onMarkerPress?: (marker: MapMarkerData) => void;
	selectedMarkerId?: string;
}

const DEFAULT_REGION: MapRegion = {
	latitude: 37.7749,
	longitude: -122.4194,
	latitudeDelta: 0.1,
	longitudeDelta: 0.1,
};

export default function SignSupportMapView({
	initialRegion,
	showSigns = true,
	showSupports = true,
	onMarkerPress,
	selectedMarkerId,
}: SignSupportMapViewProps) {
	const styles = useThemedStyles(createStyles);
	const { t } = useTranslation();
	const navigation =
		useNavigation<NativeStackNavigationProp<SignsStackParamList>>();
	const mapRef = useRef<MapView>(null);

	const [selectedMarker, setSelectedMarker] = useState<MapMarkerData | null>(
		null
	);
	const [showDetailModal, setShowDetailModal] = useState(false);

	// Get data from Redux store
	const signs = useAppSelector((state) => state.signs.signs);
	const supports = useAppSelector((state) => state.supports.supports);
	const signCodes = useAppSelector((state) => state.signs.codes);
	const supportCodes = useAppSelector((state) => state.supports.codes);
	const signBackendImages = useAppSelector((state) => state.signs.backendImages);
	const supportBackendImages = useAppSelector(
		(state) => state.supports.backendImages
	);

	// Filter and transform signs to markers
	const signMarkers: MapMarkerData[] = useMemo(() => {
		if (!showSigns) return [];

		return signs
			.filter(
				(sign) =>
					sign.latitude &&
					sign.longitude &&
					sign.latitude !== 0 &&
					sign.longitude !== 0 &&
					sign.status !== "DELETED"
			)
			.map((sign) => {
				const signCode = signCodes.find((c) => c.id === sign.signCodeId);
				const imageSource =
					sign.images?.[0]?.localPath || signBackendImages[sign.id];

				return {
					id: sign.id,
					type: "sign" as const,
					latitude: sign.latitude!,
					longitude: sign.longitude!,
					title: sign.signId || t("signs.newSign"),
					subtitle: signCode?.name || "",
					imageUrl: imageSource,
					isSynced: sign.isSynced,
					data: sign,
				};
			});
	}, [signs, showSigns, signCodes, signBackendImages, t]);

	// Filter and transform supports to markers
	const supportMarkers: MapMarkerData[] = useMemo(() => {
		if (!showSupports) return [];

		return supports
			.filter(
				(support) =>
					support.latitude &&
					support.longitude &&
					support.latitude !== 0 &&
					support.longitude !== 0 &&
					support.status !== "DELETED"
			)
			.map((support) => {
				const supportCode = supportCodes.find(
					(c) => c.id === support.supportCodeId
				);
				const imageSource =
					support.images?.[0]?.localPath || supportBackendImages[support.id];

				return {
					id: support.id,
					type: "support" as const,
					latitude: support.latitude!,
					longitude: support.longitude!,
					title: support.supportId || t("supports.newSupport"),
					subtitle: supportCode?.name || "",
					imageUrl: imageSource,
					isSynced: support.isSynced,
					data: support,
				};
			});
	}, [supports, showSupports, supportCodes, supportBackendImages, t]);

	// Combine all markers
	const allMarkers = useMemo(
		() => [...signMarkers, ...supportMarkers],
		[signMarkers, supportMarkers]
	);

	// Calculate initial region based on markers
	const calculatedRegion: MapRegion = useMemo(() => {
		if (initialRegion) return initialRegion;

		if (allMarkers.length === 0) return DEFAULT_REGION;

		const lats = allMarkers.map((m) => m.latitude);
		const lngs = allMarkers.map((m) => m.longitude);

		const minLat = Math.min(...lats);
		const maxLat = Math.max(...lats);
		const minLng = Math.min(...lngs);
		const maxLng = Math.max(...lngs);

		const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
		const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.01);

		return {
			latitude: (minLat + maxLat) / 2,
			longitude: (minLng + maxLng) / 2,
			latitudeDelta: latDelta,
			longitudeDelta: lngDelta,
		};
	}, [initialRegion, allMarkers]);

	const handleMarkerPress = useCallback(
		(marker: MapMarkerData) => {
			setSelectedMarker(marker);
			setShowDetailModal(true);

			if (onMarkerPress) {
				onMarkerPress(marker);
			}
		},
		[onMarkerPress]
	);

	const handleViewDetails = useCallback(() => {
		setShowDetailModal(false);

		if (!selectedMarker) return;

		if (selectedMarker.type === "sign") {
			navigation.navigate("ManageSign", {
				mode: "edit",
				signId: selectedMarker.id,
			});
		} else {
			navigation.navigate("ManageSupport", {
				mode: "edit",
				supportId: selectedMarker.id,
			});
		}
	}, [selectedMarker, navigation]);

	const handleCenterOnMarkers = useCallback(() => {
		if (mapRef.current && allMarkers.length > 0) {
			mapRef.current.animateToRegion(calculatedRegion, 500);
		}
	}, [calculatedRegion, allMarkers]);

	const getMarkerColor = useCallback((marker: MapMarkerData) => {
		if (!marker.isSynced) {
			return colors.warning;
		}
		return marker.type === "sign" ? colors.primary : colors.success;
	}, []);

	const renderMarker = useCallback(
		(marker: MapMarkerData) => {
			const isSelected = selectedMarkerId === marker.id;
			const markerColor = getMarkerColor(marker);

			return (
				<Marker
					key={marker.id}
					coordinate={{
						latitude: marker.latitude,
						longitude: marker.longitude,
					}}
					onPress={() => handleMarkerPress(marker)}
					anchor={{ x: 0.5, y: 1 }}
				>
					<View style={[styles.markerContainer, isSelected && styles.markerSelected]}>
						<View
							style={[
								styles.markerPin,
								{ backgroundColor: markerColor },
								isSelected && styles.markerPinSelected,
							]}
						>
							<Ionicons
								name={marker.type === "sign" ? "warning" : "construct"}
								size={16}
								color={colors.white}
							/>
						</View>
						<View
							style={[styles.markerPointer, { borderTopColor: markerColor }]}
						/>
					</View>
				</Marker>
			);
		},
		[styles, selectedMarkerId, getMarkerColor, handleMarkerPress]
	);

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				provider={PROVIDER_GOOGLE}
				initialRegion={calculatedRegion}
				showsUserLocation
				showsMyLocationButton={false}
				showsCompass
				mapType="standard"
			>
				{allMarkers.map(renderMarker)}
			</MapView>

			{/* Map Controls */}
			<View style={styles.controlsContainer}>
				<TouchableOpacity
					style={styles.controlButton}
					onPress={handleCenterOnMarkers}
				>
					<Ionicons name="locate" size={24} color={theme => theme.text} />
				</TouchableOpacity>
			</View>

			{/* Legend */}
			<View style={styles.legendContainer}>
				{showSigns && (
					<View style={styles.legendItem}>
						<View
							style={[styles.legendDot, { backgroundColor: colors.primary }]}
						/>
						<TextView style={styles.legendText}>{t("signs.signs")}</TextView>
					</View>
				)}
				{showSupports && (
					<View style={styles.legendItem}>
						<View
							style={[styles.legendDot, { backgroundColor: colors.success }]}
						/>
						<TextView style={styles.legendText}>
							{t("supports.supports")}
						</TextView>
					</View>
				)}
				<View style={styles.legendItem}>
					<View
						style={[styles.legendDot, { backgroundColor: colors.warning }]}
					/>
					<TextView style={styles.legendText}>{t("common.unsynced")}</TextView>
				</View>
			</View>

			{/* Marker Count Badge */}
			<View style={styles.countBadge}>
				<TextView style={styles.countText}>
					{allMarkers.length} {t("common.items")}
				</TextView>
			</View>

			{/* Detail Modal */}
			<Modal
				visible={showDetailModal}
				transparent
				animationType="slide"
				onRequestClose={() => setShowDetailModal(false)}
			>
				<TouchableOpacity
					style={styles.modalOverlay}
					activeOpacity={1}
					onPress={() => setShowDetailModal(false)}
				>
					<View style={styles.modalContent}>
						{selectedMarker && (
							<>
								{/* Header */}
								<View style={styles.modalHeader}>
									<View
										style={[
											styles.modalTypeIndicator,
											{
												backgroundColor: getMarkerColor(selectedMarker),
											},
										]}
									/>
									<View style={styles.modalTitleContainer}>
										<TextView style={styles.modalTitle}>
											{selectedMarker.title}
										</TextView>
										<TextView style={styles.modalSubtitle}>
											{selectedMarker.subtitle}
										</TextView>
									</View>
									<TouchableOpacity
										onPress={() => setShowDetailModal(false)}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Ionicons
											name="close"
											size={24}
											color={colors.gray500}
										/>
									</TouchableOpacity>
								</View>

								{/* Image */}
								{selectedMarker.imageUrl && (
									<View style={styles.modalImageContainer}>
										<Image
											source={{ uri: selectedMarker.imageUrl }}
											style={styles.modalImage}
										/>
									</View>
								)}

								{/* Info */}
								<View style={styles.modalInfo}>
									<View style={styles.modalInfoRow}>
										<TextView style={styles.modalInfoLabel}>
											{t("common.type")}:
										</TextView>
										<TextView style={styles.modalInfoValue}>
											{selectedMarker.type === "sign"
												? t("signs.sign")
												: t("supports.support")}
										</TextView>
									</View>
									<View style={styles.modalInfoRow}>
										<TextView style={styles.modalInfoLabel}>
											{t("common.status")}:
										</TextView>
										<TextView
											style={[
												styles.modalInfoValue,
												{
													color: selectedMarker.isSynced
														? colors.success
														: colors.warning,
												},
											]}
										>
											{selectedMarker.isSynced
												? t("common.synced")
												: t("common.notSynced")}
										</TextView>
									</View>
									<View style={styles.modalInfoRow}>
										<TextView style={styles.modalInfoLabel}>
											{t("common.coordinates")}:
										</TextView>
										<TextView style={styles.modalInfoValue}>
											{selectedMarker.latitude.toFixed(6)},{" "}
											{selectedMarker.longitude.toFixed(6)}
										</TextView>
									</View>
								</View>

								{/* Actions */}
								<ButtonView
									title={t("common.viewDetails")}
									onPress={handleViewDetails}
									style={styles.modalButton}
								/>
							</>
						)}
					</View>
				</TouchableOpacity>
			</Modal>
		</View>
	);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
		},
		map: {
			flex: 1,
		},
		markerContainer: {
			alignItems: "center",
		},
		markerSelected: {
			transform: [{ scale: 1.2 }],
		},
		markerPin: {
			width: scale(32),
			height: scale(32),
			borderRadius: scale(16),
			justifyContent: "center",
			alignItems: "center",
			borderWidth: 2,
			borderColor: colors.white,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.25,
			shadowRadius: 4,
			elevation: 5,
		},
		markerPinSelected: {
			borderWidth: 3,
		},
		markerPointer: {
			width: 0,
			height: 0,
			borderLeftWidth: 8,
			borderRightWidth: 8,
			borderTopWidth: 10,
			borderLeftColor: "transparent",
			borderRightColor: "transparent",
			marginTop: -2,
		},
		controlsContainer: {
			position: "absolute",
			right: spacing.md,
			top: spacing.md,
			gap: spacing.sm,
		},
		controlButton: {
			width: scale(44),
			height: scale(44),
			borderRadius: scale(22),
			backgroundColor: theme.surface,
			justifyContent: "center",
			alignItems: "center",
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 4,
			elevation: 3,
		},
		legendContainer: {
			position: "absolute",
			left: spacing.md,
			bottom: spacing.md,
			backgroundColor: theme.surface,
			borderRadius: 12,
			padding: spacing.sm,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 4,
			elevation: 3,
		},
		legendItem: {
			flexDirection: "row",
			alignItems: "center",
			paddingVertical: 4,
		},
		legendDot: {
			width: 12,
			height: 12,
			borderRadius: 6,
			marginRight: spacing.xs,
		},
		legendText: {
			fontSize: 12,
			color: theme.textSecondary,
		},
		countBadge: {
			position: "absolute",
			right: spacing.md,
			bottom: spacing.md,
			backgroundColor: theme.surface,
			borderRadius: 20,
			paddingHorizontal: spacing.md,
			paddingVertical: spacing.xs,
			shadowColor: "#000",
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.15,
			shadowRadius: 4,
			elevation: 3,
		},
		countText: {
			fontSize: 12,
			fontWeight: "600",
			color: theme.text,
		},
		modalOverlay: {
			flex: 1,
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			justifyContent: "flex-end",
		},
		modalContent: {
			backgroundColor: theme.surface,
			borderTopLeftRadius: 20,
			borderTopRightRadius: 20,
			padding: spacing.lg,
			maxHeight: "70%",
		},
		modalHeader: {
			flexDirection: "row",
			alignItems: "center",
			marginBottom: spacing.md,
		},
		modalTypeIndicator: {
			width: 4,
			height: 40,
			borderRadius: 2,
			marginRight: spacing.sm,
		},
		modalTitleContainer: {
			flex: 1,
		},
		modalTitle: {
			fontSize: 18,
			fontWeight: "600",
			color: theme.text,
		},
		modalSubtitle: {
			fontSize: 14,
			color: theme.textSecondary,
			marginTop: 2,
		},
		modalImageContainer: {
			height: scale(150),
			borderRadius: 12,
			overflow: "hidden",
			marginBottom: spacing.md,
		},
		modalImage: {
			width: "100%",
			height: "100%",
			resizeMode: "cover",
		},
		modalInfo: {
			backgroundColor: theme.background,
			borderRadius: 12,
			padding: spacing.md,
			marginBottom: spacing.md,
		},
		modalInfoRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			paddingVertical: 6,
		},
		modalInfoLabel: {
			fontSize: 14,
			color: theme.textSecondary,
		},
		modalInfoValue: {
			fontSize: 14,
			fontWeight: "500",
			color: theme.text,
		},
		modalButton: {
			marginTop: spacing.sm,
		},
	});
