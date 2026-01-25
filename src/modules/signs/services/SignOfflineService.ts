import { database } from "@/src/database";
import { Sign } from "@/src/database/models/Sign";
import { Q } from "@nozbe/watermelondb";
import { CreateSignRequest } from "../types";

export class SignOfflineService {
	private signsCollection = database.get<Sign>("signs");

	async createSign(data: CreateSignRequest, userId: string): Promise<Sign> {
		return await database.write(async () => {
			return await this.signsCollection.create((sign) => {
				sign.signType = data.signType;
				sign.locationLat = data.location.lat;
				sign.locationLng = data.location.lng;
				sign.address = data.address || null;
				sign.condition = data.condition;
				sign.notes = data.notes || null;
				sign.imagePath = data.imagePath || null;
				sign.status = "pending";
				sign.userId = userId;
			});
		});
	}

	async getAllSigns(userId: string): Promise<Sign[]> {
		return await this.signsCollection
			.query(Q.where("user_id", userId), Q.sortBy("created_at", Q.desc))
			.fetch();
	}

	async getPendingSigns(): Promise<Sign[]> {
		return await this.signsCollection
			.query(Q.where("status", "pending"))
			.fetch();
	}

	async getSignById(id: string): Promise<Sign> {
		return await this.signsCollection.find(id);
	}

	async updateSign(
		id: string,
		data: Partial<CreateSignRequest>,
	): Promise<Sign> {
		const sign = await this.signsCollection.find(id);
		return await database.write(async () => {
			return await sign.update((s) => {
				if (data.signType) s.signType = data.signType;
				if (data.location) {
					s.locationLat = data.location.lat;
					s.locationLng = data.location.lng;
				}
				if (data.address !== undefined) s.address = data.address || null;
				if (data.condition) s.condition = data.condition;
				if (data.notes !== undefined) s.notes = data.notes || null;
				if (data.imagePath !== undefined) s.imagePath = data.imagePath || null;
			});
		});
	}

	async markAsSynced(localId: string, serverId: string): Promise<void> {
		const sign = await this.signsCollection.find(localId);
		await database.write(async () => {
			await sign.update((s) => {
				s.serverId = serverId;
				s.status = "synced";
				s.syncedAt = new Date();
			});
		});
	}

	async markAsFailed(localId: string): Promise<void> {
		const sign = await this.signsCollection.find(localId);
		await database.write(async () => {
			await sign.update((s) => {
				s.status = "failed";
			});
		});
	}

	async deleteSign(id: string): Promise<void> {
		const sign = await this.signsCollection.find(id);

		// Safety check: only delete if synced
		if (sign.status !== "synced") {
			throw new Error("Cannot delete unsynced sign");
		}

		await database.write(async () => {
			await sign.markAsDeleted();
		});
	}

	async searchSigns(userId: string, query: string): Promise<Sign[]> {
		return await this.signsCollection
			.query(
				Q.where("user_id", userId),
				Q.or(
					Q.where("sign_type", Q.like(`%${query}%`)),
					Q.where("address", Q.like(`%${query}%`)),
					Q.where("notes", Q.like(`%${query}%`)),
				),
				Q.sortBy("created_at", Q.desc),
			)
			.fetch();
	}
}

export const signOfflineService = new SignOfflineService();
