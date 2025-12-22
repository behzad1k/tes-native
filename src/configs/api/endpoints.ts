const formatUrl = (endpoint: string) => `/${endpoint}/`;
const ENDPOINTS = {
	AUTH: {
		LOGIN: formatUrl("login"),
		VERIFY: formatUrl("check"),
	},
	USER: {
		INDEX: formatUrl("user"),
	},
} as const;

export default ENDPOINTS;
