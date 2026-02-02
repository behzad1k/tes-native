import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	addSupport,
	updateSupport,
	addImageToSupport,
	removeImage,
	markSupportForDeletion,
} from "@/src/store/slices/supportSlice";
import { Support, SupportImage } from "@/src/types/models";
import { useCallback } from "react";
import { ImageStorage } from "@/src/store/persistence";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { SYNC_STATUS } from "@/src/constants/global";

export function useSupportOperations() {
	const dispatch = useAppDispatch();
	const supports = useAppSelector((state) => state.supports.supports);
	const isLoading = useAppSelector((state) => state.supports.isLoading);

	const createSupport = useCallback(
		async (supportData: Omit<Support, "id" | "status" | "isNew">) => {
			try {
				dispatch(addSupport(supportData));
				return { success: true };
			} catch (error) {
				console.error("Error creating support:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const editSupport = useCallback(
		async (supportId: string, updates: Partial<Support>) => {
			try {
				dispatch(
					updateSupport({
						id: supportId,
						updates,
					}),
				);
				return { success: true };
			} catch (error) {
				console.error("Error updating support:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const deleteSupport = useCallback(
		async (supportId: string) => {
			try {
				await ImageStorage.deleteSignImages(supportId);

				dispatch(markSupportForDeletion(supportId));

				return { success: true };
			} catch (error) {
				console.error("Error deleting support:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const getSupportById = useCallback(
		(supportId: string): Support | undefined => {
			return supports.find((support) => support.id === supportId);
		},
		[supports],
	);

	const getAllSupports = useCallback((): Support[] => {
		return supports;
	}, [supports]);

	const getPendingSupports = useCallback((): Support[] => {
		return supports.filter(
			(support) => support.status === SYNC_STATUS.NOT_SYNCED,
		);
	}, [supports]);

	return {
		createSupport,
		editSupport,
		deleteSupport,
		getSupportById,
		getAllSupports,
		getPendingSupports,
		isLoading,
	};
}

export function useSupportImages() {
	const dispatch = useAppDispatch();

	const addImageFromCamera = useCallback(
		async (supportId: string) => {
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
						addImageToSupport({
							supportId,
							imageUri,
							isNew: true,
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
		async (supportId: string) => {
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
						addImageToSupport({
							supportId,
							imageUri,
							isNew: true,
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
		async (supportId: string, imageId: string) => {
			try {
				dispatch(
					removeImage({
						supportId,
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

	const getSupportImages = useCallback((supportId: string): SupportImage[] => {
		const supports = useAppSelector((state) => state.supports.supports);
		const support = supports.find((s) => s.id === supportId);
		return support?.images || [];
	}, []);

	return {
		addImageFromCamera,
		addImageFromGallery,
		deleteImage,
		getSupportImages,
	};
}

export function useSupportForm(supportId?: string) {
	const { getSupportById } = useSupportOperations();
	const support = supportId ? getSupportById(supportId) : undefined;

	const getInitialValues = useCallback((): Partial<Support> => {
		if (support) {
			return {
				customerId: support.customerId,
				locationId: support.locationId,
				supportId: support.supportId,
				codeId: support.codeId,
				conditionId: support.conditionId,
				note: support.note,
			};
		}

		return {};
	}, [support]);

	return {
		support,
		initialValues: getInitialValues(),
		isEditMode: !!supportId,
	};
}
