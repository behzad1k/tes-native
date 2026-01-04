import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { SignForm } from "../components/SignForm";
import { useCreateSign } from "../hooks/useCreateSign";
import { router } from "expo-router";
import { CreateSignRequest } from "../types";

export function CreateSignScreen() {
  const styles = useThemedStyles(createStyles);
  const { mutate: createSign, isPending } = useCreateSign();

  const handleSubmit = (data: CreateSignRequest) => {
    createSign(data, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Create Sign" onBackPress={true} />
      <SignForm onSubmit={handleSubmit} loading={isPending} />
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
  });
