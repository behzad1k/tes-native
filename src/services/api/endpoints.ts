import { API_CONFIG } from "@/src/configs/api";

const baseUrl = API_CONFIG.BASE_URL + API_CONFIG.POST_FIX;
const authUrl = API_CONFIG.AUTH_BASE_URL;

// Helper to format URLs with proper base
const formatUrl = (base: string, endpoint: string) =>
	`${base.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;

const ENDPOINTS = {
	AUTH: {
		LOGIN: formatUrl(authUrl, "connect/token"),
		VERIFY: formatUrl(authUrl, "connect/verify"),
		LOGOUT: formatUrl(authUrl, "connect/logout"),
	},
	USER: {
		PROFIlE: formatUrl(authUrl, "api/user/UserProfileMobileApp"),
		UPDATE: formatUrl(authUrl, "api/user"),
	},
	SIGNS: {
		APP_DATA: formatUrl(baseUrl, "sign/api/sync/appData"),
		SETUPS: (customerId: string) =>
			formatUrl(baseUrl, `sign/api/sync/GetSetups/${customerId}`),
		CREATE: formatUrl(baseUrl, "sign/api/Sign/Add"),
		DETAIL: (id: string) => formatUrl(baseUrl, `sign/api/Sign/${id}`),
		UPDATE: (id: string) => formatUrl(baseUrl, `sign/api/Sign/Update/${id}`),
		DELETE: (id: string) => formatUrl(baseUrl, `sign/api/Sign/Delete/${id}`),
		// Image upload: PUT with FormData, isNew indicates if sign is new
		ADD_IMAGES: (isNew: boolean) =>
			formatUrl(baseUrl, `sign/api/Attachments/Sign/${isNew}`),
		DOWNLOAD_ATTACHMENTS: (signId: string) =>
			formatUrl(baseUrl, `sign/api/Attachments/DownloadAttachments/${signId}`),
	},
	SUPPORTS: {
		INDEX: formatUrl(baseUrl, "sign/api/Support/GetSupports"),
		CREATE: formatUrl(baseUrl, "sign/api/Support/Add"),
		DETAIL: (id: string) => formatUrl(baseUrl, `sign/api/Support/${id}`),
		UPDATE: (id: string) => formatUrl(baseUrl, `sign/api/Support/Update/${id}`),
		DELETE: (id: string) => formatUrl(baseUrl, `sign/api/Support/Delete/${id}`),
		// Image upload: PUT with FormData, isNew indicates if support is new
		ADD_IMAGES: (isNew: boolean) =>
			formatUrl(baseUrl, `sign/api/Attachments/Support/${isNew}`),
		DOWNLOAD_ATTACHMENTS: (supportId: string) =>
			formatUrl(baseUrl, `sign/api/Attachments/DownloadAttachments/${supportId}`),
	},
	SYNC: {
		// POST - Sync data from app to server (changeLogs, signs, supports)
		GET_DATA_FROM_APP: formatUrl(baseUrl, "sign/api/sync/getDataFromApp"),
		// GET - Fetch app data including supports, signsWithoutSupport, setups, setting
		APP_DATA: formatUrl(baseUrl, "sign/api/sync/appData"),
	},
	MAINTENANCE: {
		USER_JOBS: formatUrl(baseUrl, "maintenance/api/jobs/UserJobs"),
		UPDATE_USER_JOBS: formatUrl(baseUrl, "maintenance/api/Jobs/UpdateUserJobs"),
		UPLOAD_JOB_IMAGE: formatUrl(baseUrl, "maintenance/api/Attachments/job"),
		DOWNLOAD_ATTACHMENTS: (jobId: string) =>
			formatUrl(baseUrl, `maintenance/api/Attachments/DownloadAttachments/${jobId}`),
	},
	TRAFFIC_COUNTER: {
		VEHICLE_CLASSIFICATIONS: (customerId: string) =>
			formatUrl(baseUrl, `traffic/api/Setups/GetCustomerVehicleClassification/${customerId}`),
	},
} as const;

export default ENDPOINTS;
