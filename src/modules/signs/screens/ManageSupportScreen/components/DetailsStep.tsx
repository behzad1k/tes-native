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
import { useAppSelector } from "@/src/store/hooks";

interface DetailsStepProps {
  control: Control<SupportFormData, any, SupportFormData>;
  errors: any;
  trigger: any;
  getValues: () => SupportFormData;
}

const DetailsStep = ({ control }: DetailsStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  // Get setup options from Redux store
  const supportCodes = useAppSelector((state) => state.supports.codes);
  const positions = useAppSelector((state) => state.supports.positions);
  const conditions = useAppSelector((state) => state.supports.conditions);
  const materials = useAppSelector((state) => state.supports.materials);

  // Transform to select options
  const supportCodeOptions = supportCodes.map((code) => ({
    label: `${code.code} - ${code.name}`,
    value: code.id,
  }));

  const positionOptions = positions.map((pos) => ({
    label: pos.name,
    value: pos.id,
  }));

  const conditionOptions = conditions.map((cond) => ({
    label: cond.name,
    value: cond.id,
  }));

  const materialOptions = materials.map((mat) => ({
    label: mat.name,
    value: mat.id,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <FormSelectBox
          id="supportCode"
          label={`${t("signs.supportCode")} :`}
          control={control}
          name="codeId"
          options={supportCodeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.supportCode")}
          searchable={true}
          rules={{ required: t("validation.required") }}
        />

        <FormSelectBox
          id="position"
          label={`${t("position")} :`}
          control={control}
          name="positionId"
          options={positionOptions}
          placeholder={t("pressToSelect")}
          title={t("position")}
          searchable={true}
        />

        <FormSelectBox
          id="support-condition"
          label={`${t("signs.supportCondition")} :`}
          control={control}
          name="conditionId"
          options={conditionOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.supportCondition")}
          searchable={true}
          rules={{ required: t("validation.required") }}
        />

        <FormInput
          control={control}
          name="distanceFromShoulder"
          label={`${t("signs.distanceFromShoulder")} :`}
          keyboardType="numeric"
        />

        <FormInput
          control={control}
          name="note"
          label={`${t("note")} :`}
          multiline={true}
          numberOfLines={3}
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
