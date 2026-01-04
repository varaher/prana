import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { login, signup } = useAuth();
  
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"layperson" | "doctor">("layperson");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (isSignup && !name)) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (isSignup) {
        await signup(name, email, password, role);
      } else {
        await login(email, password, role);
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing["3xl"], paddingBottom: insets.bottom + Spacing["2xl"] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
            <ThemedText style={styles.title}>ErPrana</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Your Personal Health Assistant
            </ThemedText>
          </View>

          <View style={styles.form}>
            {isSignup && (
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Full Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Email</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Password</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    color: theme.text,
                    borderColor: theme.border,
                  },
                ]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>I am a</ThemedText>
              <View style={styles.roleContainer}>
                <Pressable
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === "layperson" ? theme.primary : theme.inputBackground,
                      borderColor: role === "layperson" ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setRole("layperson")}
                >
                  <ThemedText
                    style={[
                      styles.roleText,
                      { color: role === "layperson" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    Patient
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === "doctor" ? theme.primary : theme.inputBackground,
                      borderColor: role === "doctor" ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => setRole("doctor")}
                >
                  <ThemedText
                    style={[
                      styles.roleText,
                      { color: role === "doctor" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    Doctor
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {error ? (
              <ThemedText style={[styles.error, { color: theme.danger }]}>
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <ThemedText style={styles.submitText}>
                {isLoading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
              </ThemedText>
            </Pressable>

            <Pressable
              style={styles.switchButton}
              onPress={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
            >
              <ThemedText style={[styles.switchText, { color: theme.textSecondary }]}>
                {isSignup ? "Already have an account? " : "Don't have an account? "}
                <ThemedText style={{ color: theme.primary }}>
                  {isSignup ? "Sign In" : "Sign Up"}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.disclaimer}>
            <ThemedText style={[styles.disclaimerText, { color: theme.textSecondary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy. 
              ErPrana is not a replacement for professional medical advice.
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing["2xl"],
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["3xl"],
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    borderWidth: 1,
  },
  roleContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  roleButton: {
    flex: 1,
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  roleText: {
    ...Typography.body,
    fontWeight: "600",
  },
  error: {
    ...Typography.small,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  submitButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  submitText: {
    color: "#FFFFFF",
    ...Typography.body,
    fontWeight: "600",
  },
  switchButton: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  switchText: {
    ...Typography.body,
  },
  disclaimer: {
    marginTop: Spacing["2xl"],
    paddingTop: Spacing.lg,
  },
  disclaimerText: {
    ...Typography.caption,
    textAlign: "center",
  },
});
