import React, { useState } from "react";
import { View, StyleSheet, FlatList, Pressable, Modal, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { apiRequest } from "@/lib/query-client";

interface ChronicCondition {
  id: number;
  name: string;
  category: string;
  description: string | null;
}

interface AlternativeMedicine {
  id: number;
  name: string;
  type: string;
  description: string | null;
}

interface UserMedicine {
  id: number;
  conditionId: number;
  conditionName: string;
  medicineId: number;
  medicineName: string;
  medicineType: string;
  isHelping: boolean;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  startedAt: string;
}

interface Recommendation {
  medicineId: number;
  medicineName: string;
  medicineType: string;
  medicineDescription: string | null;
  totalUsers: number;
  helpingCount: number;
  rank: number;
  helpfulPercentage: number;
}

export default function AlternativeMedicineScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme: colors } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"my" | "community">("my");
  const [selectedConditionId, setSelectedConditionId] = useState<number | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [conditionPickerVisible, setConditionPickerVisible] = useState(false);
  const [selectedConditionForAdd, setSelectedConditionForAdd] = useState<number | null>(null);

  const { data: conditions = [], isLoading: conditionsLoading } = useQuery<ChronicCondition[]>({
    queryKey: ["/api/chronic-conditions"],
  });

  const { data: medicines = [] } = useQuery<AlternativeMedicine[]>({
    queryKey: ["/api/alternative-medicines"],
  });

  const { data: userMedicines = [], isLoading: userMedicinesLoading } = useQuery<UserMedicine[]>({
    queryKey: ["/api/user", user?.id, "alternative-medicines"],
    enabled: !!user?.id,
  });

  const { data: recommendations = [] } = useQuery<Recommendation[]>({
    queryKey: ["/api/alternative-medicines/recommendations", selectedConditionId?.toString()],
    enabled: !!selectedConditionId,
  });

  React.useEffect(() => {
    if (conditions.length > 0 && !selectedConditionId) {
      setSelectedConditionId(conditions[0].id);
    }
  }, [conditions, selectedConditionId]);

  const addMedicineMutation = useMutation({
    mutationFn: async ({ conditionId, medicineId }: { conditionId: number; medicineId: number }) => {
      await apiRequest("POST", `/api/user/${user?.id}/alternative-medicines`, {
        conditionId,
        medicineId,
        isHelping: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "alternative-medicines"] });
      if (selectedConditionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/alternative-medicines/recommendations", selectedConditionId.toString()] });
      }
      setAddModalVisible(false);
    },
  });

  const toggleHelpingMutation = useMutation({
    mutationFn: async ({ usageId, isHelping }: { usageId: number; isHelping: boolean }) => {
      await apiRequest("PATCH", `/api/user/${user?.id}/alternative-medicines/${usageId}`, {
        isHelping: !isHelping,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "alternative-medicines"] });
      if (selectedConditionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/alternative-medicines/recommendations", selectedConditionId.toString()] });
      }
    },
  });

  const removeMedicineMutation = useMutation({
    mutationFn: async (usageId: number) => {
      await apiRequest("DELETE", `/api/user/${user?.id}/alternative-medicines/${usageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", user?.id, "alternative-medicines"] });
      if (selectedConditionId) {
        queryClient.invalidateQueries({ queryKey: ["/api/alternative-medicines/recommendations", selectedConditionId.toString()] });
      }
    },
  });

  const handleAddMedicine = (conditionId: number, medicineId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addMedicineMutation.mutate({ conditionId, medicineId });
  };

  const handleToggleHelping = (usageId: number, isHelping: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleHelpingMutation.mutate({ usageId, isHelping });
  };

  const handleRemoveMedicine = (usageId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeMedicineMutation.mutate(usageId);
  };

  const getMedicineTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "herbal": return "coffee";
      case "ayurvedic": return "sun";
      case "supplement": return "package";
      case "mind-body": return "heart";
      case "traditional medicine": return "compass";
      case "cannabinoid": return "droplet";
      default: return "activity";
    }
  };

  const selectedCondition = conditions.find((c) => c.id === selectedConditionId);

  const renderMyMedicineItem = ({ item }: { item: UserMedicine }) => (
    <Card style={styles.medicineCard}>
      <View style={styles.medicineHeader}>
        <View style={[styles.typeIcon, { backgroundColor: colors.primaryLight + "20" }]}>
          <Feather name={getMedicineTypeIcon(item.medicineType) as any} size={20} color={colors.primary} />
        </View>
        <View style={styles.medicineInfo}>
          <ThemedText style={styles.medicineName}>{item.medicineName}</ThemedText>
          <ThemedText style={[styles.medicineType, { color: colors.textSecondary }]}>
            {item.medicineType} - For {item.conditionName}
          </ThemedText>
        </View>
      </View>

      <View style={styles.medicineActions}>
        <Pressable
          onPress={() => handleToggleHelping(item.id, item.isHelping)}
          style={[
            styles.helpingButton,
            { backgroundColor: item.isHelping ? colors.success + "20" : colors.backgroundSecondary },
          ]}
        >
          <Feather
            name="thumbs-up"
            size={16}
            color={item.isHelping ? colors.success : colors.textSecondary}
          />
          <ThemedText
            style={[
              styles.helpingText,
              { color: item.isHelping ? colors.success : colors.textSecondary },
            ]}
          >
            {item.isHelping ? "Helping" : "Mark as helpful"}
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => handleRemoveMedicine(item.id)} style={styles.removeButton}>
          <Feather name="trash-2" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </Card>
  );

  const renderRecommendationItem = ({ item }: { item: Recommendation }) => (
    <Card style={styles.recommendationCard}>
      <View style={styles.rankBadge}>
        <ThemedText style={[styles.rankText, { color: colors.primary }]}>#{item.rank}</ThemedText>
      </View>

      <View style={styles.recommendationContent}>
        <View style={styles.medicineHeader}>
          <View style={[styles.typeIcon, { backgroundColor: colors.primaryLight + "20" }]}>
            <Feather name={getMedicineTypeIcon(item.medicineType) as any} size={20} color={colors.primary} />
          </View>
          <View style={styles.medicineInfo}>
            <ThemedText style={styles.medicineName}>{item.medicineName}</ThemedText>
            <ThemedText style={[styles.medicineType, { color: colors.textSecondary }]}>
              {item.medicineType}
            </ThemedText>
          </View>
        </View>

        {item.medicineDescription ? (
          <ThemedText style={[styles.description, { color: colors.textSecondary }]}>
            {item.medicineDescription}
          </ThemedText>
        ) : null}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Feather name="users" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.statText, { color: colors.textSecondary }]}>
              {item.totalUsers} {item.totalUsers === 1 ? "user" : "users"}
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <Feather name="thumbs-up" size={14} color={colors.success} />
            <ThemedText style={[styles.statText, { color: colors.success }]}>
              {item.helpfulPercentage}% find helpful
            </ThemedText>
          </View>
        </View>
      </View>
    </Card>
  );

  if (conditionsLoading || userMedicinesLoading) {
    return (
      <ThemedView style={[styles.container, { paddingTop: headerHeight + Spacing.xl }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.content, { paddingTop: headerHeight + Spacing.lg }]}>
        <View style={[styles.tabs, { backgroundColor: colors.backgroundSecondary }]}>
          <Pressable
            onPress={() => setActiveTab("my")}
            style={[
              styles.tab,
              activeTab === "my" && { backgroundColor: colors.cardBackground },
            ]}
          >
            <Feather name="heart" size={16} color={activeTab === "my" ? colors.primary : colors.textSecondary} />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "my" ? colors.primary : colors.textSecondary },
              ]}
            >
              My Remedies
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab("community")}
            style={[
              styles.tab,
              activeTab === "community" && { backgroundColor: colors.cardBackground },
            ]}
          >
            <Feather name="users" size={16} color={activeTab === "community" ? colors.primary : colors.textSecondary} />
            <ThemedText
              style={[
                styles.tabText,
                { color: activeTab === "community" ? colors.primary : colors.textSecondary },
              ]}
            >
              Community
            </ThemedText>
          </Pressable>
        </View>

        {activeTab === "community" ? (
          <Pressable
            onPress={() => setConditionPickerVisible(true)}
            style={[styles.conditionPicker, { backgroundColor: colors.backgroundSecondary }]}
          >
            <ThemedText style={styles.conditionPickerLabel}>Condition:</ThemedText>
            <ThemedText style={[styles.conditionPickerValue, { color: colors.primary }]}>
              {selectedCondition?.name || "Select"}
            </ThemedText>
            <Feather name="chevron-down" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {activeTab === "my" ? (
          <FlatList
            data={userMedicines}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMyMedicineItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="plus-circle" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No alternative remedies added yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Tap the + button to add remedies you are using
                </ThemedText>
              </View>
            }
          />
        ) : (
          <FlatList
            data={recommendations}
            keyExtractor={(item) => item.medicineId.toString()}
            renderItem={renderRecommendationItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Feather name="users" size={48} color={colors.textSecondary} />
                <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No community data yet
                </ThemedText>
                <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  Be the first to share what works for you
                </ThemedText>
              </View>
            }
          />
        )}

        <Pressable
          onPress={() => {
            setSelectedConditionForAdd(conditions[0]?.id || null);
            setAddModalVisible(true);
          }}
          style={[styles.fab, { backgroundColor: colors.primary, bottom: insets.bottom + Spacing.xl }]}
        >
          <Feather name="plus" size={24} color={colors.buttonText} />
        </Pressable>
      </View>

      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Add Remedy</ThemedText>
            <Pressable onPress={() => setAddModalVisible(false)}>
              <Feather name="x" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Select Condition
            </ThemedText>
            {conditions.map((condition) => (
              <Pressable
                key={condition.id}
                onPress={() => setSelectedConditionForAdd(condition.id)}
                style={[
                  styles.selectionItem,
                  {
                    backgroundColor: selectedConditionForAdd === condition.id ? colors.primary + "20" : colors.backgroundSecondary,
                    borderColor: selectedConditionForAdd === condition.id ? colors.primary : "transparent",
                  },
                ]}
              >
                <ThemedText style={styles.selectionItemText}>{condition.name}</ThemedText>
                {selectedConditionForAdd === condition.id ? (
                  <Feather name="check" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}

            <ThemedText style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: Spacing.xl }]}>
              Select Remedy
            </ThemedText>
            {medicines.map((medicine) => (
              <Pressable
                key={medicine.id}
                onPress={() => {
                  if (selectedConditionForAdd) {
                    handleAddMedicine(selectedConditionForAdd, medicine.id);
                  }
                }}
                disabled={!selectedConditionForAdd || addMedicineMutation.isPending}
                style={[styles.selectionItem, { backgroundColor: colors.backgroundSecondary, opacity: selectedConditionForAdd ? 1 : 0.5 }]}
              >
                <View style={styles.medicineSelectRow}>
                  <View style={[styles.typeIcon, { backgroundColor: colors.primaryLight + "20" }]}>
                    <Feather name={getMedicineTypeIcon(medicine.type) as any} size={16} color={colors.primary} />
                  </View>
                  <View>
                    <ThemedText style={styles.selectionItemText}>{medicine.name}</ThemedText>
                    <ThemedText style={[styles.selectionItemSubtext, { color: colors.textSecondary }]}>
                      {medicine.type}
                    </ThemedText>
                  </View>
                </View>
                <Feather name="plus" size={18} color={colors.primary} />
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>
      </Modal>

      <Modal visible={conditionPickerVisible} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setConditionPickerVisible(false)}>
          <View style={[styles.pickerModal, { backgroundColor: colors.cardBackground }]}>
            <ThemedText style={styles.pickerTitle}>Select Condition</ThemedText>
            <ScrollView>
              {conditions.map((condition) => (
                <Pressable
                  key={condition.id}
                  onPress={() => {
                    setSelectedConditionId(condition.id);
                    setConditionPickerVisible(false);
                  }}
                  style={[
                    styles.pickerItem,
                    selectedConditionId === condition.id && { backgroundColor: colors.primary + "20" },
                  ]}
                >
                  <ThemedText>{condition.name}</ThemedText>
                  {selectedConditionId === condition.id ? (
                    <Feather name="check" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    gap: Spacing.xs,
  },
  tabText: {
    ...Typography.small,
    fontWeight: "600",
  },
  conditionPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  conditionPickerLabel: {
    ...Typography.small,
  },
  conditionPickerValue: {
    ...Typography.small,
    fontWeight: "600",
    flex: 1,
  },
  list: {
    paddingBottom: 100,
    gap: Spacing.md,
  },
  medicineCard: {
    padding: Spacing.lg,
  },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    ...Typography.body,
    fontWeight: "600",
  },
  medicineType: {
    ...Typography.caption,
    marginTop: 2,
  },
  medicineActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  helpingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  helpingText: {
    ...Typography.small,
    fontWeight: "500",
  },
  removeButton: {
    padding: Spacing.sm,
  },
  recommendationCard: {
    padding: Spacing.lg,
    flexDirection: "row",
    gap: Spacing.md,
  },
  rankBadge: {
    width: 36,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rankText: {
    ...Typography.h4,
    fontWeight: "700",
  },
  recommendationContent: {
    flex: 1,
  },
  description: {
    ...Typography.small,
    marginTop: Spacing.sm,
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.caption,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing["4xl"],
    gap: Spacing.md,
  },
  emptyText: {
    ...Typography.body,
    fontWeight: "600",
  },
  emptySubtext: {
    ...Typography.small,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    ...Typography.h4,
  },
  modalContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  selectionItemText: {
    ...Typography.body,
  },
  selectionItemSubtext: {
    ...Typography.caption,
  },
  medicineSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  pickerModal: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  pickerTitle: {
    ...Typography.h4,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
});
