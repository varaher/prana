import React, { useState, useRef } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal, ActivityIndicator, Image, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface VisualAssessment {
  id: number;
  userId: string;
  consciousnessLevel: string | null;
  painIndicators: {
    painSigns: string[];
    emotionalState: string;
    discomfortLevel: string;
  } | null;
  facialExpression: string | null;
  skinCondition: string | null;
  bodyPosition: string | null;
  visibleInjuries: string[] | null;
  environmentNotes: string | null;
  interventionsDetected: string[] | null;
  overallAssessment: string | null;
  urgencyLevel: string | null;
  recommendations: string[] | null;
  createdAt: string;
}

interface AnalysisResult extends VisualAssessment {
  analysis: {
    consciousnessLevel: string;
    painIndicators: {
      painSigns: string[];
      emotionalState: string;
      discomfortLevel: string;
    };
    facialExpression: string;
    skinCondition: string;
    bodyPosition: string;
    visibleInjuries: string[];
    environmentNotes: string;
    interventionsDetected: string[];
    overallAssessment: string;
    urgencyLevel: string;
    recommendations: string[];
  };
}

function getUrgencyColor(urgency: string | null): string {
  switch (urgency?.toLowerCase()) {
    case "emergency":
      return "#DC2626";
    case "urgent":
      return "#F59E0B";
    case "concerning":
      return "#F97316";
    case "routine":
    default:
      return "#10B981";
  }
}

function UrgencyBadge({ urgency }: { urgency: string | null }) {
  const color = getUrgencyColor(urgency);
  return (
    <View style={[styles.urgencyBadge, { backgroundColor: color + "20", borderColor: color }]}>
      <ThemedText style={[styles.urgencyText, { color }]}>
        {urgency?.toUpperCase() || "UNKNOWN"}
      </ThemedText>
    </View>
  );
}

export default function VisualAssessmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const cameraRef = useRef<CameraView>(null);

  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const { data: assessments = [], isLoading } = useQuery<VisualAssessment[]>({
    queryKey: ["/api/user", user?.id, "visual-assessments"],
    enabled: !!user?.id,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await apiRequest("POST", `/api/user/${user?.id}/visual-assessments/analyze`, { imageBase64 });
      return response.json();
    },
    onSuccess: (data: AnalysisResult) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "visual-assessments"] });
      setCurrentResult(data);
      setCameraModalVisible(false);
      setCapturedImage(null);
      setResultModalVisible(true);
    },
  });

  const takePicture = async () => {
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (photo?.base64) {
        setCapturedImage(`data:image/jpeg;base64,${photo.base64}`);
      }
    }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      setCapturedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
      setCameraModalVisible(true);
    }
  };

  const analyzeImage = () => {
    if (capturedImage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      analyzeMutation.mutate(capturedImage);
    }
  };

  const openCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") {
      pickImage();
      return;
    }
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) return;
    }
    setCameraModalVisible(true);
    setCapturedImage(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const viewAssessment = (assessment: VisualAssessment) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentResult(assessment as AnalysisResult);
    setResultModalVisible(true);
  };

  const primaryColor = Colors.light.primary;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + Spacing.xl + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.captureCard}>
          <View style={styles.captureHeader}>
            <View style={[styles.iconContainer, { backgroundColor: primaryColor + "20" }]}>
              <Feather name="camera" size={28} color={primaryColor} />
            </View>
            <ThemedText style={styles.captureTitle}>Visual Patient Assessment</ThemedText>
            <ThemedText style={[styles.captureDescription, { color: colors.textSecondary }]}>
              Take a photo to analyze patient condition using AI vision technology
            </ThemedText>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.captureButton, { backgroundColor: primaryColor }]}
              onPress={openCamera}
            >
              <Feather name="camera" size={20} color="#FFFFFF" />
              <ThemedText style={styles.captureButtonText}>Take Photo</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.captureButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={pickImage}
            >
              <Feather name="image" size={20} color={colors.text} />
              <ThemedText style={[styles.captureButtonTextDark, { color: colors.text }]}>Gallery</ThemedText>
            </Pressable>
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Assessment History</ThemedText>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
          </View>
        ) : assessments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="file-text" size={48} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              No assessments yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Take a photo to get started
            </ThemedText>
          </Card>
        ) : (
          assessments.map((assessment) => (
            <Pressable key={assessment.id} onPress={() => viewAssessment(assessment)}>
              <Card style={styles.assessmentCard}>
                <View style={styles.assessmentHeader}>
                  <View style={styles.assessmentInfo}>
                    <ThemedText style={styles.assessmentDate}>
                      {formatDate(assessment.createdAt)}
                    </ThemedText>
                    <UrgencyBadge urgency={assessment.urgencyLevel} />
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.textSecondary} />
                </View>
                <ThemedText style={[styles.assessmentSummary, { color: colors.textSecondary }]} numberOfLines={2}>
                  {assessment.overallAssessment || "Assessment completed"}
                </ThemedText>
                <View style={styles.assessmentTags}>
                  {assessment.consciousnessLevel && (
                    <View style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                      <ThemedText style={[styles.tagText, { color: colors.text }]}>
                        {assessment.consciousnessLevel}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={cameraModalVisible} animationType="slide" presentationStyle="fullScreen">
        <View style={[styles.cameraContainer, { backgroundColor: "#000" }]}>
          {capturedImage ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} resizeMode="contain" />
              <View style={[styles.previewActions, { paddingBottom: insets.bottom + Spacing.lg }]}>
                {analyzeMutation.isPending ? (
                  <View style={styles.analyzingContainer}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <ThemedText style={styles.analyzingText}>Analyzing image...</ThemedText>
                  </View>
                ) : (
                  <>
                    <Pressable
                      style={[styles.previewButton, { backgroundColor: "#DC2626" }]}
                      onPress={() => setCapturedImage(null)}
                    >
                      <Feather name="x" size={24} color="#FFFFFF" />
                      <ThemedText style={styles.previewButtonText}>Retake</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.previewButton, { backgroundColor: primaryColor }]}
                      onPress={analyzeImage}
                    >
                      <Feather name="check" size={24} color="#FFFFFF" />
                      <ThemedText style={styles.previewButtonText}>Analyze</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ) : (
            <>
              <CameraView ref={cameraRef} style={styles.camera} facing="back" />
              <View style={[styles.cameraControls, { paddingBottom: insets.bottom + Spacing.lg }]}>
                <Pressable
                  style={[styles.closeButton, { backgroundColor: "rgba(255,255,255,0.3)" }]}
                  onPress={() => setCameraModalVisible(false)}
                >
                  <Feather name="x" size={24} color="#FFFFFF" />
                </Pressable>
                <Pressable style={styles.shutterButton} onPress={takePicture}>
                  <View style={styles.shutterInner} />
                </Pressable>
                <View style={{ width: 50 }} />
              </View>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={resultModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.resultContainer}>
          <View style={[styles.resultHeader, { paddingTop: insets.top + Spacing.md }]}>
            <ThemedText style={styles.resultTitle}>Assessment Report</ThemedText>
            <Pressable
              style={[styles.closeResultButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => setResultModalVisible(false)}
            >
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.resultScroll}
            contentContainerStyle={[styles.resultContent, { paddingBottom: insets.bottom + Spacing.xl }]}
          >
            {currentResult && (
              <>
                <View style={styles.urgencySection}>
                  <UrgencyBadge urgency={currentResult.urgencyLevel} />
                </View>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="activity" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Overall Assessment</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.overallAssessment || "No assessment available"}
                  </ThemedText>
                </Card>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="eye" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Consciousness Level</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.consciousnessLevel || "Cannot determine"}
                  </ThemedText>
                </Card>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="frown" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Pain Indicators</ThemedText>
                  </View>
                  {currentResult.painIndicators ? (
                    <>
                      <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Emotional State: {currentResult.painIndicators.emotionalState}
                      </ThemedText>
                      <ThemedText style={[styles.resultLabel, { color: colors.textSecondary }]}>
                        Discomfort Level: {currentResult.painIndicators.discomfortLevel}
                      </ThemedText>
                      {currentResult.painIndicators.painSigns?.length > 0 && (
                        <View style={styles.tagList}>
                          {currentResult.painIndicators.painSigns.map((sign, i) => (
                            <View key={i} style={[styles.tag, { backgroundColor: "#F59E0B20" }]}>
                              <ThemedText style={[styles.tagText, { color: "#F59E0B" }]}>{sign}</ThemedText>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  ) : (
                    <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                      No pain indicators detected
                    </ThemedText>
                  )}
                </Card>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="user" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Facial Expression</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.facialExpression || "Cannot determine"}
                  </ThemedText>
                </Card>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="droplet" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Skin Condition</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.skinCondition || "Cannot determine"}
                  </ThemedText>
                </Card>

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="move" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Body Position</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.bodyPosition || "Cannot determine"}
                  </ThemedText>
                </Card>

                {currentResult.visibleInjuries && currentResult.visibleInjuries.length > 0 && (
                  <Card style={styles.injuryCard}>
                    <View style={styles.resultSection}>
                      <Feather name="alert-triangle" size={20} color="#DC2626" />
                      <ThemedText style={[styles.resultSectionTitle, { color: "#DC2626" }]}>
                        Visible Injuries
                      </ThemedText>
                    </View>
                    {currentResult.visibleInjuries.map((injury, i) => (
                      <ThemedText key={i} style={[styles.resultText, { color: colors.textSecondary }]}>
                        - {injury}
                      </ThemedText>
                    ))}
                  </Card>
                )}

                {currentResult.interventionsDetected && currentResult.interventionsDetected.length > 0 && (
                  <Card style={styles.resultCard}>
                    <View style={styles.resultSection}>
                      <Feather name="plus-circle" size={20} color={primaryColor} />
                      <ThemedText style={styles.resultSectionTitle}>Interventions Detected</ThemedText>
                    </View>
                    {currentResult.interventionsDetected.map((intervention, i) => (
                      <ThemedText key={i} style={[styles.resultText, { color: colors.textSecondary }]}>
                        - {intervention}
                      </ThemedText>
                    ))}
                  </Card>
                )}

                <Card style={styles.resultCard}>
                  <View style={styles.resultSection}>
                    <Feather name="map-pin" size={20} color={primaryColor} />
                    <ThemedText style={styles.resultSectionTitle}>Environment Notes</ThemedText>
                  </View>
                  <ThemedText style={[styles.resultText, { color: colors.textSecondary }]}>
                    {currentResult.environmentNotes || "No environment notes"}
                  </ThemedText>
                </Card>

                {currentResult.recommendations && currentResult.recommendations.length > 0 && (
                  <Card style={styles.recommendationsCard}>
                    <View style={styles.resultSection}>
                      <Feather name="check-circle" size={20} color={primaryColor} />
                      <ThemedText style={styles.resultSectionTitle}>Recommendations</ThemedText>
                    </View>
                    {currentResult.recommendations.map((rec, i) => (
                      <ThemedText key={i} style={[styles.resultText, { color: colors.textSecondary }]}>
                        {i + 1}. {rec}
                      </ThemedText>
                    ))}
                  </Card>
                )}
              </>
            )}
          </ScrollView>
        </ThemedView>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
  },
  captureCard: {
    padding: Spacing.xl,
    alignItems: "center",
  },
  captureHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  captureTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  captureDescription: {
    fontSize: Typography.small.fontSize,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  captureButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  captureButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  captureButtonTextDark: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
  },
  sectionHeader: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
  },
  loadingContainer: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  emptyCard: {
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  emptyText: {
    fontSize: Typography.h4.fontSize,
    fontWeight: Typography.h4.fontWeight,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.small.fontSize,
    marginTop: Spacing.xs,
  },
  assessmentCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  assessmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  assessmentInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  assessmentDate: {
    fontSize: Typography.small.fontSize,
    fontWeight: "600",
  },
  assessmentSummary: {
    fontSize: Typography.small.fontSize,
    lineHeight: 20,
  },
  assessmentTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  urgencyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  urgencyText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "700",
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: "500",
  },
  tagList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  previewContainer: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  previewButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  analyzingContainer: {
    alignItems: "center",
    gap: Spacing.md,
  },
  analyzingText: {
    fontSize: Typography.body.fontSize,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  resultTitle: {
    fontSize: Typography.h3.fontSize,
    fontWeight: Typography.h3.fontWeight,
  },
  closeResultButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultScroll: {
    flex: 1,
  },
  resultContent: {
    padding: Spacing.lg,
  },
  urgencySection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  resultCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  injuryCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderColor: "#DC2626",
    borderWidth: 1,
  },
  recommendationsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.light.primary + "10",
  },
  resultSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  resultSectionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: "700",
  },
  resultText: {
    fontSize: Typography.small.fontSize,
    lineHeight: 22,
  },
  resultLabel: {
    fontSize: Typography.small.fontSize,
    marginBottom: Spacing.xs,
  },
});
