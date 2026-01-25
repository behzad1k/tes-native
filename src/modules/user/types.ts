export interface User {
	id: string;
	name: string;
	lastName: string;
	nationalCode: string;
	phoneNumber: string;
	role: "USER" | "ADMIN";
	profilePic: {
		url: string;
	};
}
