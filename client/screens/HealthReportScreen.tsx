import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface HealthReport {
  id: number;
  userId: string;
  reportType: string;
  periodStart: string;
  periodEnd: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  trends: string[];
  overallScore: number;
  heartHealthScore: number;
  sleepScore: number;
  activityScore: number;
  stressScore: number;
  createdAt: string;
}

const REPORT_TYPES = [
  { id: "daily", label: "Daily", icon: "sun" },
  { id: "weekly", label: "Weekly", icon: "calendar" },
  { id: "monthly", label: "Monthly", icon: "grid" },
  { id: "quarterly", label: "Quarterly", icon: "layers" },
  { id: "yearly", label: "Yearly", icon: "globe" },
];

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const { theme: colors } = useTheme();
  const getScoreColor = (s: number) => {
    if (s >= 80) return colors.success;
    if (s >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={styles.scoreCircle}>
      <View style={[styles.scoreRing, { borderColor: getScoreColor(score) }]}>
        <ThemedText style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}</ThemedText>
      </View>
      <ThemedText style={[styles.scoreLabel, { color: colors.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

export default function HealthReportScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedReportType, setSelectedReportType] = useState("daily");

  const { data: reports = [], isLoading } = useQuery<HealthReport[]>({
    queryKey: ["/api/user", user?.id, "health-reports"],
    enabled: !!user?.id,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const response = await apiRequest("POST", `/api/user/${user?.id}/health-reports/generate`, { reportType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "health-reports"] });
      setSelectedReportType("daily");
    },
    onError: (error: Error) => {
      console.error("Report generation failed:", error.message);
    },
  });

  const handleGenerateReport = (reportType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    generateReportMutation.mutate(reportType);
  };

  const latestReport = reports[0];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatPeriod = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
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
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + Spacing.lg, paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.generateCard}>
          <ThemedText style={styles.generateTitle}>Generate Health Report</ThemedText>
          <ThemedText style={[styles.generateSubtitle, { color: colors.textSecondary }]}>
            Get AI-powered insights from your wearable data
          </ThemedText>
          <View style={styles.reportTypesRow}>
            {REPORT_TYPES.map((type) => (
              <Pressable
                key={type.id}
                onPress={() => setSelectedReportType(type.id)}
                style={[
                  styles.reportTypeButton,
                  {
                    backgroundColor: selectedReportType === type.id ? colors.primary : colors.backgroundSecondary,
                  },
                ]}
              >
                <Feather
                  name={type.icon as any}
                  size={16}
                  color={selectedReportType === type.id ? colors.buttonText : colors.textSecondary}
                />
                <ThemedText
                  style={[
                    styles.reportTypeText,
                    { color: selectedReportType === type.id ? colors.buttonText : colors.textSecondary },
                  ]}
                >
                  {type.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => handleGenerateReport(selectedReportType)}
            disabled={generateReportMutation.isPending}
            style={[styles.generateButton, { backgroundColor: colors.primary, opacity: generateReportMutation.isPending ? 0.6 : 1 }]}
          >
            {generateReportMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.buttonText} />
            ) : (
              <>
                <Feather name="file-text" size={18} color={colors.buttonText} />
                <ThemedText style={[styles.generateButtonText, { color: colors.buttonText }]}>
                  Generate {REPORT_TYPES.find((t) => t.id === selectedReportType)?.label} Report
                </ThemedText>
              </>
            )}
          </Pressable>
          {generateReportMutation.isError ? (
            <ThemedText style={[styles.errorText, { color: colors.danger }]}>
              No wearable data found. Please add readings first.
            </ThemedText>
          ) : null}
        </Card>

        {latestReport ? (
          <>
            <ThemedText style={[styles.sectionHeader, { color: colors.text }]}>Latest Report</ThemedText>
            <Card style={styles.reportCard}>
              <View style={styles.reportHeader}>
                <View>
                  <ThemedText style={styles.reportType}>
                    {latestReport.reportType.charAt(0).toUpperCase() + latestReport.reportType.slice(1)} Report
                  </ThemedText>
                  <ThemedText style={[styles.reportPeriod, { color: colors.textSecondary }]}>
                    {formatPeriod(latestReport.periodStart, latestReport.periodEnd)}
                  </ThemedText>
                </View>
                <View style={[styles.overallScoreBadge, { backgroundColor: colors.primary + "20" }]}>
                  <ThemedText style={[styles.overallScoreValue, { color: colors.primary }]}>
                    {latestReport.overallScore}
                  </ThemedText>
                  <ThemedText style={[styles.overallScoreLabel, { color: colors.primary }]}>Overall</ThemedText>
                </View>
              </View>

              <View style={styles.scoresRow}>
                <ScoreCircle score={latestReport.heartHealthScore} label="Heart" color={colors.danger} />
                <ScoreCircle score={latestReport.sleepScore} label="Sleep" color={colors.primary} />
                <ScoreCircle score={latestReport.activityScore} label="Activity" color={colors.success} />
                <ScoreCircle score={latestReport.stressScore} label="Stress" color={colors.warning} />
              </View>

              <View style={styles.summarySection}>
                <ThemedText style={styles.summaryTitle}>Summary</ThemedText>
                <ThemedText style={[styles.summaryText, { color: colors.textSecondary }]}>
                  {latestReport.summary}
                </ThemedText>
              </View>
            </Card>

            {latestReport.insights && latestReport.insights.length > 0 ? (
              <Card style={styles.insightsCard}>
                <View style={styles.insightHeader}>
                  <Feather name="zap" size={20} color={colors.primary} />
                  <ThemedText style={styles.insightTitle}>Key Insights</ThemedText>
                </View>
                {latestReport.insights.map((insight, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightBullet, { backgroundColor: colors.primary }]} />
                    <ThemedText style={[styles.insightText, { color: colors.text }]}>{insight}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {latestReport.recommendations && latestReport.recommendations.length > 0 ? (
              <Card style={styles.insightsCard}>
                <View style={styles.insightHeader}>
                  <Feather name="target" size={20} color={colors.success} />
                  <ThemedText style={styles.insightTitle}>Recommendations</ThemedText>
                </View>
                {latestReport.recommendations.map((rec, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightBullet, { backgroundColor: colors.success }]} />
                    <ThemedText style={[styles.insightText, { color: colors.text }]}>{rec}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {latestReport.riskFactors && latestReport.riskFactors.length > 0 ? (
              <Card style={{ ...styles.insightsCard, borderLeftWidth: 3, borderLeftColor: colors.danger }}>
                <View style={styles.insightHeader}>
                  <Feather name="alert-triangle" size={20} color={colors.danger} />
                  <ThemedText style={styles.insightTitle}>Risk Factors</ThemedText>
                </View>
                {latestReport.riskFactors.map((risk, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightBullet, { backgroundColor: colors.danger }]} />
                    <ThemedText style={[styles.insightText, { color: colors.text }]}>{risk}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {latestReport.trends && latestReport.trends.length > 0 ? (
              <Card style={styles.insightsCard}>
                <View style={styles.insightHeader}>
                  <Feather name="trending-up" size={20} color={colors.primaryLight} />
                  <ThemedText style={styles.insightTitle}>Trends</ThemedText>
                </View>
                {latestReport.trends.map((trend, index) => (
                  <View key={index} style={styles.insightItem}>
                    <View style={[styles.insightBullet, { backgroundColor: colors.primaryLight }]} />
                    <ThemedText style={[styles.insightText, { color: colors.text }]}>{trend}</ThemedText>
                  </View>
                ))}
              </Card>
            ) : null}

            {reports.length > 1 ? (
              <>
                <ThemedText style={[styles.sectionHeader, { color: colors.text, marginTop: Spacing.lg }]}>
                  Previous Reports
                </ThemedText>
                {reports.slice(1, 5).map((report) => (
                  <Card key={report.id} style={styles.previousReportCard}>
                    <View style={styles.previousReportHeader}>
                      <View>
                        <ThemedText style={styles.previousReportType}>
                          {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)}
                        </ThemedText>
                        <ThemedText style={[styles.previousReportDate, { color: colors.textSecondary }]}>
                          {formatDate(report.createdAt)}
                        </ThemedText>
                      </View>
                      <View style={styles.previousScores}>
                        <ThemedText style={[styles.previousScoreText, { color: colors.primary }]}>
                          Score: {report.overallScore}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText
                      style={[styles.previousSummary, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {report.summary}
                    </ThemedText>
                  </Card>
                ))}
              </>
            ) : null}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Feather name="file-text" size={64} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>No Reports Yet</ThemedText>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              Add wearable data and generate your first personalized health report
            </ThemedText>
          </View>
        )}
      </ScrollView>
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
  generateCard: {
    padding: Spacing.lg,
  },
  generateTitle: {
    ...Typography.h4,
    marginBottom: Spacing.xs,
  },
  generateSubtitle: {
    ...Typography.small,
    marginBottom: Spacing.lg,
  },
  reportTypesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  reportTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  reportTypeText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: 48,
    borderRadius: BorderRadius.md,
  },
  generateButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
  errorText: {
    ...Typography.small,
    textAlign: "center",
    marginTop: Spacing.md,
  },
  sectionHeader: {
    ...Typography.small,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
  },
  reportCard: {
    padding: Spacing.lg,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  reportType: {
    ...Typography.h4,
  },
  reportPeriod: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  overallScoreBadge: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  overallScoreValue: {
    ...Typography.h2,
    fontWeight: "700",
  },
  overallScoreLabel: {
    ...Typography.caption,
  },
  scoresRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  scoreCircle: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  scoreRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    ...Typography.body,
    fontWeight: "700",
  },
  scoreLabel: {
    ...Typography.caption,
  },
  summarySection: {
    gap: Spacing.xs,
  },
  summaryTitle: {
    ...Typography.small,
    fontWeight: "600",
  },
  summaryText: {
    ...Typography.body,
    lineHeight: 22,
  },
  insightsCard: {
    padding: Spacing.lg,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  insightTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  insightText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
  previousReportCard: {
    padding: Spacing.md,
  },
  previousReportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  previousReportType: {
    ...Typography.body,
    fontWeight: "600",
  },
  previousReportDate: {
    ...Typography.caption,
  },
  previousScores: {
    flexDirection: "row",
  },
  previousScoreText: {
    ...Typography.small,
    fontWeight: "600",
  },
  previousSummary: {
    ...Typography.small,
    lineHeight: 18,
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
});
