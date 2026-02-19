import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

export default function MedicalIDScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();

  const [bloodType, setBloodType] = useState(user?.bloodType || "");
  const [age, setAge] = useState(user?.age?.toString() || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [allergyInput, setAllergyInput] = useState("");
  const [allergies, setAllergies] = useState<string[]>(user?.allergies || []);
  const [conditionInput, setConditionInput] = useState("");
  const [conditions, setConditions] = useState<string[]>(user?.conditions || []);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed =
      bloodType !== (user?.bloodType || "") ||
      age !== (user?.age?.toString() || "") ||
      gender !== (user?.gender || "") ||
      JSON.stringify(allergies) !== JSON.stringify(user?.allergies || []) ||
      JSON.stringify(conditions) !== JSON.stringify(user?.conditions || []);
    setHasChanges(changed);
  }, [bloodType, age, gender, allergies, conditions, user]);

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateUser({
      bloodType: bloodType || undefined,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      allergies,
      conditions,
    });
    setHasChanges(false);
    Alert.alert("Saved", "Your Medical ID has been updated.");
  };

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (val && !allergies.includes(val)) {
      setAllergies([...allergies, val]);
      setAllergyInput("");
    }
  };

  const removeAllergy = (item: string) => {
    setAllergies(allergies.filter((a) => a !== item));
  };

  const addCondition = () => {
    const val = conditionInput.trim();
    if (val && !conditions.includes(val)) {
      setConditions([...conditions, val]);
      setConditionInput("");
    }
  };

  const removeCondition = (item: string) => {
    setConditions(conditions.filter((c) => c !== item));
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: "#EF444420" }]}>
              <Feather name="heart" size={18} color="#EF4444" />
            </View>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Your Medical ID is shown to emergency responders and shared when
              you use SOS. Keep it accurate and up-to-date.
            </ThemedText>
          </View>
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          BASIC INFO
        </ThemedText>
        <Card style={styles.sectionCard}>
          <View style={[styles.fieldRow, { borderBottomColor: theme.borderLight }]}>
            <ThemedText style={styles.fieldLabel}>Blood Type</ThemedText>
            <View style={styles.chipRow}>
              {BLOOD_TYPES.map((bt) => (
                <Pressable
                  key={bt}
                  style={[
                    styles.chipSmall,
                    {
                      backgroundColor: bloodType === bt ? theme.primary : theme.inputBackground,
                      borderColor: bloodType === bt ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setBloodType(bloodType === bt ? "" : bt)}
                >
                  <ThemedText style={[styles.chipSmallText, { color: bloodType === bt ? "#FFFFFF" : theme.text }]}>
                    {bt}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.fieldRow, { borderBottomColor: theme.borderLight }]}>
            <ThemedText style={styles.fieldLabel}>Age</ThemedText>
            <TextInput
              style={[styles.inlineInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              placeholder="--"
              placeholderTextColor={theme.textSecondary}
              maxLength={3}
            />
          </View>
          <View style={styles.fieldRowLast}>
            <ThemedText style={styles.fieldLabel}>Gender</ThemedText>
            <View style={styles.chipRow}>
              {GENDERS.map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.chipSmall,
                    {
                      backgroundColor: gender === g ? theme.primary : theme.inputBackground,
                      borderColor: gender === g ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setGender(gender === g ? "" : g)}
                >
                  <ThemedText style={[styles.chipSmallText, { color: gender === g ? "#FFFFFF" : theme.text }]}>
                    {g}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          ALLERGIES
        </ThemedText>
        <Card style={styles.sectionCard}>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              value={allergyInput}
              onChangeText={setAllergyInput}
              placeholder="Type allergy and add"
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={addAllergy}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addTagBtn, { backgroundColor: theme.primary }]}
              onPress={addAllergy}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          {allergies.length > 0 ? (
            <View style={styles.tagList}>
              {allergies.map((a) => (
                <View key={a} style={[styles.tag, { backgroundColor: "#EF444415" }]}>
                  <ThemedText style={[styles.tagText, { color: "#EF4444" }]}>{a}</ThemedText>
                  <Pressable onPress={() => removeAllergy(a)} style={{ padding: 2 }}>
                    <Feather name="x" size={14} color="#EF4444" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
              No allergies recorded
            </ThemedText>
          )}
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          MEDICAL CONDITIONS
        </ThemedText>
        <Card style={styles.sectionCard}>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
              value={conditionInput}
              onChangeText={setConditionInput}
              placeholder="Type condition and add"
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={addCondition}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addTagBtn, { backgroundColor: theme.primary }]}
              onPress={addCondition}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
          {conditions.length > 0 ? (
            <View style={styles.tagList}>
              {conditions.map((c) => (
                <View key={c} style={[styles.tag, { backgroundColor: theme.primary + "15" }]}>
                  <ThemedText style={[styles.tagText, { color: theme.primary }]}>{c}</ThemedText>
                  <Pressable onPress={() => removeCondition(c)} style={{ padding: 2 }}>
                    <Feather name="x" size={14} color={theme.primary} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
              No conditions recorded
            </ThemedText>
          )}
        </Card>

        {hasChanges ? (
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleSave}
          >
            <Feather name="check" size={20} color="#FFFFFF" />
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          </Pressable>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  infoCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  infoRow: { flexDirection: "row", gap: Spacing.md, alignItems: "flex-start" },
  infoIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginTop: 2 },
  infoText: { ...Typography.small, flex: 1, lineHeight: 20 },
  sectionLabel: { ...Typography.caption, fontWeight: "600", textTransform: "uppercase", marginBottom: Spacing.sm, marginLeft: Spacing.xs, letterSpacing: 0.5 },
  sectionCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  fieldRow: { paddingBottom: Spacing.lg, marginBottom: Spacing.lg, borderBottomWidth: 1 },
  fieldRowLast: { paddingBottom: 0 },
  fieldLabel: { ...Typography.body, fontWeight: "500", marginBottom: Spacing.sm },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chipSmall: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, minWidth: 40, alignItems: "center" },
  chipSmallText: { ...Typography.small, fontWeight: "600" },
  inlineInput: { width: 80, height: 40, borderRadius: BorderRadius.sm, textAlign: "center", fontSize: 16, fontWeight: "600", borderWidth: 1 },
  tagInputRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.md },
  tagInput: { flex: 1, height: Spacing.inputHeight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.lg, fontSize: 16, borderWidth: 1 },
  addTagBtn: { width: Spacing.inputHeight, height: Spacing.inputHeight, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center" },
  tagList: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  tag: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  tagText: { ...Typography.small, fontWeight: "500" },
  emptyHint: { ...Typography.small, textAlign: "center", paddingVertical: Spacing.md },
  saveButton: { flexDirection: "row", height: Spacing.buttonHeight, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center", gap: Spacing.sm, marginTop: Spacing.md },
  saveButtonText: { color: "#FFFFFF", ...Typography.body, fontWeight: "600" },
});
