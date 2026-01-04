import React from "react";
import { View, StyleSheet, Pressable, Linking, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const emergencyContacts = [
  { name: "John Doe", phone: "+1234567890", relationship: "Spouse" },
  { name: "Jane Doe", phone: "+0987654321", relationship: "Parent" },
];

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();

  const handleCall911 = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (Platform.OS === "web") {
      Alert.alert("Emergency", "Please dial 911 on your phone");
    } else {
      Linking.openURL("tel:911");
    }
  };

  const handleCallContact = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      Alert.alert("Call", `Please dial ${phone} on your phone`);
    } else {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleShareLocation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Share Location",
      "Location sharing would send your GPS coordinates to emergency contacts.",
      [{ text: "OK" }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.danger }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => navigation.goBack()}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Emergency</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Pressable
          style={({ pressed }) => [
            styles.call911Button,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleCall911}
        >
          <Feather name="phone-call" size={40} color={Colors.light.danger} />
          <ThemedText style={styles.call911Text}>Call 911</ThemedText>
          <ThemedText style={styles.call911Subtitle}>
            Tap for emergency services
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.shareLocationButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleShareLocation}
        >
          <Feather name="map-pin" size={24} color="#FFFFFF" />
          <ThemedText style={styles.shareLocationText}>
            Share My Location
          </ThemedText>
        </Pressable>

        <View style={styles.contactsSection}>
          <ThemedText style={styles.contactsTitle}>
            Emergency Contacts
          </ThemedText>
          {emergencyContacts.map((contact, index) => (
            <Pressable
              key={index}
              style={({ pressed }) => [
                styles.contactCard,
                { opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => handleCallContact(contact.phone)}
            >
              <View style={styles.contactInfo}>
                <ThemedText style={styles.contactName}>{contact.name}</ThemedText>
                <ThemedText style={styles.contactRelationship}>
                  {contact.relationship}
                </ThemedText>
              </View>
              <View style={styles.callIcon}>
                <Feather name="phone" size={20} color={Colors.light.danger} />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.medicalIdSection}>
          <ThemedText style={styles.medicalIdTitle}>Medical ID</ThemedText>
          <View style={styles.medicalIdCard}>
            <View style={styles.medicalIdRow}>
              <ThemedText style={styles.medicalIdLabel}>Blood Type</ThemedText>
              <ThemedText style={styles.medicalIdValue}>
                {user?.bloodType || "Not specified"}
              </ThemedText>
            </View>
            <View style={styles.medicalIdDivider} />
            <View style={styles.medicalIdRow}>
              <ThemedText style={styles.medicalIdLabel}>Allergies</ThemedText>
              <ThemedText style={styles.medicalIdValue}>
                {user?.allergies?.join(", ") || "None recorded"}
              </ThemedText>
            </View>
            <View style={styles.medicalIdDivider} />
            <View style={styles.medicalIdRow}>
              <ThemedText style={styles.medicalIdLabel}>Conditions</ThemedText>
              <ThemedText style={styles.medicalIdValue}>
                {user?.conditions?.join(", ") || "None recorded"}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <ThemedText style={styles.footerText}>
          In a real emergency, always call your local emergency number
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  call911Button: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing["2xl"],
    alignItems: "center",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  call911Text: {
    ...Typography.h2,
    color: Colors.light.danger,
    marginTop: Spacing.md,
  },
  call911Subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  shareLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  shareLocationText: {
    ...Typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  contactsSection: {
    marginBottom: Spacing.xl,
  },
  contactsTitle: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.text,
  },
  contactRelationship: {
    ...Typography.small,
    color: Colors.light.textSecondary,
  },
  callIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.danger + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  medicalIdSection: {
    flex: 1,
  },
  medicalIdTitle: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  medicalIdCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  medicalIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  medicalIdLabel: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  medicalIdValue: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.text,
  },
  medicalIdDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
  },
  footerText: {
    ...Typography.small,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
});
