import { Model } from "@nozbe/watermelondb";
import { field, date } from "@nozbe/watermelondb/decorators";

export class SyncMetadata extends Model {
	static table = "sync_metadata";

	@field("entity_type") entityType: string;
	@field("entity_id") entityId: string;
	@date("last_sync") lastSync: Date;
	@field("sync_status") _syncStatus: string;
	@field("error_message") errorMessage: string | null;
}
