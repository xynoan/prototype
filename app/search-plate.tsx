import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { searchVehicleByPlate, VehicleInfo } from "../services/vehicles";
import { Violation } from "../types/violations";

export default function SearchPlate() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("Error", "Please enter a plate number");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const info = await searchVehicleByPlate(searchQuery.trim());
      setVehicleInfo(info);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to search vehicle");
      setVehicleInfo(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCallHost = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleSendSMS = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const handleViewViolation = (violationId: string) => {
    router.push({
      pathname: "/alert-detail" as any,
      params: { id: violationId },
    } as any);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const renderViolationItem = ({ item }: { item: Violation }) => (
    <TouchableOpacity
      style={styles.violationCard}
      onPress={() => handleViewViolation(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.violationHeader}>
        <Text style={styles.violationType}>
          {item.violationType || "Violation"}
        </Text>
        <Text style={styles.violationDate}>{formatDate(item.detectedAt)}</Text>
      </View>
      <Text style={styles.violationLocation}>{item.location}</Text>
      <Text style={styles.violationStatus}>Status: {item.status}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Plate</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.searchContainer}>
          <Text style={styles.label}>Plate Number</Text>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter plate number"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {isSearching && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}

        {hasSearched && !isSearching && !vehicleInfo && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vehicle found</Text>
            <Text style={styles.emptySubtext}>
              No records found for plate number: {searchQuery}
            </Text>
          </View>
        )}

        {vehicleInfo && (
          <View style={styles.resultContainer}>
            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Vehicle Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plate Number</Text>
                <Text style={styles.infoValue}>{vehicleInfo.plateNumber}</Text>
              </View>

              {vehicleInfo.name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Owner/Visitor</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.name}</Text>
                </View>
              )}

              {vehicleInfo.vehicleCategory && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Vehicle Category</Text>
                  <Text style={styles.infoValue}>
                    {vehicleInfo.vehicleCategory.charAt(0).toUpperCase() +
                      vehicleInfo.vehicleCategory.slice(1)}
                  </Text>
                </View>
              )}

              {vehicleInfo.gpsId && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>GPS ID</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.gpsId}</Text>
                </View>
              )}

              {vehicleInfo.hostName && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Host Name</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.hostName}</Text>
                </View>
              )}

              {vehicleInfo.hostPhone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Host Phone</Text>
                  <Text style={styles.infoValue}>{vehicleInfo.hostPhone}</Text>
                </View>
              )}
            </View>

            {vehicleInfo.hostPhone && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCallHost(vehicleInfo.hostPhone!)}
                >
                  <Text style={styles.actionButtonText}>Call Host</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.smsButton]}
                  onPress={() => handleSendSMS(vehicleInfo.hostPhone!)}
                >
                  <Text style={styles.actionButtonText}>Send SMS</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.violationsCard}>
              <View style={styles.violationsHeader}>
                <Text style={styles.sectionTitle}>Violation History</Text>
                <View style={styles.violationCountBadge}>
                  <Text style={styles.violationCountText}>
                    {vehicleInfo.violationCount}
                  </Text>
                </View>
              </View>

              {vehicleInfo.violations.length === 0 ? (
                <Text style={styles.noViolationsText}>No violations recorded</Text>
              ) : (
                <FlatList
                  data={vehicleInfo.violations}
                  renderItem={renderViolationItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: "row",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  searchButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  searchButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  resultContainer: {
    gap: 16,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  smsButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  violationsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  violationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  violationCountBadge: {
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  violationCountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  noViolationsText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    padding: 20,
  },
  violationCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B35",
  },
  violationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  violationType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  violationDate: {
    fontSize: 12,
    color: "#666",
  },
  violationLocation: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  violationStatus: {
    fontSize: 12,
    color: "#999",
  },
});

