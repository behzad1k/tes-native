import React, { ReactElement } from "react";
import { ViewStyle, TextInputProps } from "react-native";
import { Controller, Control } from "react-hook-form";
import TextInputView from "./TextInputView";

interface FormInputProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label?: string;
  rules?: any;
  containerStyle?: ViewStyle;
  icon?: ReactElement;
}

const FormInput: React.FC<FormInputProps> = ({
  control,
  name,
  label,
  rules,
  containerStyle = {},
  icon,
  ...props
}) => {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({
        field: { onChange, value, onBlur },
        fieldState: { error },
      }) => (
        <TextInputView
          value={value}
          label={label}
          onChangeText={onChange}
          onBlur={onBlur}
          containerStyle={containerStyle}
          error={error?.message}
          {...props}
        />
      )}
    />
  );
};
export default FormInput;
