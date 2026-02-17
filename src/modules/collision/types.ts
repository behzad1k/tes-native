import { SYNC_STATUS } from "@/src/constants/global";
import {
	Collision,
	CollisionImage,
	CollisionGeneral,
	CollisionRoad,
	CollisionVehicle,
	CollisionPerson,
	CollisionRemark,
	CollisionMapLocation,
	InvolvedAsType,
} from "@/src/types/models";
import { v4 as uuidv4 } from "uuid";

// ─── Form Data Types ───────────────────────────────────────────────

export interface CollisionFormData {
	// Identification
	id: string;
	customerId: string;
	userId: string;
	divisionId: string;

	// Location
	latitude: number;
	longitude: number;

	// Data sections
	general: CollisionGeneral;
	roads: CollisionRoad[];
	vehicles: CollisionVehicle[];
	persons: CollisionPerson[];
	remark: CollisionRemark;
	images: CollisionImage[];
}

// ─── Default Form Data ─────────────────────────────────────────────

export const getDefaultCollisionFormData = (): CollisionFormData => ({
	id: uuidv4(),
	customerId: "",
	userId: "",
	divisionId: "",
	latitude: 0,
	longitude: 0,
	general: {},
	roads: [],
	vehicles: [],
	persons: [],
	remark: {},
	images: [],
});

// ─── Transform Collision to Form Data ──────────────────────────────

export const collisionToFormData = (
	collision?: Collision | null,
): CollisionFormData => {
	if (!collision) {
		return getDefaultCollisionFormData();
	}

	return {
		id: collision.id,
		customerId: collision.customerId,
		userId: collision.userId,
		divisionId: collision.divisionId,
		latitude: collision.mapLocation?.latitude || 0,
		longitude: collision.mapLocation?.longitude || 0,
		general: collision.general || {},
		roads: collision.roads || [],
		vehicles: collision.vehicles || [],
		persons: collision.persons || [],
		remark: collision.remark || {},
		images: collision.images || [],
	};
};

// ─── Transform Form Data to Collision ──────────────────────────────

export const formDataToCollision = (
	formData: CollisionFormData,
	existingCollision?: Collision | null,
): Omit<Collision, "id" | "isNew" | "isSynced" | "syncStatus"> => {
	const mapLocation: CollisionMapLocation = {
		latitude: formData.latitude,
		longitude: formData.longitude,
		latitudeDelta: 0.005,
		longitudeDelta: 0.005 * 1.8,
	};

	return {
		customerId: formData.customerId,
		userId: formData.userId,
		divisionId: formData.divisionId,
		status: 0,
		submissionDT: existingCollision?.submissionDT || new Date().toISOString(),
		editedSubmissionDT: existingCollision
			? new Date().toISOString()
			: undefined,
		mapLocation,
		submissionMapLocation: existingCollision?.submissionMapLocation,
		editedSubmissionMapLocation: existingCollision ? mapLocation : undefined,
		general: formData.general,
		roads: formData.roads,
		vehicles: formData.vehicles,
		persons: formData.persons,
		remark: formData.remark,
		images: formData.images,
	};
};

// ─── Road Helpers ──────────────────────────────────────────────────

export const createNewRoad = (index: number): CollisionRoad => ({
	id: uuidv4(),
	index: String(index),
});

export const getNextRoadIndex = (roads: CollisionRoad[]): number => {
	return roads.length + 1;
};

// ─── Vehicle Helpers ───────────────────────────────────────────────

export const createNewVehicle = (index: number): CollisionVehicle => ({
	id: uuidv4(),
	index: String(index),
});

export const getNextVehicleIndex = (vehicles: CollisionVehicle[]): number => {
	return vehicles.length + 1;
};

export const vehicleIndexExists = (
	vehicles: CollisionVehicle[],
	index: string,
): boolean => {
	return vehicles.some((v) => v.index === index);
};

// ─── Person Helpers ────────────────────────────────────────────────

export const createNewPerson = (
	involvedAs: InvolvedAsType,
	vehicleId?: string,
): CollisionPerson => ({
	id: uuidv4(),
	involvedAs,
	vehicleId,
});

export const getInvolvedAsLabel = (involvedAs: InvolvedAsType): string => {
	switch (involvedAs) {
		case InvolvedAsType.DRIVER:
			return "Driver";
		case InvolvedAsType.PASSENGER:
			return "Passenger";
		case InvolvedAsType.PEDESTRIAN:
			return "Pedestrian";
		case InvolvedAsType.OTHER_PEOPLE:
			return "Other People";
		default:
			return "Unknown";
	}
};

export const getInvolvedAsOptions = () => [
	{ label: "Driver", value: InvolvedAsType.DRIVER },
	{ label: "Passenger", value: InvolvedAsType.PASSENGER },
	{ label: "Pedestrian", value: InvolvedAsType.PEDESTRIAN },
	{ label: "Other People", value: InvolvedAsType.OTHER_PEOPLE },
];

// ─── Image Helpers ─────────────────────────────────────────────────

export const createCollisionImage = (
	uri: string,
	collisionId: string,
): CollisionImage => ({
	imageId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
	collisionId,
	uri,
	localPath: uri,
	isNew: true,
	isSynced: false,
});

// ─── Date/Time Helpers ─────────────────────────────────────────────

export const formatISODate = (date: Date): string => {
	const d = new Date(date);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const formatISOTime = (date: Date): string => {
	const d = new Date(date);
	return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const formatISODateTime = (date: Date): string => {
	return `${formatISODate(date)} ${formatISOTime(date)}`;
};

export const parseISODate = (isoString: string): Date | null => {
	if (!isoString) return null;
	return new Date(isoString);
};

// ─── Auto-generate ID ──────────────────────────────────────────────

export const generateCollisionNumber = (): string => {
	const d = new Date();
	return (
		String(d.getFullYear()) +
		String(d.getMonth() + 1).padStart(2, "0") +
		String(d.getDate()).padStart(2, "0") +
		String(d.getHours()).padStart(2, "0") +
		String(d.getMinutes()).padStart(2, "0") +
		String(d.getSeconds()).padStart(2, "0") +
		String(d.getMilliseconds()).padStart(3, "0")
	);
};

// ─── Validation Helpers ────────────────────────────────────────────

export const isCollisionValid = (formData: CollisionFormData): boolean => {
	if (!formData.divisionId) return false;
	if (!formData.latitude || !formData.longitude) return false;
	return true;
};

export const getValidationErrors = (
	formData: CollisionFormData,
): Record<string, string> => {
	const errors: Record<string, string> = {};

	if (!formData.divisionId) {
		errors.divisionId = "Division is required";
	}

	if (!formData.latitude || !formData.longitude) {
		errors.location = "Location is required";
	}

	return errors;
};
