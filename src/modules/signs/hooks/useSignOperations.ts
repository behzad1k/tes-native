import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	addSign,
	updateSign,
	addImageToSign,
	removeImage,
	markSignForDeletion,
} from "@/src/store/slices/signSlice";
import { Sign, SignImage } from "@/src/types/models";
import { useCallback } from "react";
import { ImageStorage } from "@/src/store/persistence";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { SYNC_STATUS } from "@/src/constants/global";

export function useSignOperations() {
	const dispatch = useAppDispatch();
	const signs = useAppSelector((state) => state.signs.signs);
	const isLoading = useAppSelector((state) => state.signs.isLoading);

	const createSign = useCallback(
		async (signData: Omit<Sign, "id" | "status" | "isNew">) => {
			try {
				// Create sign with NOT_SYNCED status
				dispatch(
					addSign({
						...signData,
						// Images should already have isNew: true from form
					}),
				);
				return { success: true };
			} catch (error) {
				console.error("Error creating sign:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const editSign = useCallback(
		async (
			signId: string,
			updates: Partial<Sign>,
			locationChanged: boolean,
		) => {
			try {
				// Update sign - status will change to NOT_SYNCED automatically
				dispatch(
					updateSign({
						id: signId,
						updates,
					}),
				);
				return { success: true };
			} catch (error) {
				console.error("Error updating sign:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const deleteSign = useCallback(
		async (signId: string) => {
			try {
				const sign = signs.find((s) => s.id === signId);

				if (!sign) {
					return { success: false, error: "Sign not found" };
				}

				// If sign is synced, we need to mark it for deletion
				// If sign is not synced (local only), we can remove it immediately
				if (sign.status === SYNC_STATUS.SYNCED) {
					Alert.alert(
						"Cannot Delete",
						"This sign is synced with the server. Please sync deletions are not yet implemented.",
						[{ text: "OK" }],
					);
					return {
						success: false,
						error: "Synced items cannot be deleted yet",
					};
				}

				// Delete local images
				await ImageStorage.deleteSignImages(signId);

				// Remove from store
				dispatch(markSignForDeletion(signId));

				return { success: true };
			} catch (error) {
				console.error("Error deleting sign:", error);
				return { success: false, error };
			}
		},
		[dispatch, signs],
	);

	const getSignById = useCallback(
		(signId: string): Sign | undefined => {
			return signs.find((sign) => sign.id === signId);
		},
		[signs],
	);

	const getAllSigns = useCallback((): Sign[] => {
		return signs;
	}, [signs]);

	const getPendingSigns = useCallback((): Sign[] => {
		return signs.filter((sign) => sign.status === SYNC_STATUS.NOT_SYNCED);
	}, [signs]);

	return {
		createSign,
		editSign,
		deleteSign,
		getSignById,
		getAllSigns,
		getPendingSigns,
		isLoading,
	};
}

export function useSignImages() {
	const dispatch = useAppDispatch();

	const addImageFromCamera = useCallback(
		async (signId: string) => {
			try {
				const permission = await ImagePicker.requestCameraPermissionsAsync();
				if (!permission.granted) {
					Alert.alert(
						"Permission Required",
						"Camera permission is required to take photos",
					);
					return { success: false, error: "Permission denied" };
				}

				const result = await ImagePicker.launchCameraAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					quality: 0.8,
				});

				if (!result.canceled && result.assets[0]) {
					const imageUri = result.assets[0].uri;

					dispatch(
						addImageToSign({
							signId,
							imageUri,
							isNew: true, // Mark as new for syncing
						}),
					);

					return { success: true, imageUri };
				}

				return { success: false, error: "Cancelled" };
			} catch (error) {
				console.error("Error adding image from camera:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const addImageFromGallery = useCallback(
		async (signId: string) => {
			try {
				const permission =
					await ImagePicker.requestMediaLibraryPermissionsAsync();
				if (!permission.granted) {
					Alert.alert(
						"Permission Required",
						"Gallery permission is required to select photos",
					);
					return { success: false, error: "Permission denied" };
				}

				const result = await ImagePicker.launchImageLibraryAsync({
					mediaTypes: ImagePicker.MediaTypeOptions.Images,
					allowsEditing: true,
					quality: 0.8,
				});

				if (!result.canceled && result.assets[0]) {
					const imageUri = result.assets[0].uri;

					dispatch(
						addImageToSign({
							signId,
							imageUri,
							isNew: true, // Mark as new for syncing
						}),
					);

					return { success: true, imageUri };
				}

				return { success: false, error: "Cancelled" };
			} catch (error) {
				console.error("Error adding image from gallery:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const deleteImage = useCallback(
		async (signId: string, imageId: string) => {
			try {
				dispatch(
					removeImage({
						signId,
						imageId,
					}),
				);

				return { success: true };
			} catch (error) {
				console.error("Error removing image:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	return {
		addImageFromCamera,
		addImageFromGallery,
		deleteImage,
	};
}

export function useSignForm(signId?: string) {
	const { getSignById } = useSignOperations();
	const sign = signId ? getSignById(signId) : undefined;

	const getInitialValues = useCallback((): Partial<Sign> => {
		if (sign) {
			return {
				customerId: sign.customerId,
				locationTypeId: sign.locationTypeId,
				signId: sign.signId,
				supportId: sign.supportId,
				codeId: sign.codeId,
				height: sign.height,
				facingDirectionId: sign.facingDirectionId,
				faceMaterialId: sign.faceMaterialId,
				reflectiveCoatingId: sign.reflectiveCoatingId,
				reflectiveRatingId: sign.reflectiveRatingId,
				dimensionId: sign.dimensionId,
				dateInstalled: sign.dateInstalled,
				conditionId: sign.conditionId,
				note: sign.note,
			};
		}

		return {
			dateInstalled: new Date().toISOString(),
		};
	}, [sign]);

	return {
		sign,
		initialValues: getInitialValues(),
		isEditMode: !!signId,
	};
}
