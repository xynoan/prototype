import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { signOutUser } from "../services/auth";
import { getVisitors, Visitor } from "../services/visitors";

export default function GuardDashboard() {
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showVisitorList, setShowVisitorList] = useState(false);

  const loadVisitors = async () => {
    setIsLoading(true);
    try {
      const visitorsData = await getVisitors();
      setVisitors(visitorsData);
      setShowVisitorList(true);
    } catch (error: any) {
      Alert.alert("Error", "Failed to load visitors. Please try again.");
      console.error("Error loading visitors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const visitorsData = await getVisitors();
      setVisitors(visitorsData);
    } catch (error: any) {
      Alert.alert("Error", "Failed to refresh visitors. Please try again.");
      console.error("Error refreshing visitors:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await signOutUser();
              router.replace("/");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to log out");
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const formatVehicleCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const renderVisitorItem = ({ item }: { item: Visitor }) => (
    <View style={styles.visitorCard}>
      <View style={styles.visitorHeader}>
        <Text style={styles.visitorName}>{item.name}</Text>
        <Text style={styles.visitorDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <View style={styles.visitorDetails}>
        <Text style={styles.visitorDetailText}>Host: {item.hostName}</Text>
        <Text style={styles.visitorDetailText}>Plate: {item.plateNumber}</Text>
        <Text style={styles.visitorDetailText}>
          Vehicle: {formatVehicleCategory(item.vehicleCategory)}
        </Text>
        <Text style={styles.visitorDetailText}>GPS ID: {item.gpsId}</Text>
      </View>
    </View>
  );

  if (showVisitorList) {
    return (
      <View style={styles.container}>
        <Text style={styles.greeting}>Visitor List</Text>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setShowVisitorList(false)}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.visitorListContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          ) : visitors.length === 0 ? (
            <Text style={styles.emptyText}>No visitors yet</Text>
          ) : (
            <FlatList
              data={visitors}
              renderItem={renderVisitorItem}
              keyExtractor={(item) => item.id}
              style={styles.visitorList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              }
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hi Guard!!!</Text>
      
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/new-visitor")}
      >
        <Text style={styles.buttonText}>New Visitor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={loadVisitors}
      >
        <Text style={styles.buttonText}>Visitor List</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginTop: 40,
    marginBottom: 40,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  backButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    padding: 12,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  visitorListContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  loader: {
    marginTop: 40,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 40,
  },
  visitorList: {
    flex: 1,
  },
  visitorCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  visitorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  visitorName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  visitorDate: {
    fontSize: 12,
    color: "#666",
  },
  visitorDetails: {
    marginTop: 8,
  },
  visitorDetailText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

