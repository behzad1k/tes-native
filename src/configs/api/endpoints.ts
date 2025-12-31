const formatUrl = (endpoint: string) => `/${endpoint}/`;

const ENDPOINTS = {
	AUTH: {
		LOGIN: formatUrl("login"),
		VERIFY: formatUrl("check"),
		LOGOUT: formatUrl("logout"),
	},
	USER: {
		INDEX: formatUrl("user"),
		UPDATE: formatUrl("user"),
	},
	SIGNS: {
		INDEX: formatUrl("signs"),
		CREATE: formatUrl("signs"),
		DETAIL: (id: string) => formatUrl(`signs/${id}`),
		UPDATE: (id: string) => formatUrl(`signs/${id}`),
		DELETE: (id: string) => formatUrl(`signs/${id}`),
	},
} as const;

export default ENDPOINTS;
