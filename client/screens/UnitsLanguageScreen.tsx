import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const UNITS_KEY = "@erprana_units";

interface UnitSettings {
  temperature: "celsius" | "fahrenheit";
  weight: "kg" | "lbs";
  height: "cm" | "ft";
  distance: "km" | "mi";
  language: string;
}

const DEFAULT_SETTINGS: UnitSettings = {
  temperature: "celsius",
  weight: "kg",
  height: "cm",
  distance: "km",
  language: "English",
};

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];

export default function UnitsLanguageScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [settings, setSettings] = useState<UnitSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(UNITS_KEY);
      if (stored) setSettings(JSON.parse(stored));
    } catch {}
  };

  const updateSetting = async <K extends keyof UnitSettings>(key: K, value: UnitSettings[K]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await AsyncStorage.setItem(UNITS_KEY, JSON.stringify(updated));
  };

  const renderToggle = (label: string, options: { value: string; label: string }[], current: string, onChange: (val: string) => void) => (
    <View style={styles.toggleRow}>
      <ThemedText style={styles.toggleLabel}>{label}</ThemedText>
      <View style={styles.toggleGroup}>
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            style={[
              styles.toggleOption,
              {
                backgroundColor: current === opt.value ? theme.primary : theme.inputBackground,
                borderColor: current === opt.value ? theme.primary : theme.border,
              },
            ]}
            onPress={() => onChange(opt.value)}
          >
            <ThemedText
              style={[styles.toggleOptionText, { color: current === opt.value ? "#FFFFFF" : theme.text }]}
            >
              {opt.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
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
        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          MEASUREMENT UNITS
        </ThemedText>
        <Card style={styles.sectionCard}>
          {renderToggle(
            "Temperature",
            [{ value: "celsius", label: "Celsius" }, { value: "fahrenheit", label: "Fahrenheit" }],
            settings.temperature,
            (v) => updateSetting("temperature", v as "celsius" | "fahrenheit")
          )}
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          {renderToggle(
            "Weight",
            [{ value: "kg", label: "kg" }, { value: "lbs", label: "lbs" }],
            settings.weight,
            (v) => updateSetting("weight", v as "kg" | "lbs")
          )}
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          {renderToggle(
            "Height",
            [{ value: "cm", label: "cm" }, { value: "ft", label: "ft/in" }],
            settings.height,
            (v) => updateSetting("height", v as "cm" | "ft")
          )}
          <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />
          {renderToggle(
            "Distance",
            [{ value: "km", label: "km" }, { value: "mi", label: "miles" }],
            settings.distance,
            (v) => updateSetting("distance", v as "km" | "mi")
          )}
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          LANGUAGE
        </ThemedText>
        <Card style={styles.sectionCard}>
          <ThemedText style={[styles.langHint, { color: theme.textSecondary }]}>
            ARYA will respond in your preferred language during check-ins and conversations.
          </ThemedText>
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang}
                style={[
                  styles.langChip,
                  {
                    backgroundColor: settings.language === lang ? theme.primary : theme.inputBackground,
                    borderColor: settings.language === lang ? theme.primary : theme.border,
                  },
                ]}
                onPress={() => updateSetting("language", lang)}
              >
                <ThemedText
                  style={[styles.langChipText, { color: settings.language === lang ? "#FFFFFF" : theme.text }]}
                >
                  {lang}
                </ThemedText>
                {settings.language === lang ? (
                  <Feather name="check" size={14} color="#FFFFFF" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xl },
  sectionLabel: { ...Typography.caption, fontWeight: "600", textTransform: "uppercase", marginBottom: Spacing.sm, marginLeft: Spacing.xs, letterSpacing: 0.5 },
  sectionCard: { marginBottom: Spacing.xl, padding: Spacing.lg },
  toggleRow: { paddingVertical: Spacing.sm },
  toggleLabel: { ...Typography.body, fontWeight: "500", marginBottom: Spacing.sm },
  toggleGroup: { flexDirection: "row", gap: Spacing.sm },
  toggleOption: { flex: 1, height: 40, borderRadius: BorderRadius.sm, justifyContent: "center", alignItems: "center", borderWidth: 1 },
  toggleOptionText: { ...Typography.small, fontWeight: "600" },
  divider: { height: 1, marginVertical: Spacing.md },
  langHint: { ...Typography.small, marginBottom: Spacing.lg, lineHeight: 20 },
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  langChip: { flexDirection: "row", alignItems: "center", gap: Spacing.xs, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1 },
  langChipText: { ...Typography.small, fontWeight: "500" },
});
