import React, { useState } from "react";
import { View, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { CollisionField, CollisionFieldType } from "@/src/types/models";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  formatISODate,
  formatISODateTime,
  generateCollisionNumber,
} from "../../../types";

interface DynamicFieldRendererProps<T extends FieldValues> {
  field: CollisionField;
  control: Control<T>;
  name: Path<T>;
  value?: any;
  onChange?: (value: any) => void;
  errors?: any;
}

function DynamicFieldRenderer<T extends FieldValues>({
  field,
  control,
  name,
  value,
  onChange,
  errors,
}: DynamicFieldRendererProps<T>) {
  const styles = useThemedStyles(createStyles);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const renderLabel = () => (
    <View style={styles.labelContainer}>
      <TextView style={styles.label}>
        {field.labelText}:
        {field.isRequired && <TextView style={styles.required}>*</TextView>}
      </TextView>
      {field.description && (
        <TextView style={styles.description}>({field.description})</TextView>
      )}
    </View>
  );

  // Text Input (fieldType 1)
  if (field.fieldType === CollisionFieldType.TEXT) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TextInputView
                value={fieldValue || ""}
                onChangeText={onFieldChange}
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                autoCapitalize={field.isUpperCase ? "characters" : "none"}
                error={errors?.[name]?.message}
              />
            </>
          )}
        />
      </View>
    );
  }

  // Number Input (fieldType 2)
  if (field.fieldType === CollisionFieldType.NUMBER) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TextInputView
                value={fieldValue?.toString() || ""}
                onChangeText={(text) =>
                  onFieldChange(text ? Number(text) : undefined)
                }
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                keyboardType="numeric"
                error={errors?.[name]?.message}
              />
            </>
          )}
        />
      </View>
    );
  }

  // Switch/Toggle (fieldType 3)
  if (field.fieldType === CollisionFieldType.SWITCH) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <View style={styles.switchContainer}>
              {renderLabel()}
              <Switch
                value={!!fieldValue}
                onValueChange={onFieldChange}
                trackColor={{
                  false: colors.placeholder,
                  true: colors.lightGreen,
                }}
                thumbColor={colors.white}
              />
            </View>
          )}
        />
      </View>
    );
  }

  // Date Picker (fieldType 4)
  if (field.fieldType === CollisionFieldType.DATE) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <TextView
                  style={fieldValue ? styles.dateText : styles.datePlaceholder}
                >
                  {fieldValue
                    ? formatISODate(new Date(fieldValue))
                    : `Select ${field.labelText.toLowerCase()}`}
                </TextView>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  onFieldChange(date.toISOString());
                }}
                onCancel={() => setShowDatePicker(false)}
              />
              {errors?.[name]?.message && (
                <TextView style={styles.errorText}>
                  {errors[name].message}
                </TextView>
              )}
            </>
          )}
        />
      </View>
    );
  }

  // Time Picker (fieldType 5)
  if (field.fieldType === CollisionFieldType.TIME) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <TextView
                  style={fieldValue ? styles.dateText : styles.datePlaceholder}
                >
                  {fieldValue
                    ? new Date(fieldValue).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : `Select ${field.labelText.toLowerCase()}`}
                </TextView>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="time"
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  onFieldChange(date.toISOString());
                }}
                onCancel={() => setShowDatePicker(false)}
              />
              {errors?.[name]?.message && (
                <TextView style={styles.errorText}>
                  {errors[name].message}
                </TextView>
              )}
            </>
          )}
        />
      </View>
    );
  }

  // DateTime Picker (fieldType 6)
  if (field.fieldType === CollisionFieldType.DATETIME) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <TextView
                  style={fieldValue ? styles.dateText : styles.datePlaceholder}
                >
                  {fieldValue
                    ? formatISODateTime(new Date(fieldValue))
                    : `Select ${field.labelText.toLowerCase()}`}
                </TextView>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="datetime"
                onConfirm={(date) => {
                  setShowDatePicker(false);
                  onFieldChange(date.toISOString());
                }}
                onCancel={() => setShowDatePicker(false)}
              />
              {errors?.[name]?.message && (
                <TextView style={styles.errorText}>
                  {errors[name].message}
                </TextView>
              )}
            </>
          )}
        />
      </View>
    );
  }

  // Select/Dropdown (fieldType 7)
  if (field.fieldType === CollisionFieldType.SELECT) {
    const options =
      field.fieldValues?.map((fv) => ({
        label: fv.name,
        value: fv.id,
      })) || [];

    return (
      <View style={styles.fieldContainer}>
        <FormSelectBox
          control={control}
          name={name}
          label={`${field.labelText}:${field.isRequired ? " *" : ""}`}
          options={options}
          placeholder={`Select ${field.labelText.toLowerCase()}`}
          title={field.labelText}
          searchable={options.length > 5}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
        />
      </View>
    );
  }

  // Auto-generate (fieldType 8)
  if (field.fieldType === CollisionFieldType.AUTO_GENERATE) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => {
            // Auto-generate if no value
            if (!fieldValue) {
              const generated = generateCollisionNumber();
              setTimeout(() => onFieldChange(generated), 0);
            }

            return (
              <>
                {renderLabel()}
                <TextInputView
                  value={fieldValue || ""}
                  onChangeText={onFieldChange}
                  editable={false}
                  style={styles.readOnlyInput}
                />
              </>
            );
          }}
        />
      </View>
    );
  }

  // Textarea (fieldType 9)
  if (field.fieldType === CollisionFieldType.TEXTAREA) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <TextInputView
                value={fieldValue || ""}
                onChangeText={onFieldChange}
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                multiline
                numberOfLines={4}
                style={styles.textareaInput}
                error={errors?.[name]?.message}
              />
            </>
          )}
        />
      </View>
    );
  }

  // Integration field (fieldType 10) - Text with fetch button
  if (field.fieldType === CollisionFieldType.INTEGRATION) {
    return (
      <View style={styles.fieldContainer}>
        <Controller
          control={control}
          name={name}
          rules={
            field.isRequired
              ? { required: `${field.labelText} is required` }
              : undefined
          }
          render={({
            field: { onChange: onFieldChange, value: fieldValue },
          }) => (
            <>
              {renderLabel()}
              <View style={styles.integrationContainer}>
                <TextInputView
                  value={fieldValue || ""}
                  onChangeText={onFieldChange}
                  placeholder={`Enter ${field.labelText.toLowerCase()}`}
                  autoCapitalize={field.isUpperCase ? "characters" : "none"}
                  containerStyle={styles.integrationInput}
                  error={errors?.[name]?.message}
                />
                <TouchableOpacity style={styles.fetchButton}>
                  <TextView style={styles.fetchButtonText}>Fetch</TextView>
                </TouchableOpacity>
              </View>
            </>
          )}
        />
      </View>
    );
  }

  // Fallback - unknown field type
  return (
    <View style={styles.fieldContainer}>
      {renderLabel()}
      <TextView style={styles.unknownField}>
        Unknown field type: {field.fieldType}
      </TextView>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    fieldContainer: {
      marginBottom: spacing.md,
    },
    labelContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: spacing.xs,
      gap: 4,
    },
    label: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "500",
    },
    required: {
      color: colors.error,
    },
    description: {
      fontSize: 12,
      color: colors.lightGreen,
    },
    switchContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 4,
      padding: spacing.sm,
      backgroundColor: theme.background,
    },
    dateText: {
      color: theme.text,
      fontSize: 14,
    },
    datePlaceholder: {
      color: colors.placeholder,
      fontSize: 14,
    },
    errorText: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    readOnlyInput: {
      backgroundColor: colors.disabled,
    },
    textareaInput: {
      height: 100,
      textAlignVertical: "top",
    },
    integrationContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.xs,
    },
    integrationInput: {
      flex: 1,
    },
    fetchButton: {
      backgroundColor: colors.lightGreen,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 4,
      marginTop: spacing.xs,
    },
    fetchButtonText: {
      color: colors.white,
      fontWeight: "600",
      fontSize: 14,
    },
    unknownField: {
      color: colors.error,
      fontStyle: "italic",
    },
  });

export default DynamicFieldRenderer;
