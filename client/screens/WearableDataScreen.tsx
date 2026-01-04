import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";
import { TextInput } from "react-native";

interface WearableReading {
  id: number;
  userId: string;
  recordedAt: string;
  heartRate: number | null;
  heartRateVariability: number | null;
  restingHeartRate: number | null;
  bloodOxygenSaturation: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  respiratoryRate: number | null;
  bodyTemperature: number | null;
  skinTemperature: number | null;
  steps: number | null;
  distance: number | null;
  caloriesBurned: number | null;
  activeMinutes: number | null;
  flightsClimbed: number | null;
  sleepDuration: number | null;
  sleepQuality: number | null;
  deepSleep: number | null;
  lightSleep: number | null;
  remSleep: number | null;
  sleepLatency: number | null;
  stressLevel: number | null;
  vo2Max: number | null;
  recoveryScore: number | null;
  ambientTemperature: number | null;
  humidity: number | null;
  uvExposure: number | null;
  altitude: number | null;
  noiseLevel: number | null;
  ecgReading: string | null;
  afibDetected: boolean | null;
  fallDetected: boolean | null;
  notes: string | null;
  deviceType: string | null;
}

interface MetricInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  unit?: string;
  keyboardType?: "numeric" | "decimal-pad" | "default";
  placeholder?: string;
}

function MetricInput({ label, value, onChangeText, unit, keyboardType = "numeric", placeholder }: MetricInputProps) {
  const { theme: colors } = useTheme();
  return (
    <View style={styles.metricInputContainer}>
      <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      <View style={styles.metricInputRow}>
        <TextInput
          style={[styles.metricInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          placeholder={placeholder || "0"}
          placeholderTextColor={colors.textSecondary}
        />
        {unit ? <ThemedText style={[styles.unitText, { color: colors.textSecondary }]}>{unit}</ThemedText> : null}
      </View>
    </View>
  );
}

export default function WearableDataScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    heartRate: "",
    heartRateVariability: "",
    restingHeartRate: "",
    bloodOxygenSaturation: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    respiratoryRate: "",
    bodyTemperature: "",
    steps: "",
    caloriesBurned: "",
    activeMinutes: "",
    sleepDuration: "",
    sleepQuality: "",
    stressLevel: "",
    vo2Max: "",
    recoveryScore: "",
    deviceType: "",
  });

  const { data: readings = [], isLoading } = useQuery<WearableReading[]>({
    queryKey: ["/api/user", user?.id, "wearable-readings"],
    enabled: !!user?.id,
  });

  const addReadingMutation = useMutation({
    mutationFn: async (data: Partial<WearableReading>) => {
      await apiRequest("POST", `/api/user/${user?.id}/wearable-readings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "wearable-readings"] });
      setAddModalVisible(false);
      setFormData({
        heartRate: "",
        heartRateVariability: "",
        restingHeartRate: "",
        bloodOxygenSaturation: "",
        bloodPressureSystolic: "",
        bloodPressureDiastolic: "",
        respiratoryRate: "",
        bodyTemperature: "",
        steps: "",
        caloriesBurned: "",
        activeMinutes: "",
        sleepDuration: "",
        sleepQuality: "",
        stressLevel: "",
        vo2Max: "",
        recoveryScore: "",
        deviceType: "",
      });
    },
  });

  const handleAddReading = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const data: Partial<WearableReading> = {};
    if (formData.heartRate) data.heartRate = parseInt(formData.heartRate);
    if (formData.heartRateVariability) data.heartRateVariability = parseInt(formData.heartRateVariability);
    if (formData.restingHeartRate) data.restingHeartRate = parseInt(formData.restingHeartRate);
    if (formData.bloodOxygenSaturation) data.bloodOxygenSaturation = parseFloat(formData.bloodOxygenSaturation);
    if (formData.bloodPressureSystolic) data.bloodPressureSystolic = parseInt(formData.bloodPressureSystolic);
    if (formData.bloodPressureDiastolic) data.bloodPressureDiastolic = parseInt(formData.bloodPressureDiastolic);
    if (formData.respiratoryRate) data.respiratoryRate = parseInt(formData.respiratoryRate);
    if (formData.bodyTemperature) data.bodyTemperature = parseFloat(formData.bodyTemperature);
    if (formData.steps) data.steps = parseInt(formData.steps);
    if (formData.caloriesBurned) data.caloriesBurned = parseInt(formData.caloriesBurned);
    if (formData.activeMinutes) data.activeMinutes = parseInt(formData.activeMinutes);
    if (formData.sleepDuration) data.sleepDuration = parseInt(formData.sleepDuration);
    if (formData.sleepQuality) data.sleepQuality = parseInt(formData.sleepQuality);
    if (formData.stressLevel) data.stressLevel = parseInt(formData.stressLevel);
    if (formData.vo2Max) data.vo2Max = parseFloat(formData.vo2Max);
    if (formData.recoveryScore) data.recoveryScore = parseInt(formData.recoveryScore);
    if (formData.deviceType) data.deviceType = formData.deviceType;

    addReadingMutation.mutate(data);
  };

  const latestReading = readings[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: headerHeight + Spacing.xl }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {latestReading ? (
          <>
            <Card style={styles.summaryCard}>
              <ThemedText style={styles.sectionTitle}>Latest Reading</ThemedText>
              <ThemedText style={[styles.timestamp, { color: colors.textSecondary }]}>
                {formatDate(latestReading.recordedAt)}
              </ThemedText>
            </Card>

            <ThemedText style={[styles.categoryTitle, { color: colors.text }]}>Heart & Circulation</ThemedText>
            <Card style={styles.metricsCard}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Feather name="heart" size={20} color={colors.danger} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.heartRate || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>bpm</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="activity" size={20} color={colors.primary} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.heartRateVariability || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>ms HRV</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="droplet" size={20} color={colors.primaryLight} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.bloodOxygenSaturation ? `${latestReading.bloodOxygenSaturation}%` : "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>SpO2</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="thermometer" size={20} color={colors.warning} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.bloodPressureSystolic && latestReading.bloodPressureDiastolic
                      ? `${latestReading.bloodPressureSystolic}/${latestReading.bloodPressureDiastolic}`
                      : "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>mmHg</ThemedText>
                </View>
              </View>
            </Card>

            <ThemedText style={[styles.categoryTitle, { color: colors.text }]}>Activity & Movement</ThemedText>
            <Card style={styles.metricsCard}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Feather name="navigation" size={20} color={colors.success} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.steps?.toLocaleString() || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>steps</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="zap" size={20} color={colors.warning} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.caloriesBurned || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>cal</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="clock" size={20} color={colors.primary} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.activeMinutes || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>active min</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="trending-up" size={20} color={colors.primaryLight} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.vo2Max || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>VO2 Max</ThemedText>
                </View>
              </View>
            </Card>

            <ThemedText style={[styles.categoryTitle, { color: colors.text }]}>Sleep & Recovery</ThemedText>
            <Card style={styles.metricsCard}>
              <View style={styles.metricsGrid}>
                <View style={styles.metricItem}>
                  <Feather name="moon" size={20} color={colors.primary} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.sleepDuration ? `${(latestReading.sleepDuration / 60).toFixed(1)}h` : "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>sleep</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="star" size={20} color={colors.warning} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.sleepQuality || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>quality</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="battery-charging" size={20} color={colors.success} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.recoveryScore || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>recovery</ThemedText>
                </View>
                <View style={styles.metricItem}>
                  <Feather name="frown" size={20} color={colors.danger} />
                  <ThemedText style={[styles.metricValue, { color: colors.text }]}>
                    {latestReading.stressLevel || "--"}
                  </ThemedText>
                  <ThemedText style={[styles.metricUnit, { color: colors.textSecondary }]}>stress</ThemedText>
                </View>
              </View>
            </Card>

            <ThemedText style={[styles.categoryTitle, { color: colors.text }]}>Reading History</ThemedText>
            {readings.slice(0, 5).map((reading) => (
              <Card key={reading.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <ThemedText style={[styles.historyDate, { color: colors.text }]}>
                    {formatDate(reading.recordedAt)}
                  </ThemedText>
                  {reading.deviceType ? (
                    <ThemedText style={[styles.deviceType, { color: colors.textSecondary }]}>
                      {reading.deviceType}
                    </ThemedText>
                  ) : null}
                </View>
                <View style={styles.historyMetrics}>
                  {reading.heartRate ? (
                    <ThemedText style={[styles.historyMetric, { color: colors.textSecondary }]}>
                      HR: {reading.heartRate} bpm
                    </ThemedText>
                  ) : null}
                  {reading.steps ? (
                    <ThemedText style={[styles.historyMetric, { color: colors.textSecondary }]}>
                      Steps: {reading.steps.toLocaleString()}
                    </ThemedText>
                  ) : null}
                  {reading.sleepDuration ? (
                    <ThemedText style={[styles.historyMetric, { color: colors.textSecondary }]}>
                      Sleep: {(reading.sleepDuration / 60).toFixed(1)}h
                    </ThemedText>
                  ) : null}
                </View>
              </Card>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="watch" size={64} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Wearable Data</ThemedText>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add your first reading from your wearable device or enter data manually
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <Pressable
        onPress={() => setAddModalVisible(true)}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + Spacing.xl }]}
      >
        <Feather name="plus" size={24} color={colors.buttonText} />
      </Pressable>

      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Reading</ThemedText>
            <Pressable onPress={() => setAddModalVisible(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <KeyboardAwareScrollViewCompat contentContainerStyle={styles.modalContent}>
            <ThemedText style={[styles.formSectionTitle, { color: colors.textSecondary }]}>Heart & Circulation</ThemedText>
            <View style={styles.formRow}>
              <MetricInput
                label="Heart Rate"
                value={formData.heartRate}
                onChangeText={(text) => setFormData({ ...formData, heartRate: text })}
                unit="bpm"
              />
              <MetricInput
                label="HRV"
                value={formData.heartRateVariability}
                onChangeText={(text) => setFormData({ ...formData, heartRateVariability: text })}
                unit="ms"
              />
            </View>
            <View style={styles.formRow}>
              <MetricInput
                label="SpO2"
                value={formData.bloodOxygenSaturation}
                onChangeText={(text) => setFormData({ ...formData, bloodOxygenSaturation: text })}
                unit="%"
                keyboardType="decimal-pad"
              />
              <MetricInput
                label="Resting HR"
                value={formData.restingHeartRate}
                onChangeText={(text) => setFormData({ ...formData, restingHeartRate: text })}
                unit="bpm"
              />
            </View>
            <View style={styles.formRow}>
              <MetricInput
                label="BP Systolic"
                value={formData.bloodPressureSystolic}
                onChangeText={(text) => setFormData({ ...formData, bloodPressureSystolic: text })}
                unit="mmHg"
              />
              <MetricInput
                label="BP Diastolic"
                value={formData.bloodPressureDiastolic}
                onChangeText={(text) => setFormData({ ...formData, bloodPressureDiastolic: text })}
                unit="mmHg"
              />
            </View>

            <ThemedText style={[styles.formSectionTitle, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Activity</ThemedText>
            <View style={styles.formRow}>
              <MetricInput
                label="Steps"
                value={formData.steps}
                onChangeText={(text) => setFormData({ ...formData, steps: text })}
              />
              <MetricInput
                label="Calories"
                value={formData.caloriesBurned}
                onChangeText={(text) => setFormData({ ...formData, caloriesBurned: text })}
                unit="cal"
              />
            </View>
            <View style={styles.formRow}>
              <MetricInput
                label="Active Minutes"
                value={formData.activeMinutes}
                onChangeText={(text) => setFormData({ ...formData, activeMinutes: text })}
                unit="min"
              />
              <MetricInput
                label="VO2 Max"
                value={formData.vo2Max}
                onChangeText={(text) => setFormData({ ...formData, vo2Max: text })}
                keyboardType="decimal-pad"
              />
            </View>

            <ThemedText style={[styles.formSectionTitle, { color: colors.textSecondary, marginTop: Spacing.lg }]}>Sleep & Recovery</ThemedText>
            <View style={styles.formRow}>
              <MetricInput
                label="Sleep Duration"
                value={formData.sleepDuration}
                onChangeText={(text) => setFormData({ ...formData, sleepDuration: text })}
                unit="min"
              />
              <MetricInput
                label="Sleep Quality"
                value={formData.sleepQuality}
                onChangeText={(text) => setFormData({ ...formData, sleepQuality: text })}
                unit="/100"
              />
            </View>
            <View style={styles.formRow}>
              <MetricInput
                label="Recovery Score"
                value={formData.recoveryScore}
                onChangeText={(text) => setFormData({ ...formData, recoveryScore: text })}
                unit="/100"
              />
              <MetricInput
                label="Stress Level"
                value={formData.stressLevel}
                onChangeText={(text) => setFormData({ ...formData, stressLevel: text })}
                unit="/100"
              />
            </View>

            <Pressable
              onPress={handleAddReading}
              disabled={addReadingMutation.isPending}
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: addReadingMutation.isPending ? 0.6 : 1 }]}
            >
              {addReadingMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.buttonText} />
              ) : (
                <ThemedText style={[styles.saveButtonText, { color: colors.buttonText }]}>Save Reading</ThemedText>
              )}
            </Pressable>
          </KeyboardAwareScrollViewCompat>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  timestamp: {
    ...Typography.small,
  },
  categoryTitle: {
    ...Typography.small,
    fontWeight: "600",
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metricsCard: {
    padding: Spacing.lg,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  metricItem: {
    width: "45%",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricValue: {
    ...Typography.h3,
    fontWeight: "700",
  },
  metricUnit: {
    ...Typography.caption,
  },
  historyCard: {
    padding: Spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  historyDate: {
    ...Typography.small,
    fontWeight: "600",
  },
  deviceType: {
    ...Typography.caption,
  },
  historyMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  historyMetric: {
    ...Typography.caption,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h4,
    marginTop: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    textAlign: "center",
    paddingHorizontal: Spacing.xl,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  formSectionTitle: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metricInputContainer: {
    flex: 1,
  },
  metricLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  metricInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metricInput: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    ...Typography.body,
  },
  unitText: {
    ...Typography.small,
    width: 40,
  },
  saveButton: {
    height: 50,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  saveButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
});
