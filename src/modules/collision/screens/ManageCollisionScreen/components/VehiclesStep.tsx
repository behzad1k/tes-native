import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Control, UseFormGetValues, UseFormSetValue } from "react-hook-form";
import { useThemedStyles } from "@/src/hooks/useThemedStyles";
import { Theme } from "@/src/types/theme";
import { spacing } from "@/src/styles/theme/spacing";
import { useTranslation } from "react-i18next";
import TextView from "@/src/components/ui/TextView";
import TextInputView from "@/src/components/ui/TextInputView";
import ButtonView from "@/src/components/ui/ButtonView";
import { CollisionFormData, getNextVehicleIndex } from "../../../types";
import { CollisionVehicle } from "@/src/types/models";
import { useCollisionFields } from "../../../hooks/useCollisionOperations";
import { colors } from "@/src/styles/theme/colors";
import { Trash, PencilSimple, Plus, Car } from "phosphor-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { v4 as uuidv4 } from "uuid";

interface VehiclesStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
}

const VehiclesStep = ({
  control,
  errors,
  getValues,
  setValue,
}: VehiclesStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { vehicleFields } = useCollisionFields();
  const { openDrawer, closeDrawer } = useDrawer();

  const vehicles = getValues("vehicles") || [];

  // New vehicle form state
  const [newVehicleIndex, setNewVehicleIndex] = useState(
    String(getNextVehicleIndex(vehicles)),
  );
  const [newVehicleData, setNewVehicleData] = useState<Record<string, any>>({});

  // Reset new vehicle form
  const resetNewVehicleForm = () => {
    setNewVehicleIndex(
      String(getNextVehicleIndex(getValues("vehicles") || [])),
    );
    setNewVehicleData({});
  };

  // Add vehicle
  const handleAddVehicle = () => {
    if (!newVehicleIndex.trim()) {
      Alert.alert(t("error"), t("collision.vehicleIndexRequired"));
      return;
    }

    const newVehicle: CollisionVehicle = {
      id: uuidv4(),
      index: newVehicleIndex,
      ...newVehicleData,
    };

    const currentVehicles = getValues("vehicles") || [];
    setValue("vehicles", [...currentVehicles, newVehicle]);
    resetNewVehicleForm();
  };

  // Remove vehicle
  const handleRemoveVehicle = (vehicleId: string) => {
    // Check if any persons are associated with this vehicle
    const persons = getValues("persons") || [];
    const associatedPersons = persons.filter((p) => p.vehicleId === vehicleId);

    if (associatedPersons.length > 0) {
      Alert.alert(
        t("warning"),
        t("collision.vehicleHasPersons", { count: associatedPersons.length }),
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("delete"),
            style: "destructive",
            onPress: () => {
              // Remove vehicle
              const currentVehicles = getValues("vehicles") || [];
              setValue(
                "vehicles",
                currentVehicles.filter((v) => v.id !== vehicleId),
              );
              // Remove associated persons
              setValue(
                "persons",
                persons.filter((p) => p.vehicleId !== vehicleId),
              );
            },
          },
        ],
      );
    } else {
      Alert.alert(t("warning"), t("collision.confirmDeleteVehicle"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: () => {
            const currentVehicles = getValues("vehicles") || [];
            setValue(
              "vehicles",
              currentVehicles.filter((v) => v.id !== vehicleId),
            );
          },
        },
      ]);
    }
  };

  // Edit vehicle (opens drawer with form)
  const handleEditVehicle = (vehicle: CollisionVehicle) => {
    openDrawer(
      "edit-vehicle",
      <EditVehicleForm
        vehicle={vehicle}
        vehicleFields={vehicleFields}
        onSave={(updatedVehicle) => {
          const currentVehicles = getValues("vehicles") || [];
          setValue(
            "vehicles",
            currentVehicles.map((v) =>
              v.id === updatedVehicle.id ? updatedVehicle : v,
            ),
          );
          closeDrawer();
        }}
        onCancel={() => closeDrawer()}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle field change for new vehicle
  const handleNewVehicleFieldChange = (fieldName: string, value: any) => {
    setNewVehicleData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Get persons count for a vehicle
  const getPersonsCount = (vehicleId: string) => {
    const persons = getValues("persons") || [];
    return persons.filter((p) => p.vehicleId === vehicleId).length;
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Add New Vehicle Form */}
      <View style={styles.formSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.addVehicle")}
        </TextView>

        {/* Vehicle Index */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.vehicleIndex")}:
            <TextView style={styles.required}>*</TextView>
          </TextView>
          <TextInputView
            value={newVehicleIndex}
            onChangeText={setNewVehicleIndex}
            keyboardType="numeric"
            placeholder={t("collision.enterVehicleIndex")}
          />
        </View>

        {/* Dynamic Vehicle Fields */}
        {vehicleFields.map((field) => (
          <View key={field.name} style={styles.fieldContainer}>
            <TextView style={styles.label}>
              {field.labelText}:
              {field.isRequired && (
                <TextView style={styles.required}>*</TextView>
              )}
            </TextView>
            {field.fieldType === 1 && (
              <TextInputView
                value={newVehicleData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewVehicleFieldChange(field.name, value)
                }
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                autoCapitalize={field.isUpperCase ? "characters" : "none"}
              />
            )}
            {field.fieldType === 2 && (
              <TextInputView
                value={newVehicleData[field.name]?.toString() || ""}
                onChangeText={(value) =>
                  handleNewVehicleFieldChange(
                    field.name,
                    value ? Number(value) : undefined,
                  )
                }
                keyboardType="numeric"
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
              />
            )}
            {field.fieldType === 9 && (
              <TextInputView
                value={newVehicleData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewVehicleFieldChange(field.name, value)
                }
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                multiline
                numberOfLines={3}
              />
            )}
          </View>
        ))}

        <ButtonView
          variant="primary"
          onPress={handleAddVehicle}
          style={styles.addButton}
        >
          <Plus size={20} color={colors.white} />
          <TextView style={styles.addButtonText}>{t("add")}</TextView>
        </ButtonView>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Vehicles List */}
      <View style={styles.listSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.vehicles")} ({vehicles.length})
        </TextView>

        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={48} color={colors.lightGrey} />
            <TextView style={styles.emptyText}>
              {t("collision.noVehicles")}
            </TextView>
          </View>
        ) : (
          vehicles.map((vehicle) => {
            const personsCount = getPersonsCount(vehicle.id);
            return (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    <Car size={24} color={colors.lightGreen} />
                  </View>
                  <View style={styles.cardContent}>
                    <TextView style={styles.cardTitle}>
                      Vehicle #{vehicle.index}
                    </TextView>
                    {personsCount > 0 && (
                      <TextView style={styles.personsCount}>
                        {personsCount} {t("collision.persons")}
                      </TextView>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditVehicle(vehicle)}
                    >
                      <PencilSimple size={20} color={colors.lightGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRemoveVehicle(vehicle.id)}
                    >
                      <Trash size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  {Object.entries(vehicle)
                    .filter(([key]) => !["id", "index"].includes(key))
                    .slice(0, 4)
                    .map(([key, value]) => (
                      <View key={key} style={styles.detailRow}>
                        <TextView style={styles.detailLabel}>{key}:</TextView>
                        <TextView style={styles.detailValue} numberOfLines={1}>
                          {String(value)}
                        </TextView>
                      </View>
                    ))}
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

// Edit Vehicle Form Component
interface EditVehicleFormProps {
  vehicle: CollisionVehicle;
  vehicleFields: any[];
  onSave: (vehicle: CollisionVehicle) => void;
  onCancel: () => void;
}

const EditVehicleForm = ({
  vehicle,
  vehicleFields,
  onSave,
  onCancel,
}: EditVehicleFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [editedVehicle, setEditedVehicle] = useState<CollisionVehicle>({
    ...vehicle,
  });

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedVehicle((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <ScrollView style={styles.editForm}>
      <TextView style={styles.editFormTitle}>
        {t("collision.editVehicle")}
      </TextView>

      <View style={styles.fieldContainer}>
        <TextView style={styles.label}>
          {t("collision.vehicleIndex")}:*
        </TextView>
        <TextInputView
          value={editedVehicle.index}
          onChangeText={(value) => handleFieldChange("index", value)}
          keyboardType="numeric"
        />
      </View>

      {vehicleFields.map((field) => (
        <View key={field.name} style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {field.labelText}:
            {field.isRequired && <TextView style={styles.required}>*</TextView>}
          </TextView>
          <TextInputView
            value={editedVehicle[field.name]?.toString() || ""}
            onChangeText={(value) => handleFieldChange(field.name, value)}
            keyboardType={field.fieldType === 2 ? "numeric" : "default"}
            autoCapitalize={field.isUpperCase ? "characters" : "none"}
            multiline={field.fieldType === 9}
            numberOfLines={field.fieldType === 9 ? 3 : 1}
          />
        </View>
      ))}

      <View style={styles.editFormActions}>
        <ButtonView
          variant="outline"
          onPress={onCancel}
          style={styles.editFormButton}
        >
          {t("cancel")}
        </ButtonView>
        <ButtonView
          variant="primary"
          onPress={() => onSave(editedVehicle)}
          style={styles.editFormButton}
        >
          {t("save")}
        </ButtonView>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.md,
      paddingBottom: 100,
    },
    formSection: {
      marginBottom: spacing.md,
    },
    listSection: {
      marginTop: spacing.md,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.md,
    },
    fieldContainer: {
      marginBottom: spacing.md,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.text,
      marginBottom: spacing.xs,
    },
    required: {
      color: colors.error,
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    addButtonText: {
      color: colors.white,
      fontWeight: "600",
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: spacing.lg,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      borderStyle: "dashed",
      gap: spacing.sm,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    vehicleCard: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
    },
    cardIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.lightGreen}20`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.sm,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    personsCount: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    actionButton: {
      padding: spacing.xs,
    },
    cardDetails: {
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      width: 100,
    },
    detailValue: {
      fontSize: 12,
      color: theme.text,
      flex: 1,
    },
    editForm: {
      padding: spacing.md,
      maxHeight: 500,
    },
    editFormTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.lg,
    },
    editFormActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.sm,
      marginTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    editFormButton: {
      minWidth: 100,
    },
  });

export default VehiclesStep;
