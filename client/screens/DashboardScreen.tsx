import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

function MetricCard({
  title,
  value,
  unit,
  icon,
  color,
}: {
  title: string;
  value: string;
  unit: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}) {
  const { theme } = useTheme();

  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.metricUnit, { color: theme.textSecondary }]}>
        {unit}
      </ThemedText>
      <ThemedText style={[styles.metricTitle, { color: theme.textSecondary }]}>
        {title}
      </ThemedText>
    </Card>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSOS = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate("SOS");
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <View style={styles.headerLeft}>
          <ThemedText style={styles.greeting}>
            {getGreeting()}, {user?.name?.split(" ")[0] || "User"}
          </ThemedText>
          <View style={styles.roleContainer}>
            <View
              style={[
                styles.roleBadge,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <ThemedText style={[styles.roleText, { color: theme.primary }]}>
                {user?.role === "doctor" ? "Doctor" : "Patient"}
              </ThemedText>
            </View>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleSOS}
        >
          <Feather name="alert-triangle" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing["2xl"] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => navigation.navigate("HealthReports")}>
          <Card style={styles.healthScoreCard}>
            <View style={styles.healthScoreHeader}>
              <ThemedText style={styles.healthScoreTitle}>
                Today's Health Score
              </ThemedText>
              <View style={[styles.trendBadge, { backgroundColor: theme.success + "20" }]}>
                <Feather name="trending-up" size={14} color={theme.success} />
                <ThemedText style={[styles.trendText, { color: theme.success }]}>
                  +5%
                </ThemedText>
              </View>
            </View>
            <View style={styles.healthScoreValue}>
              <ThemedText style={[styles.scoreNumber, { color: theme.success }]}>
                85
              </ThemedText>
              <ThemedText style={[styles.scoreMax, { color: theme.textSecondary }]}>
                /100
              </ThemedText>
            </View>
            <View style={styles.healthScoreFooter}>
              <ThemedText style={[styles.healthScoreDesc, { color: theme.textSecondary }]}>
                Your vitals are looking great today!
              </ThemedText>
              <View style={styles.viewReportsButton}>
                <ThemedText style={[styles.viewReportsText, { color: theme.primary }]}>
                  View Reports
                </ThemedText>
                <Feather name="chevron-right" size={16} color={theme.primary} />
              </View>
            </View>
          </Card>
        </Pressable>

        <Card style={styles.syncCard}>
          <View style={styles.syncContent}>
            <View style={[styles.syncIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="watch" size={24} color={theme.warning} />
            </View>
            <View style={styles.syncTextContainer}>
              <ThemedText style={styles.syncTitle}>Connect Your Wearable</ThemedText>
              <ThemedText style={[styles.syncDesc, { color: theme.textSecondary }]}>
                Sync your health data for personalized insights
              </ThemedText>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText style={styles.syncButtonText}>Connect</ThemedText>
          </Pressable>
        </Card>

        <ThemedText style={styles.sectionTitle}>Your Vitals</ThemedText>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Heart Rate"
            value="72"
            unit="bpm"
            icon="heart"
            color={Colors.light.danger}
          />
          <MetricCard
            title="Steps"
            value="8,432"
            unit="steps"
            icon="activity"
            color={Colors.light.primary}
          />
          <MetricCard
            title="Sleep"
            value="7.5"
            unit="hours"
            icon="moon"
            color={Colors.light.primaryDark}
          />
          <MetricCard
            title="Calories"
            value="1,840"
            unit="kcal"
            icon="zap"
            color={Colors.light.warning}
          />
        </View>

        <ThemedText style={styles.sectionTitle}>Today's Medications</ThemedText>
        <Card style={styles.medicationCard}>
          <View style={styles.medicationItem}>
            <View style={[styles.medicationIcon, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check-circle" size={20} color={theme.success} />
            </View>
            <View style={styles.medicationInfo}>
              <ThemedText style={styles.medicationName}>Vitamin D</ThemedText>
              <ThemedText style={[styles.medicationTime, { color: theme.textSecondary }]}>
                8:00 AM - Taken
              </ThemedText>
            </View>
          </View>
          <View style={styles.medicationDivider} />
          <View style={styles.medicationItem}>
            <View style={[styles.medicationIcon, { backgroundColor: theme.warning + "20" }]}>
              <Feather name="clock" size={20} color={theme.warning} />
            </View>
            <View style={styles.medicationInfo}>
              <ThemedText style={styles.medicationName}>Omega-3</ThemedText>
              <ThemedText style={[styles.medicationTime, { color: theme.textSecondary }]}>
                2:00 PM - Upcoming
              </ThemedText>
            </View>
          </View>
        </Card>

        <ThemedText style={styles.sectionTitle}>Recent ARYA Insights</ThemedText>
        <Card style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <View style={[styles.insightIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="message-circle" size={20} color={theme.primary} />
            </View>
            <ThemedText style={[styles.insightDate, { color: theme.textSecondary }]}>
              Today, 9:30 AM
            </ThemedText>
          </View>
          <ThemedText style={styles.insightText}>
            Based on your symptoms, I recommend staying hydrated and resting. 
            Your vitals look stable.
          </ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.insightButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigation.navigate("Arya")}
          >
            <ThemedText style={[styles.insightButtonText, { color: theme.primary }]}>
              Continue Conversation
            </ThemedText>
            <Feather name="arrow-right" size={16} color={theme.primary} />
          </Pressable>
        </Card>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  roleContainer: {
    flexDirection: "row",
  },
  roleBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  sosButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  healthScoreCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
  },
  healthScoreHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  healthScoreTitle: {
    ...Typography.body,
    fontWeight: "600",
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  trendText: {
    ...Typography.caption,
    fontWeight: "600",
  },
  healthScoreValue: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.sm,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: "700",
  },
  scoreMax: {
    ...Typography.h4,
    marginLeft: 4,
  },
  healthScoreDesc: {
    ...Typography.small,
    flex: 1,
  },
  healthScoreFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewReportsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewReportsText: {
    ...Typography.small,
    fontWeight: "600",
  },
  syncCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  syncContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  syncIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  syncTextContainer: {
    flex: 1,
  },
  syncTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  syncDesc: {
    ...Typography.small,
  },
  syncButton: {
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  syncButtonText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
  sectionTitle: {
    ...Typography.h4,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricCard: {
    width: "47%",
    padding: Spacing.lg,
    alignItems: "center",
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  metricValue: {
    ...Typography.metric,
  },
  metricUnit: {
    ...Typography.caption,
  },
  metricTitle: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  medicationCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  medicationItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  medicationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    ...Typography.body,
    fontWeight: "600",
  },
  medicationTime: {
    ...Typography.small,
  },
  medicationDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.md,
  },
  insightCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  insightDate: {
    ...Typography.caption,
  },
  insightText: {
    ...Typography.body,
    marginBottom: Spacing.lg,
  },
  insightButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  insightButtonText: {
    ...Typography.body,
    fontWeight: "600",
  },
});
