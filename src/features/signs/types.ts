export type SignType =
	| "stop"
	| "yield"
	| "speed_limit"
	| "no_parking"
	| "one_way"
	| "other";
export type SignCondition = "good" | "fair" | "poor" | "damaged";
export type SignStatus = "pending" | "synced" | "failed";

export interface SignFormData {
	signType: SignType;
	locationLat: number;
	locationLng: number;
	address?: string;
	condition: SignCondition;
	notes?: string;
	imagePath?: string;
}

export interface SignData extends SignFormData {
	id: string;
	serverId?: string;
	status: SignStatus;
	userId: string;
	createdAt: Date;
	updatedAt: Date;
	syncedAt?: Date;
}

export interface CreateSignRequest {
	signType: SignType;
	location: {
		lat: number;
		lng: number;
	};
	address?: string;
	condition: SignCondition;
	notes?: string;
	imagePath?: string;
}

export interface CreateSignResponse {
	id: string;
	signType: string;
	location: {
		lat: number;
		lng: number;
	};
	condition: string;
	createdAt: string;
}
