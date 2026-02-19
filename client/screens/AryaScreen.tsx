import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ARYA_GREETING = `Namaste! I'm ARYA, your personal health assistant powered by Sarvam AI.

I'm here to listen and help you understand your health concerns. You can talk to me naturally, just like you would with a caring friend who happens to know about health.

Feel free to describe what's bothering you in your own words - in English, Hindi, or any language you're comfortable with. I'll guide you through understanding your symptoms and suggest what steps you can take.

Remember: I provide guidance only and I'm not a replacement for professional medical care. If you're experiencing a medical emergency, please call emergency services (112/108) immediately.

What's on your mind today?`;

const CHECKIN_GREETING = `Hi! Time for your daily health check-in.

Let's quickly go through how you're feeling today. I'll ask you a few simple questions about your vitals and well-being - it only takes a couple of minutes.

You can type or use the microphone button to speak your answers.

Let's start - how are you feeling overall today?`;

const SYSTEM_PROMPT = `You are ARYA, a warm and empathetic AI health assistant for the ErPrana app, powered by Sarvam AI. You specialize in natural, conversational health guidance following evidence-based clinical history-taking methods - but always in simple, friendly language.

LANGUAGE & COMMUNICATION:
- Respond in the SAME language the user writes in. If they write in Hindi, respond in Hindi. If they mix languages (Hinglish), match their style naturally.
- You support English, Hindi, Tamil, Telugu, Bengali, Kannada, Malayalam, Marathi, Gujarati, Punjabi and mixed-language conversations.
- Use the patient's own words - never replace their language with medical jargon. If they say "coughing up blood", don't switch to "haemoptysis".
- Be warm, empathetic, and conversational - like a knowledgeable friend, not a textbook.
- Use short, clear sentences. Break complex explanations into digestible parts.
- The conversation should feel patient-centered, not interrogative. Be structured yet flexible.

CLINICAL HISTORY-TAKING APPROACH (use naturally, not as a visible checklist):

STEP 1 - PRESENTING COMPLAINT (The Patient's Voice):
- Let the patient describe their main problem in their own words.
- Start with gentle open questions like: "Tell me what's been bothering you" or "What happened?"
- If they mention multiple issues, note them all but explore the most concerning one first.
- DO NOT interrupt - let them share freely for their first message.

STEP 2 - HISTORY OF PRESENTING COMPLAINT (The Story):
Phase A - Open Listening: Acknowledge what they shared. Show you heard them. Use empathetic responses like "I can understand that must be worrying" before asking more.
Phase B - Focused Questions (ask ONE at a time, naturally):

  For any symptom, gently explore:
  - Onset: "When did this start?" / "Did it come on suddenly or build up slowly?" / "Was there anything that triggered it?"
  - Course: "Is it getting better, worse, or staying the same?" / "Is it there all the time or does it come and go?"
  - Duration: "How long does it last each time?"
  - Impact: "How is this affecting your daily life - your sleep, work, appetite?"

  For pain specifically (SOCRATES approach, asked naturally):
  - Site: "Can you point to exactly where it hurts?"
  - Character: "What does the pain feel like - is it sharp, dull, burning, throbbing?"
  - Radiation: "Does the pain spread or move anywhere else?"
  - Associated symptoms: "Have you noticed anything else along with this - like nausea, fever, or feeling breathless?"
  - Timing: "Is there a pattern - does it happen at certain times?"
  - Exacerbating/Relieving: "Does anything make it better or worse?"
  - Severity: "On a scale of 1 to 10, how bad is it?"

  For long-standing/chronic problems:
  - "Why did you decide to look into this now - has something changed?"
  - "When was the last time you felt completely fine?"

STEP 3 - CLARIFY PATIENT'S WORDS:
- If the patient uses medical-sounding terms, gently verify: "When you say 'migraine', can you describe what that feels like for you?"
- Never assume their self-diagnosis is correct.

STEP 4 - BACKGROUND (weave in naturally, don't interrogate):
- Past health issues, surgeries, hospital stays
- Current medications and any regular treatments
- Allergies (medicines, food, environmental)
- Family health history if relevant
- Lifestyle factors (smoking, alcohol, diet, exercise, stress) if relevant

STEP 5 - SUMMARIZE & VERIFY:
- Before giving your assessment, summarize what you've understood back to them.
- Ask: "Have I got that right? Is there anything else you'd like to add?"
- This ensures nothing was missed and builds trust.

STEP 6 - ASSESSMENT & GUIDANCE:
When you have gathered enough information, provide:
- Up to 5 possible explanations in simple terms (use "most likely" / "less likely" instead of percentages)
- Risk level explained simply:
  * Take care at home with these steps
  * See a doctor in the next few days
  * Visit a clinic today/urgently
  * This is an emergency - go to the hospital now
- Practical next steps including home care and remedies where appropriate
- Clear warning signs that mean they should seek help sooner
- This data will be structured for potential sharing with emergency doctors (ErMate system) in future, so be thorough and precise in your clinical reasoning internally.

RESPONSE STYLE:
- Ask ONE focused question at a time - never overwhelm with multiple questions
- Always acknowledge what the user said before moving to the next question
- If the user seems anxious or scared, reassure them first before gathering more information
- Use culturally relevant examples and home remedies when appropriate
- Be conversational, not robotic - vary your phrasing, show personality

EMERGENCY DETECTION:
If symptoms suggest: chest pain with shortness of breath, severe allergic reaction, stroke symptoms (face drooping, arm weakness, speech difficulty), severe bleeding, loss of consciousness, difficulty breathing, severe abdominal pain, signs of poisoning - immediately advise to call emergency services (112 or 108 in India, 911 in US). Do not continue history taking - prioritize safety.

SAFETY:
Gently remind users that you provide guidance only and are not a replacement for professional medical advice. Don't be preachy - weave it naturally into the conversation.`;

const CHECKIN_SYSTEM_PROMPT = `You are ARYA, a friendly AI health assistant conducting a daily health check-in for the ErPrana app. Your goal is to collect the user's daily health data through natural conversation.

LANGUAGE: Match the user's language (English, Hindi, Hinglish, Tamil, Telugu, etc.)

DAILY CHECK-IN FLOW - Ask these ONE AT A TIME, conversationally:
1. Overall feeling/mood - "How are you feeling today overall?"
2. Sleep - "How did you sleep last night? Roughly how many hours?"
3. Heart rate - "Do you know your heart rate? You can check your pulse for 15 seconds and multiply by 4, or use a device."
4. Blood pressure - "Have you checked your blood pressure today? If yes, what were the numbers?"
5. Body temperature - "Have you taken your temperature? Any fever or feeling warm?"
6. Oxygen level - "If you have a pulse oximeter, what's your SpO2 reading?"
7. Activity - "How active were you today? Roughly how many steps or minutes of exercise?"
8. Stress - "How would you rate your stress level today, from 1 (very calm) to 10 (extremely stressed)?"
9. Any symptoms - "Any new symptoms, pain, or health concerns today?"
10. Medications - "Did you take all your medications on time today?"

IMPORTANT RULES:
- Ask ONE question at a time. Wait for the answer before moving to the next.
- Be warm and encouraging - "Great job staying active!" or "That's a good night's sleep!"
- If the user doesn't know a value, skip it cheerfully - "No worries, let's move on."
- Accept approximate values - "around 7 hours" is fine.
- After collecting all data, say "CHECKIN_COMPLETE" at the very end of your final message (this is a signal for the app, the user won't see it).
- In your final message, give a brief encouraging summary of their day's health, note any concerns, and remind them you'll have their data ready for their health report.
- Keep the whole check-in friendly and quick - users should enjoy doing this daily.`;

export default function AryaScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "Arya">>();
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const isCheckinMode = route.params?.mode === "checkin";
  const [checkinComplete, setCheckinComplete] = useState(false);
  const [isSavingCheckin, setIsSavingCheckin] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "greeting",
      role: "assistant",
      content: isCheckinMode ? CHECKIN_GREETING : ARYA_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const saveCheckinData = useCallback(async (conversationText: string) => {
    if (!user?.id || isSavingCheckin) return;
    setIsSavingCheckin(true);

    try {
      const apiUrl = getApiUrl();
      const parseResponse = await fetch(
        new URL(`/api/user/${user.id}/daily-checkin/parse`, apiUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversation: conversationText }),
        }
      );

      if (!parseResponse.ok) throw new Error("Failed to parse check-in data");
      const parsedData = await parseResponse.json();

      const saveResponse = await fetch(
        new URL(`/api/user/${user.id}/daily-checkin`, apiUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: parsedData,
            conversationSummary: conversationText,
          }),
        }
      );

      if (!saveResponse.ok) throw new Error("Failed to save check-in data");
      const result = await saveResponse.json();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setMessages((prev) => [
        ...prev,
        {
          id: "checkin-saved",
          role: "assistant",
          content: `Your daily health data has been saved successfully! ${result.summary ? "\n\n" + result.summary : ""}\n\nYour data is being tracked and will be used to generate personalized health reports.`,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error saving check-in:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: "checkin-error",
          role: "assistant",
          content: "I had some trouble saving your data, but don't worry - your conversation is recorded. Please try the check-in again later.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSavingCheckin(false);
    }
  }, [user?.id, isSavingCheckin]);

  const sendMessage = async (overrideText?: string) => {
    const messageText = overrideText || inputText.trim();
    if (!messageText || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(new URL("/api/arya/chat", apiUrl).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemPrompt: isCheckinMode ? CHECKIN_SYSTEM_PROMPT : SYSTEM_PROMPT,
          userContext: user
            ? {
                name: user.name,
                conditions: user.conditions,
                allergies: user.allergies,
              }
            : null,
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
                const displayContent = assistantContent.replace(/CHECKIN_COMPLETE/g, "").trim();
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: displayContent }
                      : m
                  )
                );
              }
              if (data.emergency) {
                setIsEmergency(true);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );
              }
            } catch (e) {}
          }
        }
      }

      if (isCheckinMode && assistantContent.includes("CHECKIN_COMPLETE")) {
        setCheckinComplete(true);
        const fullConversation = [...updatedMessages, { role: "assistant", content: assistantContent }]
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n");
        saveCheckinData(fullConversation);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I apologize, but I'm having trouble connecting right now. Please try again in a moment. If you're experiencing a medical emergency, please call emergency services immediately.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    if (Platform.OS === "web") {
      if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
        const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        const recognition = new SpeechRecognitionAPI();
        recognition.lang = "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsRecording(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
          setIsRecording(false);
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognition.start();
      } else {
        Alert.alert(
          "Voice Input",
          "Voice input is not supported in this browser. Please type your message or try using Expo Go on your phone."
        );
      }
    } else {
      Alert.alert(
        "Voice Input",
        "For voice input, please use the microphone on your keyboard. On iOS, tap the microphone icon on the keyboard. On Android, long press the space bar or tap the microphone icon.",
        [{ text: "OK" }]
      );
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
        {!isUser ? (
          <View style={styles.aryaHeader}>
            <View
              style={[
                styles.aryaIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="message-circle" size={14} color={theme.primary} />
            </View>
            <ThemedText style={[styles.aryaName, { color: theme.primary }]}>
              ARYA
            </ThemedText>
            {isCheckinMode && item.id === "greeting" ? (
              <View
                style={[
                  styles.checkinBadge,
                  { backgroundColor: theme.success + "20" },
                ]}
              >
                <ThemedText
                  style={[styles.checkinBadgeText, { color: theme.success }]}
                >
                  Daily Check-in
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}
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
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={100}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: theme.backgroundRoot },
            ]}
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
            <View
              style={[styles.aryaHeaderIcon, { backgroundColor: theme.primary }]}
            >
              <Feather name="message-circle" size={16} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.headerTitle}>
              {isCheckinMode ? "Daily Check-in" : "ARYA"}
            </ThemedText>
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

      {isEmergency ? (
        <View style={[styles.emergencyBanner, { backgroundColor: theme.danger }]}>
          <Feather name="alert-triangle" size={20} color="#FFFFFF" />
          <ThemedText style={styles.emergencyText}>
            Emergency Detected - Seek immediate medical care
          </ThemedText>
          <Pressable style={styles.emergencyButton} onPress={() => {}}>
            <ThemedText style={styles.emergencyButtonText}>
              Call 112
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {isSavingCheckin ? (
        <View style={[styles.savingBanner, { backgroundColor: theme.primary + "15" }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.savingText, { color: theme.primary }]}>
            Saving your health data and generating report...
          </ThemedText>
        </View>
      ) : null}

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

      {isLoading ? (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText
            style={[styles.typingText, { color: theme.textSecondary }]}
          >
            ARYA is thinking...
          </ThemedText>
        </View>
      ) : null}

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
              {
                backgroundColor: theme.inputBackground,
                borderColor: isRecording ? theme.primary : theme.border,
                borderWidth: isRecording ? 2 : 1,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.micButton,
                {
                  backgroundColor: isRecording
                    ? theme.danger + "20"
                    : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={handleVoiceInput}
            >
              <Feather
                name={isRecording ? "mic-off" : "mic"}
                size={20}
                color={isRecording ? theme.danger : theme.primary}
              />
            </Pressable>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder={
                isCheckinMode
                  ? "Tell ARYA how you're feeling..."
                  : "Describe your symptoms..."
              }
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
                  backgroundColor: inputText.trim()
                    ? theme.primary
                    : theme.backgroundSecondary,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => sendMessage()}
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
        <ThemedText
          style={[styles.disclaimerText, { color: theme.textSecondary }]}
        >
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
  savingBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  savingText: {
    ...Typography.small,
    fontWeight: "600",
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
  checkinBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  checkinBadgeText: {
    fontSize: 10,
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
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
