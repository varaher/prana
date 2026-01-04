import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { Medication } from "@/screens/MedicationsScreen";

const MEDICATIONS_KEY = "@erprana_medications";

const frequencyOptions = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "Weekly",
];

export default function AddMedicationScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("Once daily");
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a medication name");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const stored = await AsyncStorage.getItem(MEDICATIONS_KEY);
      const medications: Medication[] = stored ? JSON.parse(stored) : [];

      const newMedication: Medication = {
        id: Date.now().toString(),
        name: name.trim(),
        dosage: dosage.trim(),
        frequency,
        times,
        startDate: new Date().toISOString().split("T")[0],
        notes: notes.trim() || undefined,
        taken: {},
      };

      await AsyncStorage.setItem(
        MEDICATIONS_KEY,
        JSON.stringify([...medications, newMedication])
      );

      navigation.goBack();
    } catch (error) {
      console.error("Error saving medication:", error);
      Alert.alert("Error", "Failed to save medication. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addTime = () => {
    setTimes([...times, "12:00"]);
  };

  const removeTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const updateTime = (index: number, newTime: string) => {
    const updated = [...times];
    updated[index] = newTime;
    setTimes(updated);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Medication Name *</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g., Aspirin, Vitamin D"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Dosage</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="e.g., 500mg, 1 tablet"
            placeholderTextColor={theme.textSecondary}
            value={dosage}
            onChangeText={setDosage}
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Frequency</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.frequencyContainer}
          >
            {frequencyOptions.map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.frequencyOption,
                  {
                    backgroundColor:
                      frequency === option ? theme.primary : theme.inputBackground,
                    borderColor:
                      frequency === option ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => setFrequency(option)}
              >
                <ThemedText
                  style={[
                    styles.frequencyText,
                    { color: frequency === option ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {option}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <ThemedText style={styles.label}>Reminder Times</ThemedText>
            <Pressable
              style={({ pressed }) => [
                styles.addTimeButton,
                { backgroundColor: theme.primary + "20", opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={addTime}
            >
              <Feather name="plus" size={16} color={theme.primary} />
              <ThemedText style={[styles.addTimeText, { color: theme.primary }]}>
                Add
              </ThemedText>
            </Pressable>
          </View>
          {times.map((time, index) => (
            <View key={index} style={styles.timeRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.timeInput,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="HH:MM"
                placeholderTextColor={theme.textSecondary}
                value={time}
                onChangeText={(text) => updateTime(index, text)}
              />
              {times.length > 1 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.removeTimeButton,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => removeTime(index)}
                >
                  <Feather name="x" size={20} color={theme.danger} />
                </Pressable>
              )}
            </View>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Notes</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Any additional notes..."
            placeholderTextColor={theme.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <ThemedText style={styles.saveButtonText}>
            {isLoading ? "Saving..." : "Save Medication"}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  frequencyContainer: {
    gap: Spacing.sm,
  },
  frequencyOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  frequencyText: {
    ...Typography.small,
    fontWeight: "500",
  },
  addTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  addTimeText: {
    ...Typography.small,
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  removeTimeButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  notesInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  saveButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  saveButtonText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
});
