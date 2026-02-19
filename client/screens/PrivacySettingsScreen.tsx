import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Typography } from "@/constants/theme";

const PRIVACY_KEY = "@erprana_privacy";

interface PrivacySettings {
  shareWithDoctor: boolean;
  shareVitals: boolean;
  shareMedications: boolean;
  shareRecords: boolean;
  anonymousAnalytics: boolean;
  crashReporting: boolean;
}

const DEFAULT: PrivacySettings = {
  shareWithDoctor: true,
  shareVitals: true,
  shareMedications: true,
  shareRecords: false,
  anonymousAnalytics: true,
  crashReporting: true,
};

export default function PrivacySettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRIVACY_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  };

  const toggle = async (key: keyof PrivacySettings) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await AsyncStorage.setItem(PRIVACY_KEY, JSON.stringify(updated));
  };

  const renderToggle = (
    icon: keyof typeof Feather.glyphMap,
    iconColor: string,
    title: string,
    subtitle: string,
    key: keyof PrivacySettings,
    isLast = false
  ) => (
    <View
      style={[
        styles.settingRow,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
      ]}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, { backgroundColor: iconColor + "20" }]}>
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.settingText}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          <ThemedText style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </View>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggle(key)}
        trackColor={{ false: theme.border, true: theme.primary + "60" }}
        thumbColor={settings[key] ? theme.primary : theme.textSecondary}
      />
    </View>
  );

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
            <View style={[styles.infoIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="shield" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Your health data is stored locally on your device. These settings
              control what data can be shared when you connect with healthcare
              providers through ErMate in the future.
            </ThemedText>
          </View>
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          DATA SHARING WITH DOCTORS
        </ThemedText>
        <Card style={styles.sectionCard}>
          {renderToggle("user-check", "#2563EB", "Share with Doctor", "Allow doctors to access your health data via ErMate", "shareWithDoctor")}
          {renderToggle("activity", "#10B981", "Share Vitals", "Heart rate, blood pressure, temperature, SpO2", "shareVitals")}
          {renderToggle("package", "#F59E0B", "Share Medications", "Current medications and dosage history", "shareMedications")}
          {renderToggle("file-text", "#8B5CF6", "Share Records", "Medical records and test results", "shareRecords", true)}
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          APP ANALYTICS
        </ThemedText>
        <Card style={styles.sectionCard}>
          {renderToggle("bar-chart-2", "#6366F1", "Anonymous Analytics", "Help us improve ErPrana with anonymous usage data", "anonymousAnalytics")}
          {renderToggle("alert-triangle", "#EF4444", "Crash Reporting", "Automatically report app crashes to improve stability", "crashReporting", true)}
        </Card>

        <Card style={styles.noteCard}>
          <ThemedText style={[styles.noteText, { color: theme.textSecondary }]}>
            ErPrana never sells your data. All health information stays on your
            device unless you explicitly choose to share it. Future ErMate
            integration will use end-to-end encryption.
          </ThemedText>
        </Card>
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
  sectionCard: { marginBottom: Spacing.xl, padding: 0, overflow: "hidden" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: Spacing.lg },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.md, flex: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  settingText: { flex: 1 },
  settingTitle: { ...Typography.body, fontWeight: "500" },
  settingSubtitle: { ...Typography.caption, marginTop: 2 },
  noteCard: { padding: Spacing.lg },
  noteText: { ...Typography.small, lineHeight: 20, textAlign: "center" },
});
