import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { Header } from "@/src/components/layouts/Header";
import { useSignById } from "@/src/features/signs/hooks/useSigns";
import { useDeleteSign } from "@/src/features/signs/hooks/useDeleteSign";
import TextView from "@/src/components/ui/TextView";
import ButtonView from "@/src/components/ui/ButtonView";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { withObservables } from "@nozbe/watermelondb/react";

function SignDetailScreenComponent({ sign }: any) {
  const styles = useThemedStyles(createStyles);
  const { mutate: deleteSign, isPending: isDeleting } = useDeleteSign();

  if (!sign) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header title="Sign Details" onBackPress={true} />
        <View style={styles.content}>
          <TextView variant="body">Sign not found</TextView>
        </View>
      </SafeAreaView>
    );
  }

  const handleDelete = () => {
    deleteSign(sign.id, {
      onSuccess: () => {
        router.back();
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Header title="Sign Details" onBackPress={true} />
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TextView variant="label" style={styles.label}>
            Sign Type
          </TextView>
          <TextView variant="h3" style={styles.value}>
            {sign.signType.replace("_", " ").toUpperCase()}
          </TextView>
        </View>

        <View style={styles.section}>
          <TextView variant="label" style={styles.label}>
            Status
          </TextView>
          <View style={styles.statusBadge}>
            <TextView variant="body" style={styles.statusText}>
              {sign.status.toUpperCase()}
            </TextView>
          </View>
        </View>

        <View style={styles.section}>
          <TextView variant="label" style={styles.label}>
            Condition
          </TextView>
          <TextView variant="body" style={styles.value}>
            {sign.condition.toUpperCase()}
          </TextView>
        </View>

        <View style={styles.section}>
          <TextView variant="label" style={styles.label}>
            Location
          </TextView>
          <TextView variant="body" style={styles.value}>
            Lat: {sign.locationLat.toFixed(6)}
          </TextView>
          <TextView variant="body" style={styles.value}>
            Lng: {sign.locationLng.toFixed(6)}
          </TextView>
        </View>

        {sign.address && (
          <View style={styles.section}>
            <TextView variant="label" style={styles.label}>
              Address
            </TextView>
            <TextView variant="body" style={styles.value}>
              {sign.address}
            </TextView>
          </View>
        )}

        {sign.notes && (
          <View style={styles.section}>
            <TextView variant="label" style={styles.label}>
              Notes
            </TextView>
            <TextView variant="body" style={styles.value}>
              {sign.notes}
            </TextView>
          </View>
        )}

        <View style={styles.section}>
          <TextView variant="label" style={styles.label}>
            Created At
          </TextView>
          <TextView variant="body" style={styles.value}>
            {new Date(sign.createdAt).toLocaleString()}
          </TextView>
        </View>

        {sign.syncedAt && (
          <View style={styles.section}>
            <TextView variant="label" style={styles.label}>
              Synced At
            </TextView>
            <TextView variant="body" style={styles.value}>
              {new Date(sign.syncedAt).toLocaleString()}
            </TextView>
          </View>
        )}

        <View style={styles.actions}>
          <ButtonView
            onPress={handleDelete}
            loading={isDeleting}
            disabled={sign.status !== "synced"}
            variant="danger"
          >
            Delete Sign
          </ButtonView>
          {sign.status !== "synced" && (
            <TextView variant="caption" style={styles.deleteNote}>
              Sign must be synced before deletion
            </TextView>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Enhance with WatermelonDB observables
export default function SignDetailScreen() {
  const { id } = useLocalSearchParams();

  const EnhancedComponent = withObservables(["id"], ({ id }: any) => ({
    sign: useSignById(id),
  }))(SignDetailScreenComponent);

  return <EnhancedComponent id={id as string} />;
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    section: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: theme.primary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    label: {
      color: theme.secondary,
      marginBottom: spacing.xs,
    },
    value: {
      color: theme.text,
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 16,
      backgroundColor: colors.pink,
    },
    statusText: {
      color: colors.white,
      fontWeight: "600",
    },
    actions: {
      marginTop: spacing.xl,
      gap: spacing.sm,
    },
    deleteNote: {
      color: theme.secondary,
      textAlign: "center",
    },
  });
