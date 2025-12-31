import { Database } from "@nozbe/watermelondb";
import LokiJSAdapter from "@nozbe/watermelondb/adapters/lokijs";
import { schema } from "./schema";
import { Sign } from "./models/Sign";
import { SyncMetadata } from "./models/SyncMetadata";

// Use LokiJS for web (in-memory or IndexedDB)
const adapter = new LokiJSAdapter({
	schema,
	useWebWorker: false,
	useIncrementalIndexedDB: true,
	onSetUpError: (error) => {
		console.error("Database setup error:", error);
	},
});

export const database = new Database({
	adapter,
	modelClasses: [Sign as any, SyncMetadata as any],
});
