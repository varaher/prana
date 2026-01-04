import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ARYA_GREETING = `Hello! I'm ARYA, your personal health assistant. 

I'm here to help you understand your symptoms and provide guidance. Please describe what you're experiencing, and I'll ask relevant questions to better understand your situation.

Remember: I'm here to help, but I'm not a replacement for professional medical care. If you're experiencing a medical emergency, please call emergency services immediately.

What brings you here today?`;

const SYSTEM_PROMPT = `You are ARYA, an AI health assistant for the ErPrana app. Your role is to help users understand their symptoms and provide medical guidance.

CONVERSATION APPROACH:
1. Start by understanding the Chief Complaint - what is the main symptom?
2. Ask about Vitals if relevant (any recent measurements like temperature, blood pressure, heart rate)
3. Gather History of Present Illness (HPI): onset, location, duration, character, aggravating/alleviating factors, radiation, timing, severity (1-10)
4. Ask about Past Medical History (PMHx), medications, allergies if relevant
5. Consider the 9-system review: Constitutional, Cardiovascular, Respiratory, Gastrointestinal, Genitourinary, Musculoskeletal, Neurological, Psychiatric, Skin

RESPONSE GUIDELINES:
- Ask ONE focused question at a time, don't overwhelm the user
- Be empathetic and professional
- Use simple, non-medical language when possible
- Remember previous answers - don't repeat questions
- When you have enough information, provide:
  * Up to 5 provisional diagnoses with likelihood
  * Triage risk level (Green: self-care, Yellow: see doctor soon, Orange: urgent care, Red: emergency)
  * Specific recommendations

EMERGENCY DETECTION:
If symptoms suggest: chest pain with shortness of breath, severe allergic reaction, stroke symptoms (FAST), severe bleeding, loss of consciousness, difficulty breathing - immediately advise to call emergency services.

SAFETY DISCLAIMER:
Always remind users that you provide guidance only and are not a replacement for professional medical advice.`;

export default function AryaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: ARYA_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/arya/chat", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: SYSTEM_PROMPT,
          userContext: user ? {
            name: user.name,
            role: user.role,
            conditions: user.conditions,
            allergies: user.allergies,
          } : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                assistantContent += data.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContent }
                      : m
                  )
                );
              }
              if (data.emergency) {
                setIsEmergency(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            } catch (e) {
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment. If you're experiencing a medical emergency, please call emergency services immediately.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
          {
            backgroundColor: isUser
              ? theme.primary
              : isDark
              ? theme.backgroundSecondary
              : theme.backgroundDefault,
          },
        ]}
      >
        {!isUser && (
          <View style={styles.aryaHeader}>
            <View style={[styles.aryaIcon, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="activity" size={14} color={theme.primary} />
            </View>
            <ThemedText style={[styles.aryaName, { color: theme.primary }]}>
              ARYA
            </ThemedText>
          </View>
        )}
        <ThemedText
          style={[
            styles.messageText,
            { color: isUser ? "#FFFFFF" : theme.text },
          ]}
        >
          {item.content}
        </ThemedText>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: theme.backgroundRoot }]}
          />
        )}
        <View style={styles.headerContent}>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <View style={[styles.aryaHeaderIcon, { backgroundColor: theme.primary }]}>
              <Feather name="activity" size={16} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.headerTitle}>ARYA</ThemedText>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="more-vertical" size={24} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {isEmergency && (
        <View style={[styles.emergencyBanner, { backgroundColor: theme.danger }]}>
          <Feather name="alert-triangle" size={20} color="#FFFFFF" />
          <ThemedText style={styles.emergencyText}>
            Emergency Detected - Seek immediate medical care
          </ThemedText>
          <Pressable
            style={styles.emergencyButton}
            onPress={() => {
            }}
          >
            <ThemedText style={styles.emergencyButtonText}>Call 911</ThemedText>
          </Pressable>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messageList,
          { paddingBottom: Spacing["3xl"] },
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isLoading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.typingText, { color: theme.textSecondary }]}>
            ARYA is thinking...
          </ThemedText>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: insets.bottom + Spacing.sm,
              backgroundColor: theme.backgroundRoot,
              borderTopColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.inputWrapper,
              { backgroundColor: theme.inputBackground, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Describe your symptoms..."
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? theme.primary : theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Feather
                name="send"
                size={18}
                color={inputText.trim() ? "#FFFFFF" : theme.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={styles.disclaimer}>
        <ThemedText style={[styles.disclaimerText, { color: theme.textSecondary }]}>
          ARYA is not a replacement for professional medical advice
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 10,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  aryaHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h4,
  },
  emergencyBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emergencyText: {
    flex: 1,
    color: "#FFFFFF",
    ...Typography.small,
    fontWeight: "600",
  },
  emergencyButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emergencyButtonText: {
    color: Colors.light.danger,
    ...Typography.small,
    fontWeight: "700",
  },
  messageList: {
    padding: Spacing.lg,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    borderBottomRightRadius: Spacing.xs,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: Spacing.xs,
  },
  aryaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  aryaIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  aryaName: {
    ...Typography.small,
    fontWeight: "700",
  },
  messageText: {
    ...Typography.body,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  typingText: {
    ...Typography.small,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disclaimer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  disclaimerText: {
    ...Typography.caption,
    textAlign: "center",
  },
});
