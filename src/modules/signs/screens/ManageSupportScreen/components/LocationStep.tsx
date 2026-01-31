import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import TextInputView from "@/src/components/ui/TextInputView";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import FormInput from "@/src/components/ui/FormInput";
import { Control } from "react-hook-form";
import { SupportFormData } from "../../../types";

interface LocationStepProps {
  supportFormControl: Control<SupportFormData, any, SupportFormData>;
}

const LocationStep = ({ supportFormControl }: LocationStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  const supportTypeOptions = [
    { label: "test1", value: 1 },
    { label: "test2", value: 2 },
    { label: "test3", value: 3 },
    { label: "test4", value: 4 },
  ];
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <FormInput
          control={supportFormControl}
          name="locationType"
          label={`${t("signs.locationType")} :`}
        />
        <FormInput
          control={supportFormControl}
          name="longitude"
          label={`${t("longitude")} :`}
        />
        <FormInput
          control={supportFormControl}
          name="latitude"
          label={`${t("latitude")} :`}
        />
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    form: {
      padding: spacing.md,
      paddingTop: 0,
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

export default LocationStep;
