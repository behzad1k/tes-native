import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import {
	addSign,
	updateSign,
	markSignForDeletion,
} from "@/src/store/slices/signSlice";
import { Sign, SignImage } from "@/src/types/models";

export const useSignOperations = () => {
	const dispatch = useAppDispatch();
	const signs = useAppSelector((state) => state.signs.signs);

	const createSign = useCallback(
		async (data: Omit<Sign, "id" | "isNew" | "status">) => {
			try {
				dispatch(addSign(data));
				return { success: true };
			} catch (error) {
				console.error("Error creating sign:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const editSign = useCallback(
		async (id: string, updates: Partial<Sign>) => {
			try {
				dispatch(updateSign({ id, updates }));
				return { success: true };
			} catch (error) {
				console.error("Error updating sign:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const deleteSign = useCallback(
		async (id: string) => {
			try {
				dispatch(markSignForDeletion(id));
				return { success: true };
			} catch (error) {
				console.error("Error deleting sign:", error);
				return { success: false, error };
			}
		},
		[dispatch],
	);

	const getSignById = useCallback(
		(id: string) => signs.find((s) => s.id === id),
		[signs],
	);

	return {
		signs,
		createSign,
		editSign,
		deleteSign,
		getSignById,
	};
};
