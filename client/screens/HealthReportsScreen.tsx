import React, { useState, useMemo } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

type TimePeriod = "week" | "month" | "quarter" | "year";

interface WearableReading {
  id: number;
  userId: string;
  recordedAt: string;
  heartRate: number | null;
  heartRateVariability: number | null;
  bloodOxygenSaturation: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  respiratoryRate: number | null;
  bodyTemperature: number | null;
  steps: number | null;
  caloriesBurned: number | null;
  activeMinutes: number | null;
  sleepDuration: number | null;
  sleepQuality: number | null;
  stressLevel: number | null;
  vo2Max: number | null;
  recoveryScore: number | null;
  deviceType: string | null;
}

interface AggregatedMetrics {
  avgHeartRate: number | null;
  totalSteps: number | null;
  avgSleep: number | null;
  totalCalories: number | null;
  avgBpSystolic: number | null;
  avgBpDiastolic: number | null;
  avgStress: number | null;
  avgSpO2: number | null;
  readingCount: number;
}

const PERIODS: { key: TimePeriod; label: string; days: number }[] = [
  { key: "week", label: "7 Days", days: 7 },
  { key: "month", label: "30 Days", days: 30 },
  { key: "quarter", label: "90 Days", days: 90 },
  { key: "year", label: "1 Year", days: 365 },
];

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((s, v) => s + v, 0) / valid.length);
}

function sum(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0);
}

function MetricRow({
  icon,
  label,
  value,
  unit,
  color,
  trend,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string | number | null;
  unit: string;
  color: string;
  trend?: "up" | "down" | "stable" | null;
}) {
  const { theme } = useTheme();

  return (
    <View style={[styles.metricRow, { borderBottomColor: theme.borderLight }]}>
      <View style={[styles.metricIcon, { backgroundColor: color + "15" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.metricInfo}>
        <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <View style={styles.metricValueRow}>
          <ThemedText style={styles.metricValue}>{value !== null ? value : "--"}</ThemedText>
          <ThemedText style={[styles.metricUnit, { color: theme.textSecondary }]}>{unit}</ThemedText>
        </View>
      </View>
      {trend ? (
        <View
          style={[
            styles.trendIcon,
            {
              backgroundColor:
                trend === "up" ? Colors.light.success + "20" : trend === "down" ? Colors.light.danger + "20" : theme.borderLight,
            },
          ]}
        >
          <Feather
            name={trend === "up" ? "trending-up" : trend === "down" ? "trending-down" : "minus"}
            size={14}
            color={trend === "up" ? Colors.light.success : trend === "down" ? Colors.light.danger : theme.textSecondary}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function HealthReportsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");

  const { data: readings = [], isLoading } = useQuery<WearableReading[]>({
    queryKey: ["/api/user", user?.id, "wearable-readings"],
    enabled: !!user?.id,
  });

  const periodConfig = PERIODS.find((p) => p.key === selectedPeriod)!;

  const { current, previous } = useMemo(() => {
    const now = Date.now();
    const periodMs = periodConfig.days * 24 * 60 * 60 * 1000;

    const currentReadings = readings.filter((r) => {
      const t = new Date(r.recordedAt).getTime();
      return t >= now - periodMs;
    });

    const previousReadings = readings.filter((r) => {
      const t = new Date(r.recordedAt).getTime();
      return t >= now - periodMs * 2 && t < now - periodMs;
    });

    const aggregate = (data: WearableReading[]): AggregatedMetrics => ({
      avgHeartRate: avg(data.map((r) => r.heartRate)),
      totalSteps: sum(data.map((r) => r.steps)),
      avgSleep: avg(data.map((r) => (r.sleepDuration ? +(r.sleepDuration / 60).toFixed(1) : null))),
      totalCalories: sum(data.map((r) => r.caloriesBurned)),
      avgBpSystolic: avg(data.map((r) => r.bloodPressureSystolic)),
      avgBpDiastolic: avg(data.map((r) => r.bloodPressureDiastolic)),
      avgStress: avg(data.map((r) => r.stressLevel)),
      avgSpO2: avg(data.map((r) => r.bloodOxygenSaturation)),
      readingCount: data.length,
    });

    return {
      current: aggregate(currentReadings),
      previous: aggregate(previousReadings),
    };
  }, [readings, periodConfig]);

  const getTrend = (cur: number | null, prev: number | null): "up" | "down" | "stable" | null => {
    if (cur === null || prev === null) return null;
    const diff = cur - prev;
    if (Math.abs(diff) < 0.05 * prev) return "stable";
    return diff > 0 ? "up" : "down";
  };

  const dayReadings = useMemo(() => {
    const now = Date.now();
    const periodMs = periodConfig.days * 24 * 60 * 60 * 1000;
    const filtered = readings.filter((r) => new Date(r.recordedAt).getTime() >= now - periodMs);

    const grouped: { [key: string]: WearableReading[] } = {};
    filtered.forEach((r) => {
      const d = new Date(r.recordedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(r);
    });

    return Object.entries(grouped)
      .map(([date, items]) => ({
        date,
        heartRate: avg(items.map((i) => i.heartRate)),
        steps: sum(items.map((i) => i.steps)),
        sleep: avg(items.map((i) => (i.sleepDuration ? +(i.sleepDuration / 60).toFixed(1) : null))),
        calories: sum(items.map((i) => i.caloriesBurned)),
      }))
      .slice(0, 10);
  }, [readings, periodConfig]);

  const hasData = readings.length > 0;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Health Trends</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.periodSelector, { backgroundColor: theme.backgroundDefault }]}>
        {PERIODS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.periodButton, selectedPeriod === key && { backgroundColor: theme.primary }]}
            onPress={() => setSelectedPeriod(key)}
          >
            <ThemedText style={[styles.periodButtonText, { color: selectedPeriod === key ? "#FFFFFF" : theme.textSecondary }]}>
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !hasData ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "12" }]}>
            <Feather name="bar-chart-2" size={40} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Health Data Yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Add wearable readings or complete a daily check-in with ARYA to see your health trends here.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <ThemedText style={styles.summaryTitle}>
                {periodConfig.label} Summary
              </ThemedText>
              <View style={[styles.readingsBadge, { backgroundColor: theme.primary + "15" }]}>
                <ThemedText style={[styles.readingsText, { color: theme.primary }]}>
                  {current.readingCount} readings
                </ThemedText>
              </View>
            </View>

            {current.readingCount === 0 ? (
              <ThemedText style={[styles.noDataText, { color: theme.textSecondary }]}>
                No readings in this period. Try a different time range.
              </ThemedText>
            ) : (
              <>
                <MetricRow
                  icon="heart"
                  label="Avg Heart Rate"
                  value={current.avgHeartRate}
                  unit="bpm"
                  color="#EF4444"
                  trend={getTrend(current.avgHeartRate, previous.avgHeartRate)}
                />
                <MetricRow
                  icon="activity"
                  label="Total Steps"
                  value={current.totalSteps?.toLocaleString() ?? null}
                  unit="steps"
                  color="#2563EB"
                  trend={getTrend(current.totalSteps, previous.totalSteps)}
                />
                <MetricRow
                  icon="moon"
                  label="Avg Sleep"
                  value={current.avgSleep}
                  unit="hours"
                  color="#6366F1"
                  trend={getTrend(current.avgSleep, previous.avgSleep)}
                />
                <MetricRow
                  icon="zap"
                  label="Total Calories"
                  value={current.totalCalories?.toLocaleString() ?? null}
                  unit="kcal"
                  color="#F59E0B"
                  trend={getTrend(current.totalCalories, previous.totalCalories)}
                />
                <MetricRow
                  icon="thermometer"
                  label="Avg Blood Pressure"
                  value={current.avgBpSystolic !== null && current.avgBpDiastolic !== null ? `${current.avgBpSystolic}/${current.avgBpDiastolic}` : null}
                  unit="mmHg"
                  color="#2563EB"
                />
                <MetricRow
                  icon="droplet"
                  label="Avg SpO2"
                  value={current.avgSpO2 !== null ? `${current.avgSpO2}%` : null}
                  unit=""
                  color="#10B981"
                  trend={getTrend(current.avgSpO2, previous.avgSpO2)}
                />
                <MetricRow
                  icon="frown"
                  label="Avg Stress"
                  value={current.avgStress}
                  unit="/100"
                  color="#EF4444"
                  trend={getTrend(current.avgStress, previous.avgStress)}
                />
              </>
            )}
          </Card>

          {dayReadings.length > 0 ? (
            <>
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                DAILY BREAKDOWN
              </ThemedText>
              {dayReadings.map((data, index) => (
                <Card key={index} style={styles.breakdownCard}>
                  <View style={styles.breakdownHeader}>
                    <ThemedText style={styles.breakdownDate}>{data.date}</ThemedText>
                  </View>
                  <View style={styles.breakdownMetrics}>
                    {data.heartRate !== null ? (
                      <View style={styles.breakdownMetric}>
                        <Feather name="heart" size={13} color="#EF4444" />
                        <ThemedText style={styles.breakdownValue}>{data.heartRate}</ThemedText>
                      </View>
                    ) : null}
                    {data.steps !== null ? (
                      <View style={styles.breakdownMetric}>
                        <Feather name="activity" size={13} color="#2563EB" />
                        <ThemedText style={styles.breakdownValue}>{data.steps.toLocaleString()}</ThemedText>
                      </View>
                    ) : null}
                    {data.sleep !== null ? (
                      <View style={styles.breakdownMetric}>
                        <Feather name="moon" size={13} color="#6366F1" />
                        <ThemedText style={styles.breakdownValue}>{data.sleep}h</ThemedText>
                      </View>
                    ) : null}
                    {data.calories !== null ? (
                      <View style={styles.breakdownMetric}>
                        <Feather name="zap" size={13} color="#F59E0B" />
                        <ThemedText style={styles.breakdownValue}>{data.calories}</ThemedText>
                      </View>
                    ) : null}
                  </View>
                </Card>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </ThemedView>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h4,
    fontWeight: "600",
  },
  periodSelector: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  periodButtonText: {
    ...Typography.small,
    fontWeight: "600",
  },
  loadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h4,
  },
  readingsBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  readingsText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  noDataText: {
    ...Typography.body,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    ...Typography.small,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    ...Typography.body,
    fontWeight: "600",
  },
  metricUnit: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
  trendIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  breakdownCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  breakdownHeader: {
    marginBottom: Spacing.sm,
  },
  breakdownDate: {
    ...Typography.body,
    fontWeight: "600",
  },
  breakdownMetrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  breakdownMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  breakdownValue: {
    ...Typography.small,
    fontWeight: "500",
  },
});
