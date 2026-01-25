import { Sign } from "@/src/database/models/Sign";
import { CreateSignRequest, SignData } from "@/src/modules/signs/types";

export const mockUser = {
	id: "user-123",
	name: "Test",
	lastName: "User",
	phoneNumber: "09123456789",
	role: "USER" as const,
	nationalCode: "1234567890",
	profilePic: { url: "" },
};

export const mockSignData: CreateSignRequest = {
	signType: "stop",
	location: {
		lat: 40.7128,
		lng: -74.006,
	},
	address: "123 Main St",
	condition: "good",
	notes: "Test sign",
};

export const mockSign: Partial<SignData> = {
	id: "sign-123",
	serverId: "server-123",
	signType: "stop",
	locationLat: 40.7128,
	locationLng: -74.006,
	address: "123 Main St",
	condition: "good",
	notes: "Test sign",
	status: "synced",
	userId: "user-123",
	createdAt: new Date(),
	updatedAt: new Date(),
	syncedAt: new Date(),
};

export const createMockSign = (
	overrides?: Partial<SignData>,
): Partial<SignData> => ({
	...mockSign,
	...overrides,
});
