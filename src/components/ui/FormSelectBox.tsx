import React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import SelectBoxView, { SelectBoxOption } from "./SelectBoxView";
import { ViewStyle, TextStyle } from "react-native";

interface FormSelectBoxProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  options: SelectBoxOption[];

  placeholder?: string;
  label?: string;
  labelStyle?: TextStyle;
  title?: string;
  titleStyle?: TextStyle;
  disabled?: boolean;

  loading?: boolean;
  loadingText?: string;
  loadingComponent?: React.ReactNode;

  // Style props
  containerStyle?: ViewStyle | ViewStyle[];
  selectBoxStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  iconStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  optionTextStyle?: TextStyle;
  selectedOptionStyle?: ViewStyle;
  selectedOptionTextStyle?: TextStyle;
  errorTextStyle?: TextStyle;
  loadingContainerStyle?: ViewStyle;

  accessibilityLabel?: string;
  accessibilityHint?: string;
  id?: string;

  fullWidth?: boolean;

  showDropdownIcon?: boolean;
  dropdownIcon?: React.ReactNode;

  closeOnSelect?: boolean;
  drawerHeight?: number | "auto";

  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;

  // React Hook Form specific
  rules?: any;
  defaultValue?: string | number | null;
}

function FormSelectBox<T extends FieldValues>({
  name,
  control,
  rules,
  defaultValue,
  ...selectBoxProps
}: FormSelectBoxProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      defaultValue={defaultValue as any}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <SelectBoxView
          {...selectBoxProps}
          value={value}
          onChange={onChange}
          error={!!error}
          errorMessage={error?.message}
        />
      )}
    />
  );
}

export default FormSelectBox;
