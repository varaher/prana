import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import AryaScreen from "@/screens/AryaScreen";
import SOSScreen from "@/screens/SOSScreen";
import LoginScreen from "@/screens/LoginScreen";
import AddMedicationScreen from "@/screens/AddMedicationScreen";
import AddRecordScreen from "@/screens/AddRecordScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useAuth } from "@/hooks/useAuth";

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Arya: { conversationId?: number } | undefined;
  SOS: undefined;
  AddMedication: { medicationId?: string } | undefined;
  AddRecord: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Arya"
            component={AryaScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="SOS"
            component={SOSScreen}
            options={{
              presentation: "modal",
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="AddMedication"
            component={AddMedicationScreen}
            options={{
              presentation: "modal",
              headerTitle: "Add Medication",
            }}
          />
          <Stack.Screen
            name="AddRecord"
            component={AddRecordScreen}
            options={{
              presentation: "modal",
              headerTitle: "Add Record",
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
