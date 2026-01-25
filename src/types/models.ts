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
	dateInstalled: Date;
	signConditionId: string;
	note: string;
	images: SignImage[];
	isNew: boolean;
	status: SyncStatus;
	localId?: string; // Temporary ID for unsynced signs
	serverId?: string; // Server ID after sync
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
