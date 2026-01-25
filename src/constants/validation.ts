const validations = {
	email: {
		required: "Email is required",
		pattern: {
			value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
			message: "Invalid email address",
		},
		maxLength: {
			value: 50,
			message: "Email must be less than 50 characters",
		},
	},

	password: {
		required: "Password is required",
		minLength: {
			value: 8,
			message: "Password must be at least 8 characters",
		},
		maxLength: {
			value: 50,
			message: "Password must be less than 50 characters",
		},
	},

	validatePassword: (value: string) => {
		if (!/\d/.test(value)) {
			return "Password must contain at least one number";
		}
		if (!/[A-Z]/.test(value)) {
			return "Password must contain at least one uppercase letter";
		}
		if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
			return "Password must contain at least one special character";
		}
		return true;
	},

	validatePhone: (value: string) => {
		const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
		if (!phoneRegex.test(value)) {
			return "Invalid phone number";
		}
		return true;
	},

	// validateEmailExists: async (email: string) => {
	// 	try {
	// 		const exists = await checkEmailExists(email);
	// 		return exists ? "Email already registered" : true;
	// 	} catch {
	// 		return "Unable to validate email";
	// 	}
	// },
};

export default validations;
