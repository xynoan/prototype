import { router } from "expo-router";
import type { Unsubscribe } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { signOutUser } from "../services/auth";
import { subscribeToActiveAlerts } from "../services/violations";

export default function BPSODashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [managementExpanded, setManagementExpanded] = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);

  // --- LOGOUT HANDLER ---
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            await signOutUser();
            router.replace("/"); // Navigate back to the login screen
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to log out");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  // Real-time listener for active alerts count
  useEffect(() => {
    setIsLoadingAlerts(true);
    const unsubscribe: Unsubscribe = subscribeToActiveAlerts((count) => {
      setActiveAlertsCount(count);
      setIsLoadingAlerts(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // --- PRIMARY ACTION HANDLERS ---
  const handleActiveAlerts = () => {
    router.push("/active-alerts" as any);
  };

  const handleNewViolation = () => {
    router.push("/log-violation" as any);
  };

  const handleContactViolator = () => {
    router.push("/search-plate" as any);
  };

  // Generic handler for grouped actions
  const handleGroupedAction = (actionName: string) => {
    const routeMap: Record<string, string> = {
      "Live Violations Monitor": "/live-violations",
      "Escalation Cases": "/escalation-cases",
      "Repeat Offender List": "/repeat-offenders",
      "Complaints": "/complaints",
    };

    const route = routeMap[actionName];
    if (route) {
      router.push(route as any);
    } else {
      Alert.alert("Action", `Navigating to ${actionName}...`);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.greeting}>Hi BPSO!</Text>
      <Text style={styles.subtitle}>Ready to patrol and log violations.</Text>

      {/* PRIMARY ACTIONS - Always Visible */}
      <View style={styles.primaryActionsContainer}>
        {/* ACTIVE ALERTS - New Critical Feature */}
        <TouchableOpacity
          style={[styles.primaryButton, activeAlertsCount > 0 && styles.alertButton]}
          onPress={handleActiveAlerts}
          disabled={isLoading || isLoadingAlerts}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.primaryButtonText}>
              Active Alerts
            </Text>
            {isLoadingAlerts ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 8 }} />
            ) : (
              activeAlertsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeAlertsCount}</Text>
                </View>
              )
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleNewViolation}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            Log New Violation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContactViolator}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            Search Plate / Contact Host
          </Text>
        </TouchableOpacity>
      </View>

      {/* MANAGEMENT SECTION - Collapsible */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setManagementExpanded(!managementExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionHeaderText}>Management & Monitoring</Text>
          <Text style={styles.expandIcon}>
            {managementExpanded ? "▼" : "▶"}
          </Text>
        </TouchableOpacity>

        {managementExpanded && (
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleGroupedAction("Live Violations Monitor")}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                Live Violations Monitor
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleGroupedAction("Escalation Cases")}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                Escalation Cases
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleGroupedAction("Repeat Offender List")}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                Repeat Offender List
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => handleGroupedAction("Complaints")}
              disabled={isLoading}
            >
              <Text style={styles.secondaryButtonText}>
                Complaints
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#E63946" />
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- STYLING ---
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 20,
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 20,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
  },
  // Primary Actions Container
  primaryActionsContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 30,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  alertButton: {
    backgroundColor: "#FF6B35",
    borderWidth: 2,
    borderColor: "#FF4500",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF4500",
    marginLeft: 8,
  },
  badgeText: {
    color: "#FF4500",
    fontSize: 14,
    fontWeight: "700",
  },
  // Collapsible Sections
  sectionContainer: {
    width: "100%",
    maxWidth: 350,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  expandIcon: {
    fontSize: 14,
    color: "#666",
  },
  sectionContent: {
    padding: 8,
    paddingTop: 4,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 15,
    fontWeight: "500",
  },
  logoutButton: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    borderColor: "#E63946",
    borderWidth: 1,
  },
  logoutButtonText: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "600",
  },
});