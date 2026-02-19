import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import FormInput from "@/src/components/ui/FormInput";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { Control } from "react-hook-form";
import { SignFormData } from "../types";
import { useAppSelector } from "@/src/store/hooks";

interface DetailsStepProps {
  control: Control<SignFormData, any, SignFormData>;
  errors: any;
  trigger: any;
  getValues: () => SignFormData;
}

const SignDetailsStep = ({ control }: DetailsStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();

  // Get setup options from Redux store
  const signCodes = useAppSelector((state) => state.signs.codes);
  const dimensions = useAppSelector((state) => state.signs.dimensions);
  const facingDirections = useAppSelector(
    (state) => state.signs.facingDirections,
  );
  const faceMaterials = useAppSelector((state) => state.signs.faceMaterials);
  const reflectiveCoatings = useAppSelector(
    (state) => state.signs.reflectiveCoatings,
  );
  const reflectiveRatings = useAppSelector(
    (state) => state.signs.reflectiveRatings,
  );
  const conditions = useAppSelector((state) => state.signs.conditions);

  // Transform to select options
  const signCodeOptions = signCodes.map((code) => ({
    label: `${code.code} - ${code.name}`,
    value: code.id,
  }));

  const dimensionOptions = dimensions.map((dim) => ({
    label: dim.name,
    value: dim.id,
  }));

  const facingDirectionOptions = facingDirections.map((dir) => ({
    label: dir.name,
    value: dir.id,
  }));

  const faceMaterialOptions = faceMaterials.map((mat) => ({
    label: mat.name,
    value: mat.id,
  }));

  const reflectiveCoatingOptions = reflectiveCoatings.map((coating) => ({
    label: coating.name,
    value: coating.id,
  }));

  const reflectiveRatingOptions = reflectiveRatings.map((rating) => ({
    label: rating.name,
    value: rating.id,
  }));

  const conditionOptions = conditions.map((cond) => ({
    label: cond.name,
    value: cond.id,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.form}>
        <FormSelectBox
          id="signCode"
          label={`${t("signs.signCode")} :`}
          control={control}
          name="signCodeId"
          options={signCodeOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.signCode")}
          searchable={true}
          rules={{ required: t("validation.required") }}
        />

        <FormSelectBox
          id="dimension"
          label={`${t("dimension")} :`}
          control={control}
          name="dimensionId"
          options={dimensionOptions}
          placeholder={t("pressToSelect")}
          title={t("dimension")}
          searchable={true}
          rules={{ required: t("validation.required") }}
        />

        <FormInput
          control={control}
          name="height"
          label={`${t("height")} :`}
          keyboardType="numeric"
          rules={{ required: t("validation.required") }}
        />

        <FormSelectBox
          id="facing-direction"
          label={`${t("signs.facingDirection")} :`}
          control={control}
          name="facingDirectionId"
          options={facingDirectionOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.facingDirection")}
          searchable={true}
        />

        <FormSelectBox
          id="face-material"
          label={`${t("signs.faceMaterial")} :`}
          control={control}
          name="faceMaterialId"
          options={faceMaterialOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.faceMaterial")}
          searchable={true}
        />

        <FormSelectBox
          id="reflective-coating"
          label={`${t("signs.reflectiveCoating")} :`}
          control={control}
          name="reflectiveCoatingId"
          options={reflectiveCoatingOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.reflectiveCoating")}
          searchable={true}
        />

        <FormSelectBox
          id="reflective-rating"
          label={`${t("signs.reflectiveRating")} :`}
          control={control}
          name="reflectiveRatingId"
          options={reflectiveRatingOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.reflectiveRating")}
          searchable={true}
        />

        <FormSelectBox
          id="sign-condition"
          label={`${t("signs.signCondition")} :`}
          control={control}
          name="conditionId"
          options={conditionOptions}
          placeholder={t("pressToSelect")}
          title={t("signs.signCondition")}
          searchable={true}
          rules={{ required: t("validation.required") }}
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

export default SignDetailsStep;
