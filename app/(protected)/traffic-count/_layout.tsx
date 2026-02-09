import { Stack } from "expo-router";

export default function TrafficCountLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="counter"
        options={{
          orientation: "landscape",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
