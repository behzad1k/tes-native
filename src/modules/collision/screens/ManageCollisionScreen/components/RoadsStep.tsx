import React, { useState, useCallback } from "react";
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
import { CollisionFormData, getNextRoadIndex } from "../../../types";
import { CollisionRoad } from "@/src/types/models";
import { useCollisionFields } from "../../../hooks/useCollisionOperations";
import { colors } from "@/src/styles/theme/colors";
import { Trash, PencilSimple, Plus } from "phosphor-react-native";
import { useDrawer } from "@/src/contexts/DrawerContext";
import { v4 as uuidv4 } from "uuid";

interface RoadsStepProps {
  control: Control<CollisionFormData>;
  errors: any;
  getValues: UseFormGetValues<CollisionFormData>;
  setValue: UseFormSetValue<CollisionFormData>;
}

const RoadsStep = ({
  control,
  errors,
  getValues,
  setValue,
}: RoadsStepProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { roadFields } = useCollisionFields();
  const { openDrawer, closeDrawer } = useDrawer();

  const roads = getValues("roads") || [];

  // New road form state
  const [newRoadIndex, setNewRoadIndex] = useState(
    String(getNextRoadIndex(roads)),
  );
  const [newRoadData, setNewRoadData] = useState<Record<string, any>>({});

  // Reset new road form
  const resetNewRoadForm = () => {
    setNewRoadIndex(String(getNextRoadIndex(getValues("roads") || [])));
    setNewRoadData({});
  };

  // Add road
  const handleAddRoad = () => {
    if (!newRoadIndex.trim()) {
      Alert.alert(t("error"), t("collision.roadIndexRequired"));
      return;
    }

    const newRoad: CollisionRoad = {
      id: uuidv4(),
      index: newRoadIndex,
      ...newRoadData,
    };

    const currentRoads = getValues("roads") || [];
    setValue("roads", [...currentRoads, newRoad]);
    resetNewRoadForm();
  };

  // Remove road
  const handleRemoveRoad = (roadId: string) => {
    Alert.alert(t("warning"), t("collision.confirmDeleteRoad"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: () => {
          const currentRoads = getValues("roads") || [];
          setValue(
            "roads",
            currentRoads.filter((r) => r.id !== roadId),
          );
        },
      },
    ]);
  };

  // Edit road (opens drawer with form)
  const handleEditRoad = (road: CollisionRoad) => {
    openDrawer(
      "edit-road",
      <EditRoadForm
        road={road}
        roadFields={roadFields}
        onSave={(updatedRoad) => {
          const currentRoads = getValues("roads") || [];
          setValue(
            "roads",
            currentRoads.map((r) =>
              r.id === updatedRoad.id ? updatedRoad : r,
            ),
          );
          closeDrawer();
        }}
        onCancel={() => closeDrawer()}
      />,
      { drawerHeight: "auto" },
    );
  };

  // Handle field change for new road
  const handleNewRoadFieldChange = (fieldName: string, value: any) => {
    setNewRoadData((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Add New Road Form */}
      <View style={styles.formSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.addRoad")}
        </TextView>

        {/* Road Index */}
        <View style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {t("collision.roadIndex")}:
            <TextView style={styles.required}>*</TextView>
          </TextView>
          <TextInputView
            value={newRoadIndex}
            onChangeText={setNewRoadIndex}
            keyboardType="numeric"
            placeholder={t("collision.enterRoadIndex")}
          />
        </View>

        {/* Dynamic Road Fields */}
        {roadFields.map((field) => (
          <View key={field.name} style={styles.fieldContainer}>
            <TextView style={styles.label}>
              {field.labelText}:
              {field.isRequired && (
                <TextView style={styles.required}>*</TextView>
              )}
            </TextView>
            {field.fieldType === 1 && (
              <TextInputView
                value={newRoadData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewRoadFieldChange(field.name, value)
                }
                placeholder={`Enter ${field.labelText.toLowerCase()}`}
                autoCapitalize={field.isUpperCase ? "characters" : "none"}
              />
            )}
            {field.fieldType === 2 && (
              <TextInputView
                value={newRoadData[field.name]?.toString() || ""}
                onChangeText={(value) =>
                  handleNewRoadFieldChange(
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
                value={newRoadData[field.name] || ""}
                onChangeText={(value) =>
                  handleNewRoadFieldChange(field.name, value)
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
          onPress={handleAddRoad}
          style={styles.addButton}
        >
          <Plus size={20} color={colors.white} />
          <TextView style={styles.addButtonText}>{t("add")}</TextView>
        </ButtonView>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Roads List */}
      <View style={styles.listSection}>
        <TextView style={styles.sectionTitle}>
          {t("collision.roads")} ({roads.length})
        </TextView>

        {roads.length === 0 ? (
          <View style={styles.emptyState}>
            <TextView style={styles.emptyText}>
              {t("collision.noRoads")}
            </TextView>
          </View>
        ) : (
          roads.map((road) => (
            <View key={road.id} style={styles.roadCard}>
              <View style={styles.cardContent}>
                <TextView style={styles.cardTitle}>Road #{road.index}</TextView>
                {Object.entries(road)
                  .filter(([key]) => !["id", "index"].includes(key))
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <TextView
                      key={key}
                      style={styles.cardDetail}
                      numberOfLines={1}
                    >
                      {key}: {String(value)}
                    </TextView>
                  ))}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditRoad(road)}
                >
                  <PencilSimple size={20} color={colors.lightGreen} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveRoad(road.id)}
                >
                  <Trash size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

// Edit Road Form Component
interface EditRoadFormProps {
  road: CollisionRoad;
  roadFields: any[];
  onSave: (road: CollisionRoad) => void;
  onCancel: () => void;
}

const EditRoadForm = ({
  road,
  roadFields,
  onSave,
  onCancel,
}: EditRoadFormProps) => {
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const [editedRoad, setEditedRoad] = useState<CollisionRoad>({ ...road });

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedRoad((prev) => ({ ...prev, [fieldName]: value }));
  };

  return (
    <View style={styles.editForm}>
      <TextView style={styles.editFormTitle}>
        {t("collision.editRoad")}
      </TextView>

      <View style={styles.fieldContainer}>
        <TextView style={styles.label}>{t("collision.roadIndex")}:*</TextView>
        <TextInputView
          value={editedRoad.index}
          onChangeText={(value) => handleFieldChange("index", value)}
          keyboardType="numeric"
        />
      </View>

      {roadFields.map((field) => (
        <View key={field.name} style={styles.fieldContainer}>
          <TextView style={styles.label}>
            {field.labelText}:
            {field.isRequired && <TextView style={styles.required}>*</TextView>}
          </TextView>
          <TextInputView
            value={editedRoad[field.name]?.toString() || ""}
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
          onPress={() => onSave(editedRoad)}
          style={styles.editFormButton}
        >
          {t("save")}
        </ButtonView>
      </View>
    </View>
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
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 14,
    },
    roadCard: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: spacing.xs,
    },
    cardDetail: {
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
    editForm: {
      padding: spacing.md,
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
    },
    editFormButton: {
      minWidth: 100,
    },
  });

export default RoadsStep;
