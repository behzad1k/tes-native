import { Model } from "@nozbe/watermelondb";
import { field, date, readonly } from "@nozbe/watermelondb/decorators";

export class Sign extends Model {
	static table = "signs";

	@field("server_id") serverId: string | null;
	@field("sign_type") signType: string;
	@field("location_lat") locationLat: number;
	@field("location_lng") locationLng: number;
	@field("address") address: string | null;
	@field("condition") condition: string;
	@field("notes") notes: string | null;
	@field("image_path") imagePath: string | null;
	@field("status") status: "pending" | "synced" | "failed";
	@field("user_id") userId: string;

	@readonly @date("created_at") createdAt: Date;
	@date("updated_at") updatedAt: Date;
	@date("synced_at") syncedAt: Date | null;

	get isPending(): boolean {
		return this.status === "pending";
	}

	get isSynced(): boolean {
		return this.status === "synced";
	}

	get needsSync(): boolean {
		return this.status === "pending" || this.status === "failed";
	}
}
