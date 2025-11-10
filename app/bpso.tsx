import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { signOutUser } from "../services/auth";

export default function BPSODashboard() {
  const [isLoading, setIsLoading] = useState(false);

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

  // --- PRIMARY ACTION HANDLERS (PLACEHOLDERS) ---
  const handleNewViolation = () => {
    Alert.alert("Action", "Navigating to Camera/Violation Form...");
    // router.push("/violation-form"); 
  };

  const handleContactViolator = () => {
    Alert.alert("Action", "Navigating to Contact/Search screen...");
    // router.push("/search-plate"); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi BPSO!</Text>
      <Text style={styles.subtitle}>Ready to patrol and log violations.</Text>

      {/* 1. DOCUMENT VIOLATION (Primary Task) */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleNewViolation}
        disabled={isLoading}
      >
        <Text style={styles.actionButtonText}>
          Log New Violation
        </Text>
      </TouchableOpacity>

      {/* 2. CONTACT VIOLATOR (Secondary Task) */}
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleContactViolator}
        disabled={isLoading}
      >
        <Text style={styles.actionButtonText}>
          Search Plate / Contact Host
        </Text>
      </TouchableOpacity>
      
      {/* 3. LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#E63946" /> // Changed color to match text
        ) : (
          <Text style={styles.logoutButtonText}>Logout</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// --- STYLING ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
    alignItems: "center",
    paddingTop: 80, // Added padding to move content down
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
  actionButton: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 18,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  logoutButton: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff", 
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 30,
    borderColor: "#E63946",
    borderWidth: 1,
  },
  logoutButtonText: {
    color: "#E63946",
    fontSize: 16,
    fontWeight: "600",
  },
});