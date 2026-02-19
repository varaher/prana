import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CHECKIN_SETTINGS_KEY = "@erprana_checkin_settings";

export interface CheckinSettings {
  enabled: boolean;
  primaryTime: { hour: number; minute: number };
  reminderTime: { hour: number; minute: number };
  reminderEnabled: boolean;
}

const DEFAULT_SETTINGS: CheckinSettings = {
  enabled: true,
  primaryTime: { hour: 9, minute: 0 },
  reminderTime: { hour: 20, minute: 0 },
  reminderEnabled: true,
};

export function useCheckinSettings() {
  const [settings, setSettings] = useState<CheckinSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(CHECKIN_SETTINGS_KEY);
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.log("Error loading checkin settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(async (updates: Partial<CheckinSettings>) => {
    try {
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      await AsyncStorage.setItem(CHECKIN_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    } catch (error) {
      console.log("Error saving checkin settings:", error);
      return settings;
    }
  }, [settings]);

  const formatTime = useCallback((time: { hour: number; minute: number }) => {
    const period = time.hour >= 12 ? "PM" : "AM";
    const displayHour = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour;
    const displayMinute = time.minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  }, []);

  return { settings, isLoading, updateSettings, formatTime };
}
