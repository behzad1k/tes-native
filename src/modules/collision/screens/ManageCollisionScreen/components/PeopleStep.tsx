import React, { useState, useMemo } from "react";
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
import FormSelectBox from "@/src/components/ui/FormSelectBox";
import { CollisionFormData } from "../../../types";
import { CollisionPerson, InvolvedAsType } from "@/src/types/models";
import { useCollisionFields } from "../../../hooks/useCollisionOperations";
import { colors } from "@/src/styles/theme/colors";
import {
  Trash,
  PencilSimple,
  Plus,
  User,
  Car,
  PersonSimpleWalk,
  UsersThree,
} from "phosphor-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { v4 as uuidv4 } from "uuid";
import SelectBoxView from "@/src/components/ui/SelectBoxView";

interface PeopleStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
}

// Involved As Options
const INVOLVED_AS_OPTIONS = [
  { label: "Driver", value: InvolvedAsType.DRIVER },
  { label: "Passenger", value: InvolvedAsType.PASSENGER },
  { label: "Pedestrian", value: InvolvedAsType.PEDESTRIAN },
  { label: "Other", value: InvolvedAsType.OTHER_PEOPLE },
];

const PeopleStep = ({
  control,
  errors,
  getValues,
  setValue,
}: PeopleStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { driverFields, passengerFields, pedestrianFields } =
    useCollisionFields();
  const { openDrawer, closeDrawer } = useDrawer();

  const persons = getValues("persons") || [];
  const vehicles = getValues("vehicles") || [];

  // New person form state
  const [newInvolvedAs, setNewInvolvedAs] = useState<InvolvedAsType>(
    InvolvedAsType.DRIVER,
  );
  const [newVehicleId, setNewVehicleId] = useState<string>("");
  const [newPersonData, setNewPersonData] = useState<Record<string, any>>({});

  // Vehicle options for select
  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        label: `Vehicle #${v.index}`,
        value: v.id,
      })),
    [vehicles],
  );

  // Get fields based on involved type
  const getFieldsForType = (type: InvolvedAsType) => {
    switch (type) {
      case InvolvedAsType.DRIVER:
        return driverFields;
      case InvolvedAsType.PASSENGER:
        return passengerFields;
      case InvolvedAsType.PEDESTRIAN:
        return pedestrianFields;
      case InvolvedAsType.OTHER_PEOPLE:
      // default:
      // return otherPeopleFields;
    }
  };

  // Check if vehicle selection is required
  const requiresVehicle = (type: InvolvedAsType) =>
    type === InvolvedAsType.DRIVER || type === InvolvedAsType.PASSENGER;

  // Reset new person form
  const resetNewPersonForm = () => {
    setNewInvolvedAs(InvolvedAsType.DRIVER);
    setNewVehicleId("");
    setNewPersonData({});
  };

  // Add person
  const handleAddPerson = () => {
    // Validate vehicle selection for driver/passenger
    if (requiresVehicle(newInvolvedAs) && !newVehicleId) {
      Alert.alert(t("error"), t("collision.vehicleRequired"));
      return;
    }

    // Check if vehicle already has a driver
    if (newInvolvedAs === InvolvedAsType.DRIVER && newVehicleId) {
      const existingDriver = persons.find(
        (p) =>
          p.vehicleId === newVehicleId &&
          p.involvedAs === InvolvedAsType.DRIVER,
      );
      if (existingDriver) {
        Alert.alert(t("error"), t("collision.vehicleHasDriver"));
        return;
      }
    }

    const newPerson: CollisionPerson = {
      id: uuidv4(),
      involvedAs: newInvolvedAs,
      vehicleId: requiresVehicle(newInvolvedAs) ? newVehicleId : undefined,
      ...newPersonData,
    };

    const currentPersons = getValues("persons") || [];
    setValue("persons", [...currentPersons, newPerson]);
    resetNewPersonForm();
  };

  // Remove person
  const handleRemovePerson = (personId: string) => {
    Alert.alert(t("warning"), t("collision.confirmDeletePerson"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const currentPersons = getValues("persons") || [];
          setValue(
            "persons",
            currentPersons.filter((p) => p.id !== personId),
          );
        },
      },
    ]);
  };

  // Edit person (opens drawer with form)
  const handleEditPerson = (person: CollisionPerson) => {
    openDrawer(
      "edit-person",
      <EditPersonForm
        person={person}
        vehicles={vehicles}
        getFieldsForType={getFieldsForType}
        onSave={(updatedPerson) => {
          const currentPersons = getValues("persons") || [];
          setValue(
            "persons",
            currentPersons.map((p) =>
              p.id === updatedPerson.id ? updatedPerson : p,
            ),
          );
          closeDrawer();
        }}
        onCancel={() => closeDrawer()}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle field change for new person
  const handleNewPersonFieldChange = (fieldName: string, value: any) => {
    setNewPersonData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // Get icon for involved type
  const getTypeIcon = (type: InvolvedAsType) => {
    switch (type) {
      case InvolvedAsType.DRIVER:
        return <Car size={20} color={colors.lightGreen} />;
      case InvolvedAsType.PASSENGER:
        return <UsersThree size={20} color={colors.info} />;
      case InvolvedAsType.PEDESTRIAN:
        return <PersonSimpleWalk size={20} color={colors.warning} />;
      default:
        return <User size={20} color={colors.lightGrey} />;
    }
  };

  // Get label for involved type
  const getTypeLabel = (type: InvolvedAsType) => {
    switch (type) {
      case InvolvedAsType.DRIVER:
        return t("collision.driver");
      case InvolvedAsType.PASSENGER:
        return t("collision.passenger");
      case InvolvedAsType.PEDESTRIAN:
        return t("collision.pedestrian");
      default:
        return t("collision.other");
    }
  };

  // Get vehicle label
  const getVehicleLabel = (vehicleId?: string) => {
    if (!vehicleId) return null;
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `Vehicle #${vehicle.index}` : null;
  };

  // Current fields based on selected type
  const currentFields = getFieldsForType(newInvolvedAs);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Add New Person Form */}
      <View style={styles.formSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.addPerson")}
        </TextView>

        {/* Involved As Select */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.involvedAs")}:
            <TextView style={styles.required}>*</TextView>
          </TextView>
          <SelectBoxView
            options={INVOLVED_AS_OPTIONS}
            value={newInvolvedAs}
            onChange={(value) => {
              setNewInvolvedAs(value as InvolvedAsType);
              setNewVehicleId("");
              setNewPersonData({});
            }}
            placeholder={t("collision.selectInvolvedAs")}
          />
        </View>

        {/* Vehicle Select (for driver/passenger) */}
        {requiresVehicle(newInvolvedAs) && (
          <View style={styles.fieldContainer}>
            <TextView style={styles.label}>
              {t("collision.vehicle")}:
              <TextView style={styles.required}>*</TextView>
            </TextView>
            {vehicles.length === 0 ? (
              <View style={styles.warningBox}>
                <TextView style={styles.warningText}>
                  {t("collision.addVehicleFirst")}
                </TextView>
              </View>
            ) : (
              <SelectBoxView
                options={vehicleOptions}
                value={newVehicleId}
                onChange={(value) => setNewVehicleId(value as string)}
                placeholder={t("collision.selectVehicle")}
              />
            )}
          </View>
        )}

        {/* Dynamic Person Fields */}
        {currentFields.map((field) => (
          <View key={field.name} style={styles.fieldContainer}>
            <TextView style={styles.label}>
              {field.labelText}:
              {field.isRequired && (
                <TextView style={styles.required}>*</TextView>
              )}
            </TextView>
            {field.fieldType === 1 && (
              <TextInputView
                value={newPersonData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewPersonFieldChange(field.name, value)
                }
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                autoCapitalize={field.isUpperCase ? "characters" : "none"}
              />
            )}
            {field.fieldType === 2 && (
              <TextInputView
                value={newPersonData[field.name]?.toString() || ""}
                onChangeText={(value) =>
                  handleNewPersonFieldChange(
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
                value={newPersonData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewPersonFieldChange(field.name, value)
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
          onPress={handleAddPerson}
          style={styles.addButton}
          disabled={requiresVehicle(newInvolvedAs) && vehicles.length === 0}
        >
          <Plus size={20} color={colors.white} />
          <TextView style={styles.addButtonText}>{t("add")}</TextView>
        </ButtonView>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Persons List */}
      <View style={styles.listSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.persons")} ({persons.length})
        </TextView>

        {persons.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color={colors.lightGrey} />
            <TextView style={styles.emptyText}>
              {t("collision.noPersons")}
            </TextView>
          </View>
        ) : (
          persons.map((person) => {
            const vehicleLabel = getVehicleLabel(person.vehicleId);
            return (
              <View key={person.id} style={styles.personCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardIconContainer}>
                    {getTypeIcon(person.involvedAs)}
                  </View>
                  <View style={styles.cardContent}>
                    <TextView style={styles.cardTitle}>
                      {getTypeLabel(person.involvedAs)}
                    </TextView>
                    {vehicleLabel && (
                      <TextView style={styles.vehicleLabel}>
                        {vehicleLabel}
                      </TextView>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditPerson(person)}
                    >
                      <PencilSimple size={20} color={colors.lightGreen} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleRemovePerson(person.id)}
                    >
                      <Trash size={20} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  {Object.entries(person)
                    .filter(
                      ([key]) =>
                        !["id", "involvedAs", "vehicleId"].includes(key),
                    )
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

// Edit Person Form Component
interface EditPersonFormProps {
  person: CollisionPerson;
  vehicles: any[];
  getFieldsForType: (type: InvolvedAsType) => any[];
  onSave: (person: CollisionPerson) => void;
  onCancel: () => void;
}

const EditPersonForm = ({
  person,
  vehicles,
  getFieldsForType,
  onSave,
  onCancel,
}: EditPersonFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [editedPerson, setEditedPerson] = useState<CollisionPerson>({
    ...person,
  });

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        label: `Vehicle #${v.index}`,
        value: v.id,
      })),
    [vehicles],
  );

  const requiresVehicle = (type: InvolvedAsType) =>
    type === InvolvedAsType.DRIVER || type === InvolvedAsType.PASSENGER;

  const currentFields = getFieldsForType(editedPerson.involvedAs);

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedPerson((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <ScrollView style={styles.editForm}>
      <TextView style={styles.editFormTitle}>
        {t("collision.editPerson")}
      </TextView>

      {/* Involved As (read-only in edit mode) */}
      <View style={styles.fieldContainer}>
        <TextView style={styles.label}>{t("collision.involvedAs")}:</TextView>
        <View style={styles.readOnlyField}>
          <TextView style={styles.readOnlyText}>
            {INVOLVED_AS_OPTIONS.find(
              (o) => o.value === editedPerson.involvedAs,
            )?.label || "Unknown"}
          </TextView>
        </View>
      </View>

      {/* Vehicle Select (for driver/passenger) */}
      {requiresVehicle(editedPerson.involvedAs) && (
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.vehicle")}:
            <TextView style={styles.required}>*</TextView>
          </TextView>
          <SelectBoxView
            options={vehicleOptions}
            value={editedPerson.vehicleId || ""}
            onChange={(value) => handleFieldChange("vehicleId", value)}
            placeholder={t("collision.selectVehicle")}
          />
        </View>
      )}

      {currentFields.map((field) => (
        <View key={field.name} style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {field.labelText}:
            {field.isRequired && <TextView style={styles.required}>*</TextView>}
          </TextView>
          <TextInputView
            value={editedPerson[field.name]?.toString() || ""}
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
          onPress={() => onSave(editedPerson)}
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
    warningBox: {
      backgroundColor: `${colors.warning}20`,
      padding: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    warningText: {
      color: colors.warning,
      fontSize: 14,
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
    personCard: {
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
      backgroundColor: theme.background,
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
    vehicleLabel: {
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
    readOnlyField: {
      backgroundColor: theme.background,
      padding: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    readOnlyText: {
      color: theme.textSecondary,
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

export default PeopleStep;
