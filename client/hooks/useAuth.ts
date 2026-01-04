import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_KEY = "@erprana_auth";
const USER_KEY = "@erprana_user";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "layperson" | "doctor";
  age?: number;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  conditions?: string[];
  emergencyContacts?: { name: string; phone: string; relationship: string }[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserProfile | null;
  login: (email: string, password: string, role: "layperson" | "doctor") => Promise<void>;
  signup: (name: string, email: string, password: string, role: "layperson" | "doctor") => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authData = await AsyncStorage.getItem(AUTH_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (authData && userData) {
        setIsAuthenticated(true);
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string, role: "layperson" | "doctor") => {
    const userProfile: UserProfile = {
      id: Date.now().toString(),
      name: email.split("@")[0],
      email,
      role,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ email, timestamp: Date.now() }));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userProfile));
    setUser(userProfile);
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, role: "layperson" | "doctor") => {
    const userProfile: UserProfile = {
      id: Date.now().toString(),
      name,
      email,
      role,
    };
    await AsyncStorage.setItem(AUTH_KEY, JSON.stringify({ email, timestamp: Date.now() }));
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userProfile));
    setUser(userProfile);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove([AUTH_KEY, USER_KEY]);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateUser = useCallback(async (updates: Partial<UserProfile>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }, [user]);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    signup,
    logout,
    updateUser,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
