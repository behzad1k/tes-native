import { API_CONFIG } from "@/src/configs/api";

const baseUrl = API_CONFIG.BASE_URL + API_CONFIG.POST_FIX;
const formatUrl = (endpoint: string) => `${baseUrl}/${endpoint}`;

const ENDPOINTS = {
	AUTH: {
		LOGIN: formatUrl("connect/token"),
		VERIFY: formatUrl("connect/verify"),
		LOGOUT: formatUrl("connect/logout"),
	},
	USER: {
		PROFIlE: API_CONFIG.AUTH_BASE_URL + "api/user/UserProfileMobileApp",

		UPDATE: formatUrl("api/user"),
	},
	SIGNS: {
		APP_DATA: formatUrl("sign/api/sync/appData"),
		SETUPS: formatUrl("sign/api/sync/GetSetups"),

		CREATE: formatUrl("api/Sign/Add"),
		DETAIL: (id: string) => formatUrl(`api/Sign/${id}`),
		UPDATE: (id: string) => formatUrl(`api/Sign/Update/${id}`),
		DELETE: (id: string) => formatUrl(`api/Sign/Delete/${id}`),
		ADD_IMAGES: (id: string) => formatUrl(`api/Sign/AddSignImages/${id}`),
	},
	SUPPORTS: {
		INDEX: formatUrl("api/Support/GetSupports"),
		CREATE: formatUrl("api/Support/Add"),
		DETAIL: (id: string) => formatUrl(`api/Support/${id}`),
		UPDATE: (id: string) => formatUrl(`api/Support/Update/${id}`),
		DELETE: (id: string) => formatUrl(`api/Support/Delete/${id}`),
		ADD_IMAGES: (id: string) => formatUrl(`api/Support/AddSupportImages/${id}`),
	},
	MAINTENANCE: {
		INDEX: formatUrl("maintenance/api/jobs/UserJobs"),

		DETAIL: (id: string) => formatUrl(`api/Maintenance/jobs/${id}`),
		UPDATE: (id: string) => formatUrl(`api/Maintenance/jobs/${id}`),
		UPDATE_ASSET: (jobId: string, assetId: string) =>
			formatUrl(`api/Maintenance/jobs/${jobId}/assets/${assetId}`),
		DOWNLOAD_ATTACHMENTS: (jobId: string) =>
			formatUrl(`api/Attachments/DownloadAttachments/${jobId}`),
	},
	SYNC: {
		APP_DATA: formatUrl("api/sync/appData"),
	},
	TRAFFIC_COUNTER: {
		VEHICLE_CLASSIFICATIONS: formatUrl(
			"traffic/api/Setups/GetCustomerVehicleClassification/",
		),
	},
} as const;

export default ENDPOINTS;
