import React, { useState } from "react";
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

interface ContactForm {
  name: string;
  phone: string;
  relationship: string;
}

const RELATIONSHIPS = ["Spouse", "Parent", "Child", "Sibling", "Friend", "Doctor", "Other"];

export default function EmergencyContactsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { user, updateUser } = useAuth();
  const contacts = user?.emergencyContacts || [];

  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form, setForm] = useState<ContactForm>({ name: "", phone: "", relationship: "" });

  const resetForm = () => {
    setForm({ name: "", phone: "", relationship: "" });
    setShowForm(false);
    setEditIndex(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert("Missing Info", "Please enter both name and phone number.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = [...contacts];
    const entry = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      relationship: form.relationship || "Other",
    };
    if (editIndex !== null) {
      updated[editIndex] = entry;
    } else {
      updated.push(entry);
    }
    await updateUser({ emergencyContacts: updated });
    resetForm();
  };

  const handleEdit = (index: number) => {
    setForm(contacts[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  const handleDelete = (index: number) => {
    Alert.alert("Remove Contact", `Remove ${contacts[index].name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          const updated = contacts.filter((_, i) => i !== index);
          await updateUser({ emergencyContacts: updated });
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Spacing.xl, paddingBottom: insets.bottom + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: "#EF444420" }]}>
              <Feather name="alert-circle" size={18} color="#EF4444" />
            </View>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              These contacts will be notified when you trigger the SOS emergency
              feature. Add people you trust to respond quickly.
            </ThemedText>
          </View>
        </Card>

        {contacts.length > 0 ? (
          <Card style={styles.listCard}>
            {contacts.map((contact, index) => (
              <View
                key={`${contact.name}-${index}`}
                style={[
                  styles.contactRow,
                  index < contacts.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
                ]}
              >
                <View style={[styles.contactAvatar, { backgroundColor: theme.primary + "15" }]}>
                  <ThemedText style={[styles.contactInitial, { color: theme.primary }]}>
                    {contact.name.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.contactInfo}>
                  <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
                  <ThemedText style={[styles.contactDetail, { color: theme.textSecondary }]}>
                    {contact.phone}
                  </ThemedText>
                  <ThemedText style={[styles.contactRelation, { color: theme.primary }]}>
                    {contact.relationship}
                  </ThemedText>
                </View>
                <View style={styles.contactActions}>
                  <Pressable
                    onPress={() => handleEdit(index)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 8 })}
                  >
                    <Feather name="edit-2" size={16} color={theme.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(index)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 8 })}
                  >
                    <Feather name="trash-2" size={16} color={theme.danger} />
                  </Pressable>
                </View>
              </View>
            ))}
          </Card>
        ) : !showForm ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="users" size={32} color={theme.primary} />
            </View>
            <ThemedText style={styles.emptyTitle}>No Emergency Contacts</ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add contacts who should be notified in an emergency
            </ThemedText>
          </Card>
        ) : null}

        {showForm ? (
          <Card style={styles.formCard}>
            <ThemedText style={styles.formTitle}>
              {editIndex !== null ? "Edit Contact" : "Add Contact"}
            </ThemedText>
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                placeholder="Contact name"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Phone</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
                value={form.phone}
                onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
                placeholder="Phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.fieldGroup}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Relationship</ThemedText>
              <View style={styles.chipRow}>
                {RELATIONSHIPS.map((rel) => (
                  <Pressable
                    key={rel}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: form.relationship === rel ? theme.primary : theme.inputBackground,
                        borderColor: form.relationship === rel ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, relationship: rel }))}
                  >
                    <ThemedText
                      style={[styles.chipText, { color: form.relationship === rel ? "#FFFFFF" : theme.text }]}
                    >
                      {rel}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.formActions}>
              <Pressable
                style={[styles.cancelBtn, { borderColor: theme.border }]}
                onPress={resetForm}
              >
                <ThemedText style={{ color: theme.textSecondary }}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <ThemedText style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  {editIndex !== null ? "Update" : "Save"}
                </ThemedText>
              </Pressable>
            </View>
          </Card>
        ) : null}

        {!showForm ? (
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowForm(true);
              setEditIndex(null);
              setForm({ name: "", phone: "", relationship: "" });
            }}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
            <ThemedText style={styles.addButtonText}>Add Contact</ThemedText>
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
  listCard: { marginBottom: Spacing.xl, padding: 0, overflow: "hidden" },
  contactRow: { flexDirection: "row", alignItems: "center", padding: Spacing.lg },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  contactInitial: { fontSize: 18, fontWeight: "700" },
  contactInfo: { flex: 1, marginLeft: Spacing.md },
  contactName: { ...Typography.body, fontWeight: "600" },
  contactDetail: { ...Typography.small, marginTop: 2 },
  contactRelation: { ...Typography.caption, fontWeight: "500", marginTop: 2 },
  contactActions: { flexDirection: "row", gap: 4 },
  emptyCard: { alignItems: "center", padding: Spacing["2xl"], marginBottom: Spacing.xl },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: Spacing.lg },
  emptyTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.small, textAlign: "center" },
  formCard: { padding: Spacing.xl, marginBottom: Spacing.xl },
  formTitle: { ...Typography.h4, marginBottom: Spacing.xl },
  fieldGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.small, fontWeight: "600", marginBottom: Spacing.sm },
  input: { height: Spacing.inputHeight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.lg, fontSize: 16, borderWidth: 1 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  chipText: { ...Typography.small, fontWeight: "500" },
  formActions: { flexDirection: "row", gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: { flex: 1, height: Spacing.buttonHeight, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  saveBtn: { flex: 1, height: Spacing.buttonHeight, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center" },
  addButton: { flexDirection: "row", height: Spacing.buttonHeight, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center", gap: Spacing.sm },
  addButtonText: { color: "#FFFFFF", ...Typography.body, fontWeight: "600" },
});
