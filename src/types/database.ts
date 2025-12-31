export interface DatabaseModel {
	id: string;
	_raw: any;
	createdAt: Date;
	updatedAt: Date;
}

export interface SyncableModel extends DatabaseModel {
	serverId?: string;
	status: "pending" | "synced" | "failed";
	syncedAt?: Date;
}
