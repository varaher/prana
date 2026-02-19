import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/hooks/useAuth";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function useNotifications() {
  const { isAuthenticated } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || initialized.current) return;
    initialized.current = true;

    async function setup() {
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

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Daily Health Check-in",
            body: "Good morning! Time to log yesterday's health data with ARYA. It only takes 2 minutes.",
            data: { screen: "Arya", mode: "checkin" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 9,
            minute: 0,
          },
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Health Check-in Reminder",
            body: "You haven't logged your health data today. Quick check-in with ARYA?",
            data: { screen: "Arya", mode: "checkin" },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20,
            minute: 0,
          },
        });
      } catch (error) {
        console.log("Notification setup error:", error);
      }
    }

    setup();
  }, [isAuthenticated]);
}
