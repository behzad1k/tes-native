import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { FontSizes, FontWeights } from "@/src/styles/theme/fonts";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { ListBullets } from "phosphor-react-native";
import { useMemo, useCallback } from "react";
import { View, FlatList, Dimensions, StyleSheet } from "react-native";
import { TrafficCountWorkOrder, TrafficCount } from "../types";
import { Theme } from "@/src/types/theme";
import { getVehicleIcon } from "../components/VehicleIcons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface EntriesDrawerContentProps {
  workOrder: TrafficCountWorkOrder;
  counts: TrafficCount[];
}

const formatMovement = (
  movements: Record<string, Record<string, number>>,
): string => {
  const parts: string[] = [];
  for (const [movement, classes] of Object.entries(movements)) {
    const [from, to] = movement.split("_");
    for (const [classId, count] of Object.entries(classes)) {
      parts.push(`${from} → ${to}`);
    }
  }
  return parts.join(", ") || "—";
};

const formatEntryTime = (dateStr: string): string => {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const EntriesDrawerContent = ({
  workOrder,
  counts,
}: EntriesDrawerContentProps) => {
  const styles = useThemedStyles(createEntriesStyles);

  const sortedCounts = useMemo(
    () =>
      [...counts].sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      ),
    [counts],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: TrafficCount; index: number }) => {
      // Get the vehicle icon based on classificationName
      const vehicleName = item.classificationName || "Car";
      const VehicleIcon = getVehicleIcon(vehicleName);

      return (
        <View style={[styles.entryRow, index % 2 === 0 && styles.entryRowAlt]}>
          <View style={styles.entryIndex}>
            <TextView style={styles.entryIndexText}>
              {sortedCounts.length - index}
            </TextView>
          </View>

          {/* Vehicle icon */}
          <View style={styles.vehicleIconContainer}>
            <VehicleIcon size={22} color={colors.lightGreen} />
          </View>

          <View style={styles.entryContent}>
            {/* Vehicle type name */}
            <TextView style={styles.vehicleName}>{vehicleName}</TextView>
            {/* Movement direction */}
            <TextView style={styles.entryMovement}>
              {formatMovement(item.movements)}
            </TextView>
            <TextView style={styles.entryTime}>
              {formatEntryTime(item.dateTime)}
            </TextView>
          </View>

          <View style={styles.entrySyncBadge}>
            <View
              style={[
                styles.syncDot,
                item.isSynced ? styles.syncDotGreen : styles.syncDotOrange,
              ]}
            />
          </View>
        </View>
      );
    },
    [styles, sortedCounts.length],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextView style={styles.title}>Record Entries</TextView>
        <TextView style={styles.subtitle}>
          {workOrder.locationName} • {counts.length} records
        </TextView>
      </View>
      {counts.length === 0 ? (
        <View style={styles.empty}>
          <ListBullets size={48} color="#999" weight="light" />
          <TextView style={styles.emptyText}>No entries recorded yet</TextView>
        </View>
      ) : (
        <FlatList
          data={sortedCounts}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const createEntriesStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SCREEN_HEIGHT * 0.75,
    },
    header: {
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      fontSize: FontSizes.lg,
      fontWeight: FontWeights.bold,
      color: theme.text,
    },
    subtitle: {
      fontSize: FontSizes.xs,
      color: theme.secondary,
      marginTop: 4,
    },
    list: {
      paddingBottom: spacing.xl,
    },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    entryRowAlt: {
      backgroundColor: theme.primary,
    },
    entryIndex: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.border,
      justifyContent: "center",
      alignItems: "center",
    },
    entryIndexText: {
      fontSize: FontSizes.xs,
      fontWeight: FontWeights.bold,
      color: theme.text,
    },
    vehicleIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(155, 198, 49, 0.12)",
      justifyContent: "center",
      alignItems: "center",
    },
    entryContent: {
      flex: 1,
      gap: 1,
    },
    vehicleName: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.semiBold,
      color: colors.lightGreen,
    },
    entryMovement: {
      fontSize: FontSizes.sm,
      fontWeight: FontWeights.medium,
      color: theme.text,
    },
    entryTime: {
      fontSize: FontSizes.xxs,
      color: theme.secondary,
    },
    entrySyncBadge: {
      padding: 4,
    },
    syncDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    syncDotGreen: {
      backgroundColor: "#4CAF50",
    },
    syncDotOrange: {
      backgroundColor: "#FF9800",
    },
    empty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: FontSizes.sm,
      color: theme.secondary,
    },
  });

export default EntriesDrawerContent;
