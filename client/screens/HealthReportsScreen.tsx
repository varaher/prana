import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const HEALTH_DATA_KEY = "@erprana_health_data";

type TimePeriod = "hourly" | "monthly" | "quarterly" | "yearly";

interface HealthMetric {
  timestamp: number;
  heartRate: number;
  steps: number;
  sleep: number;
  calories: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  weight: number;
  bloodSugar: number;
}

interface AggregatedData {
  period: string;
  avgHeartRate: number;
  totalSteps: number;
  avgSleep: number;
  totalCalories: number;
  avgBloodPressure: string;
  avgWeight: number;
  avgBloodSugar: number;
}

const generateSampleData = (): HealthMetric[] => {
  const data: HealthMetric[] = [];
  const now = Date.now();
  for (let i = 0; i < 365; i++) {
    const dayOffset = i * 24 * 60 * 60 * 1000;
    for (let h = 0; h < 24; h += 4) {
      data.push({
        timestamp: now - dayOffset - h * 60 * 60 * 1000,
        heartRate: 65 + Math.floor(Math.random() * 20),
        steps: Math.floor(Math.random() * 500),
        sleep: h < 8 ? Math.random() * 2 : 0,
        calories: Math.floor(Math.random() * 150),
        bloodPressureSystolic: 110 + Math.floor(Math.random() * 20),
        bloodPressureDiastolic: 70 + Math.floor(Math.random() * 15),
        weight: 68 + Math.random() * 2,
        bloodSugar: 90 + Math.floor(Math.random() * 20),
      });
    }
  }
  return data;
};

const aggregateData = (data: HealthMetric[], period: TimePeriod): AggregatedData[] => {
  const grouped: { [key: string]: HealthMetric[] } = {};
  
  data.forEach(metric => {
    const date = new Date(metric.timestamp);
    let key: string;
    
    switch (period) {
      case "hourly":
        const hourOffset = Math.floor((Date.now() - metric.timestamp) / (1000 * 60 * 60));
        if (hourOffset < 24) {
          key = `${hourOffset}h ago`;
        } else {
          return;
        }
        break;
      case "monthly":
        if (Date.now() - metric.timestamp > 30 * 24 * 60 * 60 * 1000) return;
        key = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        break;
      case "quarterly":
        if (Date.now() - metric.timestamp > 90 * 24 * 60 * 60 * 1000) return;
        const weekNum = Math.floor((Date.now() - metric.timestamp) / (7 * 24 * 60 * 60 * 1000));
        key = `Week ${12 - weekNum}`;
        break;
      case "yearly":
        key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        break;
      default:
        key = date.toDateString();
    }
    
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(metric);
  });
  
  return Object.entries(grouped)
    .map(([period, metrics]) => {
      const avgHeartRate = Math.round(metrics.reduce((sum, m) => sum + m.heartRate, 0) / metrics.length);
      const totalSteps = metrics.reduce((sum, m) => sum + m.steps, 0);
      const avgSleep = +(metrics.reduce((sum, m) => sum + m.sleep, 0) / Math.max(metrics.filter(m => m.sleep > 0).length, 1)).toFixed(1);
      const totalCalories = metrics.reduce((sum, m) => sum + m.calories, 0);
      const avgSystolic = Math.round(metrics.reduce((sum, m) => sum + m.bloodPressureSystolic, 0) / metrics.length);
      const avgDiastolic = Math.round(metrics.reduce((sum, m) => sum + m.bloodPressureDiastolic, 0) / metrics.length);
      const avgWeight = +(metrics.reduce((sum, m) => sum + m.weight, 0) / metrics.length).toFixed(1);
      const avgBloodSugar = Math.round(metrics.reduce((sum, m) => sum + m.bloodSugar, 0) / metrics.length);
      
      return {
        period,
        avgHeartRate,
        totalSteps,
        avgSleep,
        totalCalories,
        avgBloodPressure: `${avgSystolic}/${avgDiastolic}`,
        avgWeight,
        avgBloodSugar,
      };
    })
    .slice(0, period === "hourly" ? 24 : period === "monthly" ? 30 : period === "quarterly" ? 12 : 12);
};

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
  value: string | number;
  unit: string;
  color: string;
  trend?: "up" | "down" | "stable";
}) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.metricRow}>
      <View style={[styles.metricIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <View style={styles.metricInfo}>
        <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
        <View style={styles.metricValueRow}>
          <ThemedText style={styles.metricValue}>{value}</ThemedText>
          <ThemedText style={[styles.metricUnit, { color: theme.textSecondary }]}>{unit}</ThemedText>
        </View>
      </View>
      {trend ? (
        <View style={[styles.trendIcon, { backgroundColor: trend === "up" ? Colors.light.success + "20" : trend === "down" ? Colors.light.danger + "20" : theme.border }]}>
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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("monthly");
  const [healthData, setHealthData] = useState<HealthMetric[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);

  useEffect(() => {
    loadHealthData();
  }, []);

  useEffect(() => {
    if (healthData.length > 0) {
      setAggregatedData(aggregateData(healthData, selectedPeriod));
    }
  }, [healthData, selectedPeriod]);

  const loadHealthData = async () => {
    try {
      const stored = await AsyncStorage.getItem(HEALTH_DATA_KEY);
      if (stored) {
        setHealthData(JSON.parse(stored));
      } else {
        const sample = generateSampleData();
        setHealthData(sample);
        await AsyncStorage.setItem(HEALTH_DATA_KEY, JSON.stringify(sample));
      }
    } catch (error) {
      console.error("Error loading health data:", error);
      setHealthData(generateSampleData());
    }
  };

  const periods: { key: TimePeriod; label: string }[] = [
    { key: "hourly", label: "Hourly" },
    { key: "monthly", label: "Monthly" },
    { key: "quarterly", label: "Quarterly" },
    { key: "yearly", label: "Yearly" },
  ];

  const latestData = aggregatedData[0];
  const previousData = aggregatedData[1];

  const getTrend = (current: number, previous: number): "up" | "down" | "stable" => {
    if (!previous) return "stable";
    const diff = current - previous;
    if (Math.abs(diff) < 0.05 * previous) return "stable";
    return diff > 0 ? "up" : "down";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Health Reports</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.periodSelector}>
        {periods.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[
              styles.periodButton,
              selectedPeriod === key && { backgroundColor: theme.primary },
            ]}
            onPress={() => setSelectedPeriod(key)}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                { color: selectedPeriod === key ? "#FFFFFF" : theme.textSecondary },
              ]}
            >
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.summaryCard}>
          <ThemedText style={styles.summaryTitle}>
            {selectedPeriod === "hourly" ? "Last 24 Hours" : 
             selectedPeriod === "monthly" ? "This Month" :
             selectedPeriod === "quarterly" ? "This Quarter" : "This Year"} Summary
          </ThemedText>
          
          {latestData ? (
            <>
              <MetricRow
                icon="heart"
                label="Avg Heart Rate"
                value={latestData.avgHeartRate}
                unit="bpm"
                color={Colors.light.danger}
                trend={previousData ? getTrend(latestData.avgHeartRate, previousData.avgHeartRate) : undefined}
              />
              <MetricRow
                icon="activity"
                label="Total Steps"
                value={latestData.totalSteps.toLocaleString()}
                unit="steps"
                color={Colors.light.primary}
                trend={previousData ? getTrend(latestData.totalSteps, previousData.totalSteps) : undefined}
              />
              <MetricRow
                icon="moon"
                label="Avg Sleep"
                value={latestData.avgSleep}
                unit="hours"
                color={Colors.light.primaryDark}
                trend={previousData ? getTrend(latestData.avgSleep, previousData.avgSleep) : undefined}
              />
              <MetricRow
                icon="zap"
                label="Total Calories"
                value={latestData.totalCalories.toLocaleString()}
                unit="kcal"
                color={Colors.light.warning}
                trend={previousData ? getTrend(latestData.totalCalories, previousData.totalCalories) : undefined}
              />
              <MetricRow
                icon="thermometer"
                label="Avg Blood Pressure"
                value={latestData.avgBloodPressure}
                unit="mmHg"
                color={Colors.light.primary}
              />
              <MetricRow
                icon="droplet"
                label="Avg Blood Sugar"
                value={latestData.avgBloodSugar}
                unit="mg/dL"
                color={Colors.light.success}
                trend={previousData ? getTrend(latestData.avgBloodSugar, previousData.avgBloodSugar) : undefined}
              />
              <MetricRow
                icon="user"
                label="Avg Weight"
                value={latestData.avgWeight}
                unit="kg"
                color={Colors.light.textSecondary}
                trend={previousData ? getTrend(latestData.avgWeight, previousData.avgWeight) : undefined}
              />
            </>
          ) : (
            <ThemedText style={[styles.noDataText, { color: theme.textSecondary }]}>
              No data available for this period
            </ThemedText>
          )}
        </Card>

        <ThemedText style={styles.sectionTitle}>Detailed Breakdown</ThemedText>
        
        {aggregatedData.slice(0, 10).map((data, index) => (
          <Card key={index} style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <ThemedText style={styles.breakdownPeriod}>{data.period}</ThemedText>
              <View style={[styles.healthBadge, { backgroundColor: Colors.light.success + "20" }]}>
                <Feather name="check-circle" size={12} color={Colors.light.success} />
                <ThemedText style={[styles.healthBadgeText, { color: Colors.light.success }]}>
                  Healthy
                </ThemedText>
              </View>
            </View>
            <View style={styles.breakdownMetrics}>
              <View style={styles.breakdownMetric}>
                <Feather name="heart" size={14} color={Colors.light.danger} />
                <ThemedText style={styles.breakdownValue}>{data.avgHeartRate}</ThemedText>
              </View>
              <View style={styles.breakdownMetric}>
                <Feather name="activity" size={14} color={Colors.light.primary} />
                <ThemedText style={styles.breakdownValue}>{data.totalSteps.toLocaleString()}</ThemedText>
              </View>
              <View style={styles.breakdownMetric}>
                <Feather name="moon" size={14} color={Colors.light.primaryDark} />
                <ThemedText style={styles.breakdownValue}>{data.avgSleep}h</ThemedText>
              </View>
              <View style={styles.breakdownMetric}>
                <Feather name="zap" size={14} color={Colors.light.warning} />
                <ThemedText style={styles.breakdownValue}>{data.totalCalories}</ThemedText>
              </View>
            </View>
          </Card>
        ))}

        {aggregatedData.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No health data available yet.
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Connect a wearable device or manually log your vitals to see reports.
            </ThemedText>
          </Card>
        ) : null}
      </ScrollView>
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
    backgroundColor: Colors.light.cardBackground,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
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
  noDataText: {
    ...Typography.body,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  breakdownCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  breakdownPeriod: {
    ...Typography.body,
    fontWeight: "600",
  },
  healthBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  healthBadgeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  breakdownMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  emptyCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
});
