import { Stack } from "expo-router";

export default function ProtectedLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="sign-inventory" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="traffic-count" />
    </Stack>
  );
}
