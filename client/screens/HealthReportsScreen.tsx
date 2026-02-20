import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

type TimePeriod = "week" | "month" | "quarter" | "year";

interface InsightItem {
  title: string;
  description: string;
  type: "positive" | "neutral" | "concern";
}

interface WatchItem {
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
}

interface WellnessScore {
  score: number;
  label: string;
  explanation: string;
}

interface NarrativeResponse {
  period: string;
  periodLabel: string;
  readingCount: number;
  narrative: {
    healthStory: string;
    keyInsights: InsightItem[];
    areasToWatch: WatchItem[];
    wellnessScore: WellnessScore;
    actionPlan: string[];
  };
}

interface WearableReading {
  id: number;
  userId: string;
  recordedAt: string;
  heartRate: number | null;
  steps: number | null;
  sleepDuration: number | null;
  caloriesBurned: number | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  bloodOxygenSaturation: number | null;
  stressLevel: number | null;
}

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
  { key: "quarter", label: "90 Days" },
  { key: "year", label: "1 Year" },
];

function WellnessScoreRing({ score, label, explanation, theme }: WellnessScore & { theme: any }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return Colors.light.success;
    if (s >= 60) return Colors.light.primary;
    if (s >= 40) return Colors.light.warning;
    return Colors.light.danger;
  };

  const color = getScoreColor(score);

  return (
    <Card style={styles.scoreCard}>
      <View style={styles.scoreContent}>
        <View style={[styles.scoreRing, { borderColor: color }]}>
          <ThemedText style={[styles.scoreNumber, { color }]}>{score}</ThemedText>
          <ThemedText style={[styles.scoreOutOf, { color: theme.textSecondary }]}>/100</ThemedText>
        </View>
        <View style={styles.scoreInfo}>
          <View style={[styles.scoreLabelBadge, { backgroundColor: color + "18" }]}>
            <ThemedText style={[styles.scoreLabelText, { color }]}>{label}</ThemedText>
          </View>
          <ThemedText style={[styles.scoreExplanation, { color: theme.textSecondary }]}>
            {explanation}
          </ThemedText>
        </View>
      </View>
    </Card>
  );
}

function InsightCard({ item, theme }: { item: InsightItem; theme: any }) {
  const getConfig = (type: string) => {
    switch (type) {
      case "positive":
        return { icon: "check-circle" as const, color: Colors.light.success, bg: Colors.light.success + "12" };
      case "concern":
        return { icon: "alert-circle" as const, color: Colors.light.warning, bg: Colors.light.warning + "12" };
      default:
        return { icon: "info" as const, color: Colors.light.primary, bg: Colors.light.primary + "12" };
    }
  };

  const config = getConfig(item.type);

  return (
    <View style={[styles.insightItem, { borderBottomColor: theme.borderLight }]}>
      <View style={[styles.insightIcon, { backgroundColor: config.bg }]}>
        <Feather name={config.icon} size={16} color={config.color} />
      </View>
      <View style={styles.insightText}>
        <ThemedText style={styles.insightTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.insightDesc, { color: theme.textSecondary }]}>
          {item.description}
        </ThemedText>
      </View>
    </View>
  );
}

function WatchCard({ item, theme }: { item: WatchItem; theme: any }) {
  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high": return Colors.light.danger;
      case "medium": return Colors.light.warning;
      default: return Colors.light.primary;
    }
  };

  const color = getPriorityColor(item.priority);

  return (
    <View style={[styles.watchItem, { borderLeftColor: color }]}>
      <ThemedText style={styles.watchTitle}>{item.title}</ThemedText>
      <ThemedText style={[styles.watchDesc, { color: theme.textSecondary }]}>
        {item.description}
      </ThemedText>
    </View>
  );
}

export default function HealthReportsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");
  const [narrativeData, setNarrativeData] = useState<NarrativeResponse | null>(null);

  const { data: readings = [], isLoading: readingsLoading } = useQuery<WearableReading[]>({
    queryKey: ["/api/user", user?.id, "wearable-readings"],
    enabled: !!user?.id,
  });

  const hasData = readings.length > 0;

  const narrativeMutation = useMutation({
    mutationFn: async (period: TimePeriod) => {
      const url = new URL(`/api/user/${user?.id}/health-trends/narrative`, getApiUrl());
      const res = await apiRequest("POST", url.toString(), { period });
      return res.json();
    },
    onSuccess: (data: NarrativeResponse) => {
      setNarrativeData(data);
    },
  });

  const handleGenerateNarrative = () => {
    setNarrativeData(null);
    narrativeMutation.mutate(selectedPeriod);
  };

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    setNarrativeData(null);
  };

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
            onPress={() => handlePeriodChange(key)}
          >
            <ThemedText style={[styles.periodButtonText, { color: selectedPeriod === key ? "#FFFFFF" : theme.textSecondary }]}>
              {label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {readingsLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !hasData ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: theme.primary + "12" }]}>
            <Feather name="book-open" size={40} color={theme.primary} />
          </View>
          <ThemedText style={styles.emptyTitle}>No Health Story Yet</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Add wearable readings or complete a daily check-in with ARYA to get your personalized health narrative.
          </ThemedText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing["2xl"] }]}
          showsVerticalScrollIndicator={false}
        >
          {!narrativeData && !narrativeMutation.isPending ? (
            <Card style={styles.generateCard}>
              <View style={[styles.generateIcon, { backgroundColor: theme.primary + "12" }]}>
                <Feather name="file-text" size={32} color={theme.primary} />
              </View>
              <ThemedText style={styles.generateTitle}>Your Health Story</ThemedText>
              <ThemedText style={[styles.generateSubtitle, { color: theme.textSecondary }]}>
                ARYA will analyze your health data from the {PERIODS.find(p => p.key === selectedPeriod)?.label.toLowerCase()} and write a personalized summary in plain language - just like a friendly doctor explaining your results.
              </ThemedText>
              <View style={[styles.dataPreview, { backgroundColor: theme.backgroundDefault }]}>
                <Feather name="database" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.dataPreviewText, { color: theme.textSecondary }]}>
                  {readings.length} health readings available
                </ThemedText>
              </View>
              <Pressable
                style={[styles.generateButton, { backgroundColor: theme.primary }]}
                onPress={handleGenerateNarrative}
              >
                <Feather name="zap" size={18} color="#FFFFFF" />
                <ThemedText style={styles.generateButtonText}>Generate My Health Story</ThemedText>
              </Pressable>
            </Card>
          ) : null}

          {narrativeMutation.isPending ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={[styles.loadingText, { marginTop: Spacing.lg }]}>
                ARYA is reading your health data...
              </ThemedText>
              <ThemedText style={[styles.loadingSubtext, { color: theme.textSecondary }]}>
                Writing your personalized health narrative
              </ThemedText>
            </Card>
          ) : null}

          {narrativeMutation.isError ? (
            <Card style={styles.errorCard}>
              <Feather name="alert-triangle" size={24} color={Colors.light.danger} />
              <ThemedText style={[styles.errorText, { color: Colors.light.danger }]}>
                {(narrativeMutation.error as any)?.message?.includes("No health data")
                  ? "No health data found for this time period. Try a different range."
                  : "Could not generate your health story. Please try again."}
              </ThemedText>
              <Pressable
                style={[styles.retryButton, { borderColor: theme.primary }]}
                onPress={handleGenerateNarrative}
              >
                <ThemedText style={[styles.retryButtonText, { color: theme.primary }]}>Try Again</ThemedText>
              </Pressable>
            </Card>
          ) : null}

          {narrativeData ? (
            <>
              <WellnessScoreRing
                score={narrativeData.narrative.wellnessScore.score}
                label={narrativeData.narrative.wellnessScore.label}
                explanation={narrativeData.narrative.wellnessScore.explanation}
                theme={theme}
              />

              <Card style={styles.storyCard}>
                <View style={styles.storyHeader}>
                  <View style={[styles.storyIconWrap, { backgroundColor: theme.primary + "12" }]}>
                    <Feather name="book-open" size={18} color={theme.primary} />
                  </View>
                  <View>
                    <ThemedText style={styles.storyTitle}>Your Health Story</ThemedText>
                    <ThemedText style={[styles.storyPeriod, { color: theme.textSecondary }]}>
                      {narrativeData.periodLabel} - {narrativeData.readingCount} readings
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.storyText, { color: theme.text }]}>
                  {narrativeData.narrative.healthStory}
                </ThemedText>
              </Card>

              {narrativeData.narrative.keyInsights.length > 0 ? (
                <>
                  <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    KEY INSIGHTS
                  </ThemedText>
                  <Card style={styles.insightsCard}>
                    {narrativeData.narrative.keyInsights.map((insight, i) => (
                      <InsightCard key={i} item={insight} theme={theme} />
                    ))}
                  </Card>
                </>
              ) : null}

              {narrativeData.narrative.areasToWatch.length > 0 ? (
                <>
                  <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    AREAS TO WATCH
                  </ThemedText>
                  <Card style={styles.watchCard}>
                    {narrativeData.narrative.areasToWatch.map((item, i) => (
                      <WatchCard key={i} item={item} theme={theme} />
                    ))}
                  </Card>
                </>
              ) : null}

              {narrativeData.narrative.actionPlan.length > 0 ? (
                <>
                  <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                    YOUR ACTION PLAN
                  </ThemedText>
                  <Card style={styles.actionCard}>
                    {narrativeData.narrative.actionPlan.map((action, i) => (
                      <View key={i} style={[styles.actionItem, i < narrativeData.narrative.actionPlan.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.borderLight }]}>
                        <View style={[styles.actionNumber, { backgroundColor: theme.primary + "15" }]}>
                          <ThemedText style={[styles.actionNumberText, { color: theme.primary }]}>{i + 1}</ThemedText>
                        </View>
                        <ThemedText style={[styles.actionText, { color: theme.text }]}>{action}</ThemedText>
                      </View>
                    ))}
                  </Card>
                </>
              ) : null}

              <Pressable
                style={[styles.regenerateButton, { borderColor: theme.borderLight }]}
                onPress={handleGenerateNarrative}
              >
                <Feather name="refresh-cw" size={16} color={theme.textSecondary} />
                <ThemedText style={[styles.regenerateText, { color: theme.textSecondary }]}>
                  Regenerate Story
                </ThemedText>
              </Pressable>
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
  generateCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  generateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  generateTitle: {
    ...Typography.h4,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  generateSubtitle: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  dataPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  dataPreviewText: {
    ...Typography.small,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    borderRadius: BorderRadius.md,
    width: "100%",
  },
  generateButtonText: {
    ...Typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loadingCard: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  loadingText: {
    ...Typography.body,
    fontWeight: "600",
  },
  loadingSubtext: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  errorCard: {
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    textAlign: "center",
  },
  retryButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  retryButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  scoreCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  scoreContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: "700",
  },
  scoreOutOf: {
    ...Typography.caption,
    marginTop: -4,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabelBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  scoreLabelText: {
    ...Typography.small,
    fontWeight: "700",
  },
  scoreExplanation: {
    ...Typography.body,
    lineHeight: 20,
  },
  storyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  storyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  storyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  storyTitle: {
    ...Typography.body,
    fontWeight: "700",
  },
  storyPeriod: {
    ...Typography.caption,
  },
  storyText: {
    ...Typography.body,
    lineHeight: 24,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  insightsCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  insightText: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  insightDesc: {
    ...Typography.small,
    lineHeight: 20,
  },
  watchCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  watchItem: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.md,
  },
  watchTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 4,
  },
  watchDesc: {
    ...Typography.small,
    lineHeight: 20,
  },
  actionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  actionNumberText: {
    ...Typography.small,
    fontWeight: "700",
  },
  actionText: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  regenerateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  regenerateText: {
    ...Typography.small,
    fontWeight: "600",
  },
});
