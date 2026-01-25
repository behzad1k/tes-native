import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import ButtonView from "@/src/components/ui/ButtonView";
import TextView from "@/src/components/ui/TextView";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { useLanguage } from "@/src/hooks/useLanguage";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { colors } from "@/src/styles/theme/colors";
import { Entypo } from "@expo/vector-icons";
import { LoginFormData } from "../../../types";
import FormInput from "@/src/components/ui/FormInput";
import validations from "@/src/constants/validation";
import { useForm } from "react-hook-form";

interface LoginFormProps {
  onSubmit: (credentials: LoginFormData) => void;
  onForgotPassword: () => void;
  loading?: boolean;
}

export default function LoginForm({
  onSubmit,
  onForgotPassword,
  loading = false,
}: LoginFormProps) {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    setError,
    reset,
  } = useForm<LoginFormData>({
    defaultValues: {
      username: "",
      password: "",
    },
    mode: "onChange",
  });

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <FormInput
            control={control}
            name="username"
            label={t("auth.username")}
            placeholder={t("auth.usernamePlaceholder")}
            rules={{
              required: "Username is required",
              minLength: 4,
              maxLength: 16,
            }}
          />
        </View>

        <View style={styles.inputContainer}>
          <FormInput
            control={control}
            name="password"
            label={t("auth.password")}
            placeholder={t("auth.passwordPlaceholder")}
            secureTextEntry
            rules={{
              required: "Password is required",
              minLength: validations.password.minLength,
              maxLength: validations.password.maxLength,
              validate: validations.validatePassword,
            }}
            icon={
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Entypo
                  name={showPassword ? "eye" : "eye-with-line"}
                  size={24}
                  color={colors.lightGreen}
                />
              </TouchableOpacity>
            }
          />
        </View>
        {/* Form-level error */}
        {errors.root && (
          <View
            style={{
              marginBottom: 15,
              padding: 10,
              backgroundColor: "#ffebee",
              borderRadius: 5,
            }}
          >
            <TextView style={{ color: "#c62828", fontSize: 14 }}>
              {errors.root.message}
            </TextView>
          </View>
        )}

        {/* Show dirty state hint */}
        {isDirty && !isValid && (
          <TextView
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#666",
              textAlign: "center",
            }}
          >
            Please fix validation errors to continue
          </TextView>
        )}

        <ButtonView
          onPress={handleSubmit(onSubmit)}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          {t("auth.login")}
        </ButtonView>

        <TouchableOpacity
          onPress={onForgotPassword}
          style={styles.forgotPassword}
          disabled={loading}
        >
          <TextView variant="body" style={styles.forgotPasswordText}>
            {t("auth.forgotPassword")}
          </TextView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: spacing.lg,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    form: {
      gap: spacing.md,
    },
    inputContainer: {
      position: "relative",
      flexDirection: "row",
      width: "100%",
      flex: 1,
    },
    eyeIcon: {
      position: "absolute",
      right: spacing.md,
      padding: spacing.xs,
    },
    submitButton: {
      marginTop: spacing.md,
    },
    forgotPassword: {
      alignItems: "center",
      marginTop: spacing.sm,
    },
    forgotPasswordText: {
      color: colors.lightGreen,
      fontWeight: "600",
    },
  });
