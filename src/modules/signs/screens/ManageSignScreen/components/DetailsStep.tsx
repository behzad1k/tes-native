import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import FormInput from "@/src/components/ui/FormInput";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { Control } from "react-hook-form";
import { SignFormData } from "../../../types";

interface DetailsStepProps {
  signFormControl: Control<SignFormData, any, SignFormData>;
}

const DetailsStep = ({ signFormControl }: DetailsStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const signTypeOptions = [
    { label: "test1", value: 1 },
    { label: "test2", value: 2 },
    { label: "test3", value: 3 },
    { label: "test4", value: 4 },
  ];
  const dimensions = [
    { label: "20 x 20", value: "20x20" },
    { label: "30 x 30", value: "30x30" },
  ];
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <FormSelectBox
          id={"signCode"}
          label={`${t("signs.signCode")} :`}
          control={signFormControl}
          name="signId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.signCode")}
        />
        <FormSelectBox
          id={"dimension"}
          label={`${t("dimension")} :`}
          control={signFormControl}
          name="dimensionId"
          options={dimensions}
          placeholder={t("pressToSelect")}
          title={t("dimension")}
        />
        <FormInput
          control={signFormControl}
          name="height"
          label={`${t("height")} :`}
        />
        <FormSelectBox
          id={"facing-direction"}
          label={`${t("signs.facingDirection")} :`}
          control={signFormControl}
          name="facingDirectionId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.facingDirection")}
        />
        <FormSelectBox
          id={"face-material"}
          label={`${t("signs.faceMaterial")} :`}
          control={signFormControl}
          name="faceMaterialId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.faceMaterial")}
        />
        <FormSelectBox
          id={"reflective-coating"}
          label={`${t("signs.reflectiveCoating")} :`}
          control={signFormControl}
          name="reflectiveCoatingId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.reflectiveCoating")}
        />
        <FormSelectBox
          id={"reflective-rating"}
          label={`${t("signs.reflectiveRating")} :`}
          control={signFormControl}
          name="reflectiveRatingId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.reflectiveRating")}
        />
        <FormSelectBox
          id={"sign-condition"}
          label={`${t("signs.signCondition")} :`}
          control={signFormControl}
          name="conditionId"
          options={signTypeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.signCondition")}
          searchable={true}
        />
        <FormInput
          control={signFormControl}
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
