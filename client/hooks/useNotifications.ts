import { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/useAuth";
import type { CheckinSettings } from "@/hooks/useCheckinSettings";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function scheduleCheckinNotifications(settings: CheckinSettings) {
  try {
    if (Platform.OS === "web") return;

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Health Check-in",
        body: "Time to log your health data with ARYA. It only takes 2 minutes.",
        data: { screen: "Arya", mode: "checkin" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.primaryTime.hour,
        minute: settings.primaryTime.minute,
      },
    });

    if (settings.reminderEnabled) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Health Check-in Reminder",
          body: "You haven't logged your health data today. Quick check-in with ARYA?",
          data: { screen: "Arya", mode: "checkin" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: settings.reminderTime.hour,
          minute: settings.reminderTime.minute,
        },
      });
    }
  } catch (error) {
    console.log("Notification scheduling error:", error);
  }
}

export function useNotifications(settings?: CheckinSettings) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !settings) return;
    scheduleCheckinNotifications(settings);
  }, [isAuthenticated, settings]);
}
