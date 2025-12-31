import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import { Sign } from "./models/Sign";
import { SyncMetadata } from "./models/SyncMetadata";

const adapter = new SQLiteAdapter({
	schema,
	jsi: false, // Must be false for Expo Go
	onSetUpError: (error) => {
		console.error("Database setup error:", error);
	},
});

export const database = new Database({
	adapter,
	modelClasses: [Sign as any, SyncMetadata as any],
});
