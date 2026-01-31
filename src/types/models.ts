import { SyncStatus } from "@/src/types/global";

export interface SignImage {
	uri: string;
	status: SyncStatus;
	isNew: boolean;
	signId: string;
	imageId?: string;
	localPath?: string;
}

export interface Sign {
	id: string;
	customerId: string;
	locationTypeId: string;
	signId: string;
	supportId: string;
	codeId: string;
	height: string;
	facingDirectionId: string;
	faceMaterialId: string;
	reflectiveCoatingId: string;
	reflectiveRatingId: string;
	dimensionId: string;
	dateInstalled: string; // Store as ISO string for Redux serialization
	conditionId: string;
	note: string;
	images: SignImage[];
	isNew: boolean;
	status: SyncStatus;
	localId?: string; // Temporary ID for unsynced signs
	serverId?: string; // Server ID after sync
}

export interface Support {
	id: string;
	localId?: string;
	customerId: string;
	supportLocationTypeId: string;
	locationId: string;
	latitude: number;
	longitude: number;
	supportId: string;
	codeId: string;
	positionId: string;
	conditionId: string;
	note: string;
	dateInstalled: string;
	signs: Array<{
		id: string;
		supportId?: string;
		signId: string;
		// Add other sign properties from the previous Sign interface as needed
		[key: string]: any;
	}>;
	images: Array<SupportImage>;
	isNew: boolean;
	isSynced: boolean;
	status: SyncStatus;
}

export interface SupportImage {
	uri: string;
	status: SyncStatus;
	isNew: boolean;
	supportId: string;
	imageId?: string;
	localPath?: string;
}
export interface User {
	id: string;
	name: string;
	phoneNumber: string;
	role: string;
}

export interface BackendImage {
	id: string;
	url: string;
	signId: string;
	thumbnailUrl?: string;
}
