import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
	version: 1,
	tables: [
		tableSchema({
			name: "signs",
			columns: [
				{ name: "server_id", type: "string", isOptional: true },
				{ name: "sign_type", type: "string" },
				{ name: "location_lat", type: "number" },
				{ name: "location_lng", type: "number" },
				{ name: "address", type: "string", isOptional: true },
				{ name: "condition", type: "string" },
				{ name: "notes", type: "string", isOptional: true },
				{ name: "image_path", type: "string", isOptional: true },
				{ name: "status", type: "string" }, // 'pending', 'synced', 'failed'
				{ name: "created_at", type: "number" },
				{ name: "updated_at", type: "number" },
				{ name: "synced_at", type: "number", isOptional: true },
				{ name: "user_id", type: "string" },
			],
		}),
		tableSchema({
			name: "sync_metadata",
			columns: [
				{ name: "entity_type", type: "string" },
				{ name: "entity_id", type: "string" },
				{ name: "last_sync", type: "number" },
				{ name: "sync_status", type: "string" },
				{ name: "error_message", type: "string", isOptional: true },
			],
		}),
	],
});
