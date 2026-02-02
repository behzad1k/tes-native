import React from "react";
import { FlatList, View, StyleSheet } from "react-native";
import MaintenanceCard from "./MaintenanceCard";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { MaintenanceJob } from "@/src/types/models";

interface MaintenanceListProps {
  list: MaintenanceJob[];
  onItemPress?: (item: MaintenanceJob) => void;
  loading?: boolean;
}

export default function MaintenanceList({
  list,
  onItemPress,
  loading,
}: MaintenanceListProps) {
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
          No maintenance records found
        </TextView>
        <TextView variant="bodySmall" style={styles.emptySubtext}>
          Create your first maintenance record to get started
        </TextView>
      </View>
    );
  }

  return (
    <FlatList
      data={list}
      renderItem={({ item, index }) => (
        <MaintenanceCard
          item={item}
          onPress={() => onItemPress?.(item)}
          index={index}
        />
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
