import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import SignSupportCard from "./SignCard";
import { Sign, Support } from "@/src/types/models";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";

interface SignSupportListProps {
  list: Array<Sign | Support>;
  onItemPress?: (item: Sign | Support) => void;
  loading?: boolean;
}

export default function SignSupportList({
  list,
  onItemPress,
  loading,
}: SignSupportListProps) {
  const styles = useThemedStyles(createStyles);

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <TextView variant="body">Loading...</TextView>
      </View>
    );
  }

  if (list.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <TextView variant="body" style={styles.emptyText}>
          No items found
        </TextView>
        <TextView variant="bodySmall" style={styles.emptySubtext}>
          Create your first sign/support to get started
        </TextView>
      </View>
    );
  }

  return (
    <FlatList
      data={list}
      renderItem={({ item }) => (
        <SignSupportCard item={item} onPress={() => onItemPress?.(item)} />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    list: {},
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
