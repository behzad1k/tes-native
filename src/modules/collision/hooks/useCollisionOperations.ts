import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	addCollision,
	updateCollision,
	removeCollision,
	clearCollisionDraft,
	addImageToCollision,
	removeImageFromCollision,
	updateCollisionDraft,
} from "@/src/store/slices/collisionSlice";
import {
	syncCollisionData,
	downloadCollisionAttachments,
} from "@/src/store/thunks";
import { Collision, CollisionImage, CollisionDraft } from "@/src/types/models";
import { formDataToCollision, CollisionFormData } from "../types";
import { SYNC_STATUS } from "@/src/constants/global";

// ─── Collision Operations Hook ─────────────────────────────────────

export const useCollisionOperations = () => {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.auth.user);

	// Create new collision
	const createCollision = useCallback(
		async (
			formData: CollisionFormData,
		): Promise<{ success: boolean; id?: string; error?: string }> => {
			try {
				const collisionData = formDataToCollision(formData);

				dispatch(
					addCollision({
						...collisionData,
						customerId: formData.customerId || user?.defaultCustomerId || "",
						userId: user?.userId || "",
					}),
				);

				return { success: true, id: formData.id };
			} catch (error: any) {
				console.error("Error creating collision:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch, user],
	);

	// Edit existing collision
	const editCollision = useCallback(
		async (
			id: string,
			formData: Partial<CollisionFormData>,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				dispatch(
					updateCollision({
						id,
						updates: formData as Partial<Collision>,
					}),
				);

				return { success: true };
			} catch (error: any) {
				console.error("Error editing collision:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	// Delete collision
	const deleteCollision = useCallback(
		async (id: string): Promise<{ success: boolean; error?: string }> => {
			try {
				dispatch(removeCollision(id));
				return { success: true };
			} catch (error: any) {
				console.error("Error deleting collision:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	// Sync collisions
	const syncCollisions = useCallback(async (): Promise<{
		success: boolean;
		syncedCount?: number;
		error?: string;
	}> => {
		try {
			const result = await dispatch(syncCollisionData()).unwrap();
			return {
				success: true,
				syncedCount:
					result.syncedCollisionIds.length + result.syncedImageIds.length,
			};
		} catch (error: any) {
			console.error("Error syncing collisions:", error);
			return { success: false, error: error.message };
		}
	}, [dispatch]);

	// Download attachments
	const downloadAttachments = useCallback(
		async (
			collisionId: string,
		): Promise<{ success: boolean; error?: string }> => {
			try {
				await dispatch(downloadCollisionAttachments(collisionId)).unwrap();
				return { success: true };
			} catch (error: any) {
				console.error("Error downloading attachments:", error);
				return { success: false, error: error.message };
			}
		},
		[dispatch],
	);

	// Add image
	const addImage = useCallback(
		(collisionId: string, image: CollisionImage) => {
			dispatch(addImageToCollision({ collisionId, image }));
		},
		[dispatch],
	);

	// Remove image
	const removeImage = useCallback(
		(collisionId: string, imageId: string) => {
			dispatch(removeImageFromCollision({ collisionId, imageId }));
		},
		[dispatch],
	);

	return {
		createCollision,
		editCollision,
		deleteCollision,
		syncCollisions,
		downloadAttachments,
		addImage,
		removeImage,
	};
};

// ─── Collision Draft Hook ──────────────────────────────────────────

export const useCollisionDraft = () => {
	const dispatch = useAppDispatch();
	const draft = useAppSelector((state) => state.collision.collisionDraft);

	const saveDraft = useCallback(
		(draftData: CollisionDraft) => {
			dispatch(updateCollisionDraft(draftData));
		},
		[dispatch],
	);

	const clearDraft = useCallback(() => {
		dispatch(clearCollisionDraft());
	}, [dispatch]);

	const hasDraft = useMemo(() => draft !== null, [draft]);

	return {
		draft,
		saveDraft,
		clearDraft,
		hasDraft,
	};
};

// ─── Collision List Hook ───────────────────────────────────────────

export const useCollisionList = () => {
	const collisions = useAppSelector((state) => state.collision.collisions);
	const divisions = useAppSelector((state) => state.collision.divisions);
	const isLoading = useAppSelector((state) => state.collision.isLoading);
	const isSyncing = useAppSelector((state) => state.collision.isSyncing);

	const unsyncedCount = useMemo(
		() =>
			collisions.filter(
				(c) => c.syncStatus === SYNC_STATUS.NOT_SYNCED || !c.isSynced,
			).length,
		[collisions],
	);

	const getCollisionById = useCallback(
		(id: string) => collisions.find((c) => c.id === id),
		[collisions],
	);

	const getDivisionName = useCallback(
		(divisionId: string) => {
			const division = divisions.find((d) => d.id === divisionId);
			return division?.name || "Unknown Division";
		},
		[divisions],
	);

	return {
		collisions,
		divisions,
		isLoading,
		isSyncing,
		unsyncedCount,
		getCollisionById,
		getDivisionName,
	};
};

// ─── Collision Fields Hook ─────────────────────────────────────────

export const useCollisionFields = () => {
	const collisionFields = useAppSelector(
		(state) => state.collision.collisionFields,
	);
	const divisions = useAppSelector((state) => state.collision.divisions);

	const divisionOptions = useMemo(
		() =>
			divisions.map((d) => ({
				label: d.name,
				value: d.id,
			})),
		[divisions],
	);

	return {
		collisionFields,
		divisions,
		divisionOptions,
		generalFields: collisionFields?.generalFields || [],
		roadFields: collisionFields?.roadFields || [],
		vehicleFields: collisionFields?.vehicleFields || [],
		driverFields: collisionFields?.driverFields || [],
		passengerFields: collisionFields?.passengerFields || [],
		pedestrianFields: collisionFields?.pedestrianFields || [],
		personFields: collisionFields?.personFields || [],
		remarkFields: collisionFields?.remarkFields || [],
	};
};
