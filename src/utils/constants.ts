import { Form, Step } from "@/src/features/order/types";
import { User } from "@/src/features/user/types";

export const DEFAULT_USER: User = {
	id: 0,
	name: "",
	lastName: "",
	nationalCode: "",
	phoneNumber: "",
	role: "USER",
	profilePic: { url: "" },
} as const;
