import { Stack } from "expo-router";

export default function SignSupportsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign" />
      <Stack.Screen name="support" />
    </Stack>
  );
}
