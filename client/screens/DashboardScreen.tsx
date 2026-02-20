import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
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
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useNotifications } from "@/hooks/useNotifications";
import { useCheckinSettings } from "@/hooks/useCheckinSettings";

interface QuickAction {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  bg: string;
  route: keyof RootStackParamList;
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings: checkinSettings, formatTime } = useCheckinSettings();
  useNotifications(checkinSettings);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickActions: QuickAction[] = [
    {
      icon: "watch",
      label: "Wearable\nData",
      color: "#F59E0B",
      bg: "#F59E0B15",
      route: "WearableData",
    },
    {
      icon: "bar-chart-2",
      label: "Health\nReports",
      color: "#8B5CF6",
      bg: "#8B5CF615",
      route: "HealthReport",
    },
    {
      icon: "camera",
      label: "Visual\nAssessment",
      color: "#EC4899",
      bg: "#EC489915",
      route: "VisualAssessment",
    },
    {
      icon: "sun",
      label: "Alternative\nRemedies",
      color: "#10B981",
      bg: "#10B98115",
      route: "AlternativeMedicine",
    },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <View style={styles.headerLeft}>
          <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>
            {getGreeting()}
          </ThemedText>
          <ThemedText style={styles.userName}>
            {user?.name?.split(" ")[0] || "User"}
          </ThemedText>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.sosButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            navigation.navigate("SOS");
          }}
        >
          <Feather name="alert-triangle" size={18} color="#FFFFFF" />
          <ThemedText style={styles.sosLabel}>SOS</ThemedText>
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
        <Card
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            navigation.navigate("Arya", { mode: "checkin" });
          }}
          style={{ ...styles.checkinCard, borderColor: theme.primary + "30" }}
        >
          <View style={styles.checkinTop}>
            <View
              style={[
                styles.checkinIcon,
                { backgroundColor: theme.primary + "12" },
              ]}
            >
              <Feather
                name="message-circle"
                size={22}
                color={theme.primary}
              />
            </View>
            <View style={styles.checkinText}>
              <ThemedText style={styles.checkinTitle}>
                Daily Health Check-in
              </ThemedText>
              <ThemedText
                style={[styles.checkinSub, { color: theme.textSecondary }]}
              >
                {checkinSettings.enabled
                  ? `Scheduled at ${formatTime(checkinSettings.primaryTime)}`
                  : "Let ARYA record your vitals today"}
              </ThemedText>
            </View>
          </View>
          <View
            style={[styles.checkinBtn, { backgroundColor: theme.primary }]}
          >
            <ThemedText style={styles.checkinBtnText}>
              Start Check-in
            </ThemedText>
            <Feather name="arrow-right" size={16} color="#FFFFFF" />
          </View>
        </Card>

        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          QUICK ACTIONS
        </ThemedText>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <Card
              key={action.label}
              style={{ ...styles.actionCard, flex: 1 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                navigation.navigate(action.route);
              }}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: action.bg },
                ]}
              >
                <Feather name={action.icon} size={22} color={action.color} />
              </View>
              <ThemedText style={styles.actionLabel}>
                {action.label}
              </ThemedText>
            </Card>
          ))}
        </View>

        <ThemedText
          style={[styles.sectionLabel, { color: theme.textSecondary }]}
        >
          EXPLORE
        </ThemedText>

        <Card
          onPress={() => navigation.navigate("HealthReports")}
          style={styles.exploreCard}
        >
          <View style={styles.exploreRow}>
            <View
              style={[
                styles.exploreIcon,
                { backgroundColor: "#6366F115" },
              ]}
            >
              <Feather name="trending-up" size={20} color="#6366F1" />
            </View>
            <View style={styles.exploreText}>
              <ThemedText style={styles.exploreTitle}>
                Health Trends
              </ThemedText>
              <ThemedText
                style={[styles.exploreSub, { color: theme.textSecondary }]}
              >
                Track your health score over time
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </Card>

        <Card
          onPress={() => navigation.navigate("Arya")}
          style={styles.exploreCard}
        >
          <View style={styles.exploreRow}>
            <View
              style={[
                styles.exploreIcon,
                { backgroundColor: theme.primary + "12" },
              ]}
            >
              <Feather
                name="message-circle"
                size={20}
                color={theme.primary}
              />
            </View>
            <View style={styles.exploreText}>
              <ThemedText style={styles.exploreTitle}>
                Talk to ARYA
              </ThemedText>
              <ThemedText
                style={[styles.exploreSub, { color: theme.textSecondary }]}
              >
                AI symptom checker and health assistant
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.textSecondary}
            />
          </View>
        </Card>

        <Card
          onPress={() => navigation.navigate("WearableData")}
          style={{ ...styles.exploreCard, marginBottom: Spacing.md }}
        >
          <View style={styles.exploreRow}>
            <View
              style={[
                styles.exploreIcon,
                { backgroundColor: "#F59E0B15" },
              ]}
            >
              <Feather name="activity" size={20} color="#F59E0B" />
            </View>
            <View style={styles.exploreText}>
              <ThemedText style={styles.exploreTitle}>
                Add Vitals
              </ThemedText>
              <ThemedText
                style={[styles.exploreSub, { color: theme.textSecondary }]}
              >
                Manually log your health readings
              </ThemedText>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.textSecondary}
            />
          </View>
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
    alignItems: "flex-end",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    ...Typography.small,
    fontWeight: "500",
    marginBottom: 2,
  },
  userName: {
    ...Typography.h2,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.lg,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "#EF4444",
  },
  sosLabel: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  checkinCard: {
    padding: Spacing.xl,
    marginBottom: Spacing["2xl"],
    borderWidth: 1,
  },
  checkinTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  checkinIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  checkinText: {
    flex: 1,
  },
  checkinTitle: {
    ...Typography.body,
    fontWeight: "700",
    marginBottom: 2,
  },
  checkinSub: {
    ...Typography.small,
  },
  checkinBtn: {
    flexDirection: "row",
    height: 44,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkinBtnText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing["2xl"],
  },
  actionCard: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    ...Typography.caption,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 16,
  },
  exploreCard: {
    padding: 0,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  exploreRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  exploreIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  exploreText: {
    flex: 1,
  },
  exploreTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  exploreSub: {
    ...Typography.caption,
  },
});
