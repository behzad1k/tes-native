import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="signs" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}
