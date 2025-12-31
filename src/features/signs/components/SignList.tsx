import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import { SignCard } from "./SignCard";
import { Sign } from "@/src/database/models/Sign";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";

interface SignListProps {
  signs: Sign[];
  onSignPress?: (sign: Sign) => void;
  loading?: boolean;
}

export function SignList({ signs, onSignPress, loading }: SignListProps) {
  const styles = useThemedStyles(createStyles);

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <TextView variant="body">Loading signs...</TextView>
      </View>
    );
  }

  if (signs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TextView variant="body" style={styles.emptyText}>
          No signs found
        </TextView>
        <TextView variant="bodySmall" style={styles.emptySubtext}>
          Create your first sign to get started
        </TextView>
      </View>
    );
  }

  return (
    <FlatList
      data={signs}
      renderItem={({ item }) => (
        <SignCard sign={item} onPress={() => onSignPress?.(item)} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: {
      padding: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    emptyText: {
      color: theme.secondary,
      marginBottom: spacing.xs,
    },
    emptySubtext: {
      color: theme.secondary,
      textAlign: "center",
    },
  });
