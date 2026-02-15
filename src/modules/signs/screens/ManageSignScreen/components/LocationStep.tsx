import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Control, Controller } from "react-hook-form";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { scale, spacing } from "@/src/styles/theme/spacing";
import { SignFormData } from "../../../types";
import { useAppSelector } from "@/src/store/hooks";
import MapLocationPicker from "@/src/components/ui/MapLocationPicker";
import { colors } from "@/src/styles/theme/colors";
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
	const { t } = useTranslation();

	// Get setup options from Redux store
	const locationTypes = useAppSelector((state) => state.signs.locationTypes);
	const supports = useAppSelector((state) => state.supports.supports);
	const user = useAppSelector((state) => state.auth.user);

	// Transform to select options
	const locationTypeOptions = locationTypes.map((type) => ({
		label: type.name,
		value: type.id,
	}));

	// Get supports without the current sign (for assigning sign to support)
	const supportOptions = supports.map((support) => ({
		label: `${support.supportId} - ${support.supportCodeId}`,
		value: support.id,
	}));

	const handleLocationSelect = (
		latitude: number,
		longitude: number,
		address?: string
	) => {
		// Update form values with selected coordinates
		control._formValues.latitude = latitude;
		control._formValues.longitude = longitude;

		if (address) {
			control._formValues.address = address;
		}

		trigger(["latitude", "longitude"]);
	};

	const currentLatitude = getValues().latitude;
	const currentLongitude = getValues().longitude;

	return (
		<ScrollView
			style={styles.container}
			showsVerticalScrollIndicator={false}
			contentContainerStyle={styles.contentContainer}
		>
			<View style={styles.section}>
				<FormSelectBox
					id="supportId"
					label={`${t("signs.assignToSupport")} :`}
					control={control}
					name="supportId"
					options={supportOptions}
					placeholder={t("signs.noSupport")}
					title={t("signs.assignToSupport")}
					searchable={true}
				/>

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
					<MapLocationPicker
						initialLatitude={currentLatitude}
						initialLongitude={currentLongitude}
						onLocationSelect={handleLocationSelect}
						height={300}
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
				<Controller
					control={control}
					name="latitude"
					render={() => null}
				/>

				<Controller
					control={control}
					name="longitude"
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
