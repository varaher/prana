import React, { useState, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const MEDICATIONS_KEY = "@erprana_medications";

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  taken: { [date: string]: string[] };
}

const defaultMedications: Medication[] = [
  {
    id: "1",
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    times: ["08:00"],
    startDate: "2024-01-01",
    taken: {},
  },
  {
    id: "2",
    name: "Omega-3",
    dosage: "1000mg",
    frequency: "Twice daily",
    times: ["08:00", "20:00"],
    startDate: "2024-01-01",
    taken: {},
  },
  {
    id: "3",
    name: "Magnesium",
    dosage: "400mg",
    frequency: "Once daily",
    times: ["21:00"],
    startDate: "2024-06-01",
    taken: {},
  },
];

export default function MedicationsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      const stored = await AsyncStorage.getItem(MEDICATIONS_KEY);
      if (stored) {
        setMedications(JSON.parse(stored));
      } else {
        setMedications(defaultMedications);
        await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(defaultMedications));
      }
    } catch (error) {
      console.error("Error loading medications:", error);
      setMedications(defaultMedications);
    }
  };

  const toggleMedicationTaken = async (medId: string, time: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const today = new Date().toISOString().split("T")[0];
    
    const updatedMeds = medications.map((med) => {
      if (med.id === medId) {
        const todayTaken = med.taken[today] || [];
        const newTaken = todayTaken.includes(time)
          ? todayTaken.filter((t) => t !== time)
          : [...todayTaken, time];
        return { ...med, taken: { ...med.taken, [today]: newTaken } };
      }
      return med;
    });

    setMedications(updatedMeds);
    await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(updatedMeds));
  };

  const getTimeLabel = (time: string) => {
    const [hours] = time.split(":");
    const hour = parseInt(hours, 10);
    if (hour < 12) return "Morning";
    if (hour < 17) return "Afternoon";
    if (hour < 21) return "Evening";
    return "Night";
  };

  const isTaken = (med: Medication, time: string) => {
    const today = new Date().toISOString().split("T")[0];
    return med.taken[today]?.includes(time) || false;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const groupedSchedule = medications.reduce((acc, med) => {
    med.times.forEach((time) => {
      const label = getTimeLabel(time);
      if (!acc[label]) acc[label] = [];
      acc[label].push({ ...med, scheduleTime: time });
    });
    return acc;
  }, {} as { [key: string]: (Medication & { scheduleTime: string })[] });

  const renderMedicationItem = (med: Medication & { scheduleTime: string }) => {
    const taken = isTaken(med, med.scheduleTime);

    return (
      <Pressable
        key={`${med.id}-${med.scheduleTime}`}
        style={({ pressed }) => [
          styles.medicationItem,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() => toggleMedicationTaken(med.id, med.scheduleTime)}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: taken ? theme.success : "transparent",
              borderColor: taken ? theme.success : theme.border,
            },
          ]}
        >
          {taken ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
        </View>
        <View style={styles.medicationInfo}>
          <ThemedText style={[styles.medicationName, taken && styles.takenText]}>
            {med.name}
          </ThemedText>
          <ThemedText style={[styles.medicationDosage, { color: theme.textSecondary }]}>
            {med.dosage} - {formatTime(med.scheduleTime)}
          </ThemedText>
        </View>
        {taken ? (
          <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
            <ThemedText style={[styles.statusText, { color: theme.success }]}>
              Taken
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  const scheduleOrder = ["Morning", "Afternoon", "Evening", "Night"];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <ThemedText style={styles.title}>Medications</ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.iconButton,
            { backgroundColor: theme.backgroundSecondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="calendar" size={20} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Today's Progress
          </ThemedText>
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryValue, { color: theme.success }]}>
              {medications.reduce((acc, med) => {
                const today = new Date().toISOString().split("T")[0];
                return acc + (med.taken[today]?.length || 0);
              }, 0)}
            </ThemedText>
            <ThemedText style={[styles.summaryTotal, { color: theme.textSecondary }]}>
              / {medications.reduce((acc, med) => acc + med.times.length, 0)} doses
            </ThemedText>
          </View>
        </Card>
      </View>

      <FlatList
        data={scheduleOrder.filter((time) => groupedSchedule[time]?.length > 0)}
        keyExtractor={(item) => item}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: timeLabel }) => (
          <View style={styles.timeGroup}>
            <View style={styles.timeHeader}>
              <Feather
                name={
                  timeLabel === "Morning"
                    ? "sunrise"
                    : timeLabel === "Afternoon"
                    ? "sun"
                    : timeLabel === "Evening"
                    ? "sunset"
                    : "moon"
                }
                size={16}
                color={theme.textSecondary}
              />
              <ThemedText style={[styles.timeLabel, { color: theme.textSecondary }]}>
                {timeLabel}
              </ThemedText>
            </View>
            <Card style={styles.timeCard}>
              {groupedSchedule[timeLabel].map((med) => renderMedicationItem(med))}
            </Card>
          </View>
        )}
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
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate("AddMedication");
        }}
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
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    padding: Spacing.lg,
  },
  summaryLabel: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: "700",
  },
  summaryTotal: {
    ...Typography.body,
    marginLeft: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
  },
  timeGroup: {
    marginBottom: Spacing.lg,
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timeLabel: {
    ...Typography.small,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timeCard: {
    padding: Spacing.md,
  },
  medicationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
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
  takenText: {
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  medicationDosage: {
    ...Typography.small,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: "600",
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
