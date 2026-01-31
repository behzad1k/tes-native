import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import FormInput from "@/src/components/ui/FormInput";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { Control } from "react-hook-form";
import { SupportFormData } from "../../../types";

interface DetailsStepProps {
  supportFormControl: Control<SupportFormData, any, SupportFormData>;
}

const DetailsStep = ({ supportFormControl }: DetailsStepProps) => {
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
        <FormSelectBox
          id={"supportCode"}
          label={`${t("signs.supportCode")} :`}
          control={supportFormControl}
          name="codeId"
          options={supportTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.supportCode")}
        />
        <FormSelectBox
          id={"position"}
          label={`${t("position")} :`}
          control={supportFormControl}
          name="positionId"
          options={supportTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("position")}
        />
        <FormSelectBox
          id={"support-condition"}
          label={`${t("signs.supportCondition")} :`}
          control={supportFormControl}
          name="conditionId"
          options={supportTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.supportCondition")}
          searchable={true}
        />
        <FormInput
          control={supportFormControl}
          name="note"
          label={`${t("note")} :`}
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
      flex: 1,
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

export default DetailsStep;
