import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, FlatList } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type TabType = "history" | "consultations" | "tests" | "immunizations";

interface Record {
  id: string;
  title: string;
  date: string;
  category: string;
  icon: keyof typeof Feather.glyphMap;
}

const mockRecords: { [key in TabType]: Record[] } = {
  history: [
    { id: "1", title: "Hypertension", date: "Diagnosed 2020", category: "Chronic Condition", icon: "heart" },
    { id: "2", title: "Appendectomy", date: "March 2018", category: "Surgery", icon: "scissors" },
    { id: "3", title: "Penicillin Allergy", date: "Since childhood", category: "Allergy", icon: "alert-circle" },
  ],
  consultations: [
    { id: "1", title: "ARYA Consultation", date: "Today, 9:30 AM", category: "Headache, Fatigue", icon: "message-circle" },
    { id: "2", title: "ARYA Consultation", date: "Yesterday, 3:15 PM", category: "Back Pain", icon: "message-circle" },
    { id: "3", title: "Dr. Smith Visit", date: "Dec 15, 2024", category: "Annual Checkup", icon: "user" },
  ],
  tests: [
    { id: "1", title: "Complete Blood Count", date: "Dec 10, 2024", category: "Lab Test", icon: "droplet" },
    { id: "2", title: "Chest X-Ray", date: "Nov 20, 2024", category: "Imaging", icon: "image" },
    { id: "3", title: "Lipid Panel", date: "Oct 5, 2024", category: "Lab Test", icon: "activity" },
  ],
  immunizations: [
    { id: "1", title: "COVID-19 Booster", date: "Sep 2024", category: "Vaccine", icon: "shield" },
    { id: "2", title: "Flu Shot", date: "Oct 2024", category: "Vaccine", icon: "shield" },
    { id: "3", title: "Tetanus Booster", date: "2020", category: "Vaccine", icon: "shield" },
  ],
};

const tabs: { key: TabType; label: string }[] = [
  { key: "history", label: "Medical History" },
  { key: "consultations", label: "Consultations" },
  { key: "tests", label: "Test Results" },
  { key: "immunizations", label: "Immunizations" },
];

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<TabType>("history");

  const handleAddRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("AddRecord");
  };

  const renderRecord = ({ item }: { item: Record }) => (
    <Card style={styles.recordCard}>
      <View style={[styles.recordIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={item.icon} size={20} color={theme.primary} />
      </View>
      <View style={styles.recordInfo}>
        <ThemedText style={styles.recordTitle}>{item.title}</ThemedText>
        <ThemedText style={[styles.recordCategory, { color: theme.textSecondary }]}>
          {item.category}
        </ThemedText>
        <ThemedText style={[styles.recordDate, { color: theme.textSecondary }]}>
          {item.date}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Card>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.title}>Health Records</ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="search" size={20} color={theme.text} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="filter" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        style={styles.tabsScrollView}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? theme.primary : theme.backgroundSecondary,
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === tab.key ? "#FFFFFF" : theme.text },
              ]}
            >
              {tab.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={mockRecords[activeTab]}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="file-text" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No records found
            </ThemedText>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={handleAddRecord}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
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
  title: {
    ...Typography.h2,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tabsScrollView: {
    flexGrow: 0,
    marginBottom: Spacing.lg,
  },
  tabsContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabText: {
    ...Typography.small,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  recordCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  recordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    ...Typography.body,
    fontWeight: "600",
    marginBottom: 2,
  },
  recordCategory: {
    ...Typography.small,
    marginBottom: 2,
  },
  recordDate: {
    ...Typography.caption,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    ...Typography.body,
    marginTop: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
});
