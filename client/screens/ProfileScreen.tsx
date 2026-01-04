import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface SettingsItem {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  action?: () => void;
  rightIcon?: keyof typeof Feather.glyphMap;
  color?: string;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { user, logout, updateUser } = useAuth();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out? Your data will be synced before logging out.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: logout,
        },
      ]
    );
  };

  const handleSwitchMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newRole = user?.role === "doctor" ? "layperson" : "doctor";
    updateUser({ role: newRole });
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "Devices",
      items: [
        {
          icon: "watch",
          title: "Wearables & Devices",
          subtitle: "Connect Apple Watch, Fitbit, etc.",
          rightIcon: "chevron-right",
        },
      ],
    },
    {
      title: "Emergency",
      items: [
        {
          icon: "users",
          title: "Emergency Contacts",
          subtitle: "Add contacts for emergencies",
          rightIcon: "chevron-right",
        },
        {
          icon: "heart",
          title: "Medical ID",
          subtitle: "Blood type, allergies, conditions",
          rightIcon: "chevron-right",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: "bell",
          title: "Notifications",
          subtitle: "Medication reminders, alerts",
          rightIcon: "chevron-right",
        },
        {
          icon: "globe",
          title: "Units & Language",
          subtitle: "Metric, Imperial, Language",
          rightIcon: "chevron-right",
        },
        {
          icon: "repeat",
          title: "Switch Mode",
          subtitle: `Currently: ${user?.role === "doctor" ? "Doctor" : "Patient"}`,
          action: handleSwitchMode,
          rightIcon: "chevron-right",
        },
      ],
    },
    {
      title: "Privacy & Safety",
      items: [
        {
          icon: "shield",
          title: "Privacy Settings",
          subtitle: "Data sharing, consent",
          rightIcon: "chevron-right",
        },
        {
          icon: "file-text",
          title: "Terms of Service",
          rightIcon: "external-link",
        },
        {
          icon: "lock",
          title: "Privacy Policy",
          rightIcon: "external-link",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: "log-out",
          title: "Log Out",
          action: handleLogout,
          color: theme.danger,
        },
        {
          icon: "trash-2",
          title: "Delete Account",
          color: theme.danger,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem, isLast: boolean) => (
    <Pressable
      key={item.title}
      style={({ pressed }) => [
        styles.settingsItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: theme.borderLight },
        { opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={item.action}
    >
      <View
        style={[
          styles.settingsIcon,
          { backgroundColor: (item.color || theme.primary) + "20" },
        ]}
      >
        <Feather
          name={item.icon}
          size={18}
          color={item.color || theme.primary}
        />
      </View>
      <View style={styles.settingsInfo}>
        <ThemedText
          style={[styles.settingsTitle, item.color && { color: item.color }]}
        >
          {item.title}
        </ThemedText>
        {item.subtitle ? (
          <ThemedText style={[styles.settingsSubtitle, { color: theme.textSecondary }]}>
            {item.subtitle}
          </ThemedText>
        ) : null}
      </View>
      {item.rightIcon ? (
        <Feather name={item.rightIcon} size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing["2xl"],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}>
              <ThemedText style={[styles.avatarText, { color: theme.primary }]}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </ThemedText>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.editAvatarButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Feather name="camera" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
          <ThemedText style={styles.userName}>{user?.name || "User"}</ThemedText>
          <ThemedText style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email || "user@example.com"}
          </ThemedText>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: theme.primary + "20" },
            ]}
          >
            <Feather
              name={user?.role === "doctor" ? "briefcase" : "user"}
              size={14}
              color={theme.primary}
            />
            <ThemedText style={[styles.roleText, { color: theme.primary }]}>
              {user?.role === "doctor" ? "Doctor" : "Patient"}
            </ThemedText>
          </View>
        </Card>

        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </ThemedText>
            <Card style={styles.sectionCard}>
              {section.items.map((item, index) =>
                renderSettingsItem(item, index === section.items.length - 1)
              )}
            </Card>
          </View>
        ))}

        <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
          ErPrana v1.0.0
        </ThemedText>
      </ScrollView>
    </ThemedView>
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
  profileCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  editAvatarButton: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    ...Typography.small,
    fontWeight: "600",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.body,
    fontWeight: "500",
  },
  settingsSubtitle: {
    ...Typography.small,
    marginTop: 2,
  },
  version: {
    ...Typography.caption,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
});
