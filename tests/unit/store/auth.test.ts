import { useAuthStore } from "@/src/store/auth";
import { mockUser } from "@/tests/utils/mock-data";

describe("Auth Store", () => {
	beforeEach(() => {
		// Reset store before each test
		useAuthStore.setState({
			token: null,
			user: null,
			isAuthenticated: false,
		});
	});

	it("should set auth", () => {
		const { setAuth } = useAuthStore.getState();

		setAuth("test-token", mockUser);

		const state = useAuthStore.getState();
		expect(state.token).toBe("test-token");
		expect(state.user).toEqual(mockUser);
		expect(state.isAuthenticated).toBe(true);
	});

	it("should clear auth", () => {
		const { setAuth, clearAuth } = useAuthStore.getState();

		setAuth("test-token", mockUser);
		clearAuth();

		const state = useAuthStore.getState();
		expect(state.token).toBeNull();
		expect(state.user).toBeNull();
		expect(state.isAuthenticated).toBe(false);
	});

	it("should update user", () => {
		const { setAuth, updateUser } = useAuthStore.getState();

		setAuth("test-token", mockUser);
		updateUser({ name: "Updated" });

		const state = useAuthStore.getState();
		expect(state.user?.name).toBe("Updated");
		expect(state.user?.lastName).toBe(mockUser.lastName);
	});
});
