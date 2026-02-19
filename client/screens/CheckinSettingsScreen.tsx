import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useCheckinSettings } from "@/hooks/useCheckinSettings";
import { scheduleCheckinNotifications } from "@/hooks/useNotifications";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

type TimeField = "primaryTime" | "reminderTime";

export default function CheckinSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { settings, updateSettings, formatTime } = useCheckinSettings();

  const [showPicker, setShowPicker] = useState<TimeField | null>(null);

  const getDateFromTime = (time: { hour: number; minute: number }) => {
    const date = new Date();
    date.setHours(time.hour, time.minute, 0, 0);
    return date;
  };

  const handleTimeChange = async (
    field: TimeField,
    event: { type: string },
    selectedDate?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowPicker(null);
    }
    if (event.type === "dismissed") {
      setShowPicker(null);
      return;
    }
    if (selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const newSettings = await updateSettings({
        [field]: {
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        },
      });
      scheduleCheckinNotifications(newSettings);
    }
  };

  const handleToggleEnabled = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = await updateSettings({ enabled: value });
    scheduleCheckinNotifications(newSettings);
  };

  const handleToggleReminder = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = await updateSettings({ reminderEnabled: value });
    scheduleCheckinNotifications(newSettings);
  };

  const handlePickerDone = () => {
    setShowPicker(null);
  };

  const renderTimePicker = (field: TimeField) => {
    const time = settings[field];

    if (Platform.OS === "web") {
      return (
        <View style={styles.webTimePickerRow}>
          <ScrollableNumberPicker
            value={time.hour > 12 ? time.hour - 12 : time.hour === 0 ? 12 : time.hour}
            min={1}
            max={12}
            onChange={async (val) => {
              const isPM = time.hour >= 12;
              let newHour = val;
              if (isPM) {
                newHour = val === 12 ? 12 : val + 12;
              } else {
                newHour = val === 12 ? 0 : val;
              }
              const newSettings = await updateSettings({
                [field]: { hour: newHour, minute: time.minute },
              });
              scheduleCheckinNotifications(newSettings);
            }}
            theme={theme}
          />
          <ThemedText style={styles.timeSeparator}>:</ThemedText>
          <ScrollableNumberPicker
            value={time.minute}
            min={0}
            max={59}
            step={5}
            padZero
            onChange={async (val) => {
              const newSettings = await updateSettings({
                [field]: { hour: time.hour, minute: val },
              });
              scheduleCheckinNotifications(newSettings);
            }}
            theme={theme}
          />
          <Pressable
            style={[styles.ampmButton, { backgroundColor: theme.primary + "15" }]}
            onPress={async () => {
              const newHour = time.hour >= 12 ? time.hour - 12 : time.hour + 12;
              const newSettings = await updateSettings({
                [field]: { hour: newHour, minute: time.minute },
              });
              scheduleCheckinNotifications(newSettings);
            }}
          >
            <ThemedText style={[styles.ampmText, { color: theme.primary }]}>
              {time.hour >= 12 ? "PM" : "AM"}
            </ThemedText>
          </Pressable>
        </View>
      );
    }

    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.xl,
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: theme.primary + "15" }]}>
              <Feather name="info" size={18} color={theme.primary} />
            </View>
            <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
              Set a specific time for your daily check-in so ARYA can collect
              your health data consistently. This makes your health reports
              more accurate and meaningful over time.
            </ThemedText>
          </View>
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          CHECK-IN NOTIFICATIONS
        </ThemedText>
        <Card style={styles.settingsCard}>
          <View style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIcon, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="bell" size={18} color={theme.primary} />
              </View>
              <View>
                <ThemedText style={styles.settingTitle}>
                  Daily Reminders
                </ThemedText>
                <ThemedText style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                  Get notified at your preferred time
                </ThemedText>
              </View>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: theme.border, true: theme.primary + "60" }}
              thumbColor={settings.enabled ? theme.primary : theme.textSecondary}
            />
          </View>

          {settings.enabled ? (
            <>
              <View style={[styles.timeSettingRow, { borderBottomColor: theme.borderLight }]}>
                <View style={styles.timeSettingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: "#F59E0B20" }]}>
                    <Feather name="sunrise" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <ThemedText style={styles.settingTitle}>
                      Check-in Time
                    </ThemedText>
                    <ThemedText style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                      When should ARYA ask for your data?
                    </ThemedText>
                  </View>
                </View>
                {Platform.OS !== "web" ? (
                  <Pressable
                    style={[styles.timeButton, { backgroundColor: theme.primary + "10" }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPicker("primaryTime");
                    }}
                  >
                    <ThemedText style={[styles.timeButtonText, { color: theme.primary }]}>
                      {formatTime(settings.primaryTime)}
                    </ThemedText>
                  </Pressable>
                ) : null}
              </View>
              {Platform.OS === "web" ? (
                <View style={[styles.pickerContainer, { borderBottomColor: theme.borderLight }]}>
                  {renderTimePicker("primaryTime")}
                </View>
              ) : null}

              <View style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, { backgroundColor: "#EF444420" }]}>
                    <Feather name="bell" size={18} color="#EF4444" />
                  </View>
                  <View>
                    <ThemedText style={styles.settingTitle}>
                      Evening Reminder
                    </ThemedText>
                    <ThemedText style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                      Remind if not completed
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={settings.reminderEnabled}
                  onValueChange={handleToggleReminder}
                  trackColor={{ false: theme.border, true: theme.primary + "60" }}
                  thumbColor={settings.reminderEnabled ? theme.primary : theme.textSecondary}
                />
              </View>

              {settings.reminderEnabled ? (
                <>
                  <View style={styles.timeSettingRow}>
                    <View style={styles.timeSettingLeft}>
                      <View style={[styles.settingIcon, { backgroundColor: "#8B5CF620" }]}>
                        <Feather name="sunset" size={18} color="#8B5CF6" />
                      </View>
                      <View>
                        <ThemedText style={styles.settingTitle}>
                          Reminder Time
                        </ThemedText>
                        <ThemedText style={[styles.settingSubtitle, { color: theme.textSecondary }]}>
                          Follow-up if you missed it
                        </ThemedText>
                      </View>
                    </View>
                    {Platform.OS !== "web" ? (
                      <Pressable
                        style={[styles.timeButton, { backgroundColor: theme.primary + "10" }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowPicker("reminderTime");
                        }}
                      >
                        <ThemedText style={[styles.timeButtonText, { color: theme.primary }]}>
                          {formatTime(settings.reminderTime)}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                  {Platform.OS === "web" ? (
                    <View style={styles.pickerContainer}>
                      {renderTimePicker("reminderTime")}
                    </View>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </Card>

        <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
          WHY CONSISTENT TIMING MATTERS
        </ThemedText>
        <Card style={styles.tipCard}>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: "#10B98120" }]}>
              <Feather name="bar-chart-2" size={16} color="#10B981" />
            </View>
            <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
              Recording data at the same time daily creates reliable baselines
              for your health reports
            </ThemedText>
          </View>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: "#3B82F620" }]}>
              <Feather name="watch" size={16} color="#3B82F6" />
            </View>
            <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
              Wearable data syncs continuously, but your manual check-in at a
              fixed time anchors the daily snapshot
            </ThemedText>
          </View>
          <View style={styles.tipRow}>
            <View style={[styles.tipIcon, { backgroundColor: "#F59E0B20" }]}>
              <Feather name="trending-up" size={16} color="#F59E0B" />
            </View>
            <ThemedText style={[styles.tipText, { color: theme.textSecondary }]}>
              Doctors prefer data collected at consistent times for accurate
              trend analysis
            </ThemedText>
          </View>
        </Card>

        {Platform.OS !== "web" && showPicker ? (
          <Modal transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, { backgroundColor: theme.backgroundRoot }]}>
                <View style={styles.modalHeader}>
                  <ThemedText style={styles.modalTitle}>
                    {showPicker === "primaryTime"
                      ? "Set Check-in Time"
                      : "Set Reminder Time"}
                  </ThemedText>
                  <Pressable
                    onPress={handlePickerDone}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <ThemedText style={[styles.modalDone, { color: theme.primary }]}>
                      Done
                    </ThemedText>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={getDateFromTime(settings[showPicker])}
                  mode="time"
                  display="spinner"
                  onChange={(event, date) => handleTimeChange(showPicker, event, date)}
                  minuteInterval={5}
                />
              </View>
            </View>
          </Modal>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function ScrollableNumberPicker({
  value,
  min,
  max,
  step = 1,
  padZero = false,
  onChange,
  theme,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  padZero?: boolean;
  onChange: (val: number) => void;
  theme: Record<string, string>;
}) {
  const values: number[] = [];
  for (let i = min; i <= max; i += step) {
    values.push(i);
  }

  const currentIndex = values.indexOf(value);
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0;

  const goUp = () => {
    const newIndex = effectiveIndex > 0 ? effectiveIndex - 1 : values.length - 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(values[newIndex]);
  };

  const goDown = () => {
    const newIndex = effectiveIndex < values.length - 1 ? effectiveIndex + 1 : 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(values[newIndex]);
  };

  const displayVal = padZero
    ? values[effectiveIndex].toString().padStart(2, "0")
    : values[effectiveIndex].toString();

  return (
    <View style={styles.numberPicker}>
      <Pressable
        onPress={goUp}
        style={({ pressed }) => [
          styles.pickerArrow,
          { opacity: pressed ? 0.5 : 1 },
        ]}
      >
        <Feather name="chevron-up" size={22} color={theme.textSecondary} />
      </Pressable>
      <View style={[styles.pickerValue, { backgroundColor: theme.primary + "10" }]}>
        <ThemedText style={[styles.pickerValueText, { color: theme.primary }]}>
          {displayVal}
        </ThemedText>
      </View>
      <Pressable
        onPress={goDown}
        style={({ pressed }) => [
          styles.pickerArrow,
          { opacity: pressed ? 0.5 : 1 },
        ]}
      >
        <Feather name="chevron-down" size={22} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  infoCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  infoText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
  sectionLabel: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    letterSpacing: 0.5,
  },
  settingsCard: {
    marginBottom: Spacing.xl,
    padding: 0,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: "500",
  },
  settingSubtitle: {
    ...Typography.caption,
    marginTop: 2,
  },
  timeSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  timeSettingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  timeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  timeButtonText: {
    ...Typography.body,
    fontWeight: "700",
  },
  pickerContainer: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  webTimePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: "700",
  },
  ampmButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginLeft: Spacing.sm,
  },
  ampmText: {
    ...Typography.body,
    fontWeight: "700",
  },
  numberPicker: {
    alignItems: "center",
    gap: 4,
  },
  pickerArrow: {
    padding: 4,
  },
  pickerValue: {
    width: 52,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerValueText: {
    fontSize: 20,
    fontWeight: "700",
  },
  tipCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  tipRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  tipText: {
    ...Typography.small,
    flex: 1,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalDone: {
    ...Typography.body,
    fontWeight: "600",
  },
});
