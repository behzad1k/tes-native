import React, { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import SelectBoxView from "@/src/components/ui/SelectBoxView";
import { spacing } from "@/src/styles/theme/spacing";
import { SignType, SignCondition, CreateSignRequest } from "../types";
import ButtonView from "@/src/components/ui/ButtonView";

interface SignFormProps {
  initialData?: Partial<CreateSignRequest>;
  onSubmit: (data: CreateSignRequest) => void;
  loading?: boolean;
}

export function SignForm({ initialData, onSubmit, loading }: SignFormProps) {
  const styles = useThemedStyles(createStyles);

  const [signType, setSignType] = useState<SignType>(
    initialData?.signType || "stop",
  );
  const [condition, setCondition] = useState<SignCondition>(
    initialData?.condition || "good",
  );
  const [latitude, setLatitude] = useState(
    initialData?.location?.lat?.toString() || "",
  );
  const [longitude, setLongitude] = useState(
    initialData?.location?.lng?.toString() || "",
  );
  const [address, setAddress] = useState(initialData?.address || "");
  const [notes, setNotes] = useState(initialData?.notes || "");

  const signTypeOptions = [
    { label: "Stop Sign", value: "stop" },
    { label: "Yield Sign", value: "yield" },
    { label: "Speed Limit", value: "speed_limit" },
    { label: "No Parking", value: "no_parking" },
    { label: "One Way", value: "one_way" },
    { label: "Other", value: "other" },
  ];

  const conditionOptions = [
    { label: "Good", value: "good" },
    { label: "Fair", value: "fair" },
    { label: "Poor", value: "poor" },
    { label: "Damaged", value: "damaged" },
  ];

  const handleSubmit = () => {
    const data: CreateSignRequest = {
      signType,
      location: {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
      },
      condition,
      address: address || undefined,
      notes: notes || undefined,
    };

    onSubmit(data);
  };

  const isValid =
    signType &&
    condition &&
    latitude &&
    longitude &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <View style={styles.field}>
          <TextView variant="label" style={styles.label}>
            Sign Type *
          </TextView>
          <SelectBoxView
            options={signTypeOptions}
            value={signType}
            onChange={(value) => setSignType(value as SignType)}
            placeholder="Select sign type"
          />
        </View>

        <View style={styles.field}>
          <TextView variant="label" style={styles.label}>
            Condition *
          </TextView>
          <SelectBoxView
            options={conditionOptions}
            value={condition}
            onChange={(value) => setCondition(value as SignCondition)}
            placeholder="Select condition"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.halfWidth]}>
            <TextView variant="label" style={styles.label}>
              Latitude *
            </TextView>
            <TextInputView
              value={latitude}
              onChangeText={setLatitude}
              placeholder="40.7128"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.field, styles.halfWidth]}>
            <TextView variant="label" style={styles.label}>
              Longitude *
            </TextView>
            <TextInputView
              value={longitude}
              onChangeText={setLongitude}
              placeholder="-74.0060"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.field}>
          <TextView variant="label" style={styles.label}>
            Address
          </TextView>
          <TextInputView
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State"
            multiline
          />
        </View>

        <View style={styles.field}>
          <TextView variant="label" style={styles.label}>
            Notes
          </TextView>
          <TextInputView
            value={notes}
            onChangeText={setNotes}
            placeholder="Additional notes..."
            multiline
            numberOfLines={4}
          />
        </View>

        <ButtonView
          onPress={handleSubmit}
          disabled={!isValid || loading}
          loading={loading}
        >
          {initialData ? "Update Sign" : "Create Sign"}
        </ButtonView>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    form: {
      padding: spacing.md,
      gap: spacing.md,
    },
    field: {
      gap: spacing.xs,
    },
    label: {
      color: theme.text,
    },
    row: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    halfWidth: {
      flex: 1,
    },
  });
