import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getViolations,
  subscribeToViolations,
  updateViolationStatus,
  Violation,
  ViolationStatus,
} from "../services/violations";
import type { Unsubscribe } from "firebase/firestore";

export default function EscalationCases() {
  const router = useRouter();
  const [cases, setCases] = useState<Violation[]>([]);
  const [filteredCases, setFilteredCases] = useState<Violation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ViolationStatus | "all">(
    "all"
  );

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe: Unsubscribe = subscribeToViolations(
      {
        status: ViolationStatus.ESCALATED,
      },
      (violations) => {
        setCases(violations);
        applyFilters(violations, searchQuery, statusFilter);
        setIsLoading(false);
        setRefreshing(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    applyFilters(cases, searchQuery, statusFilter);
  }, [searchQuery, statusFilter]);

  const applyFilters = (
    violations: Violation[],
    search: string,
    status: ViolationStatus | "all"
  ) => {
    let filtered = violations;

    // Status filter
    if (status !== "all") {
      filtered = filtered.filter((v) => v.status === status);
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.plateNumber.toLowerCase().includes(searchLower) ||
          v.location.toLowerCase().includes(searchLower) ||
          (v.hostName && v.hostName.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCases(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const violations = await getViolations({
        status: ViolationStatus.ESCALATED,
      });
      setCases(violations);
      applyFilters(violations, searchQuery, statusFilter);
    } catch (error: any) {
      Alert.alert("Error", "Failed to refresh cases");
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusColor = (status: ViolationStatus) => {
    switch (status) {
      case ViolationStatus.ESCALATED:
        return "#FF6B35";
      case ViolationStatus.RESOLVED:
        return "#4CAF50";
      case ViolationStatus.HOST_COMPLIED:
        return "#4CAF50";
      default:
        return "#666";
    }
  };

  const handleCasePress = (violation: Violation) => {
    router.push({
      pathname: "/alert-detail" as any,
      params: { id: violation.id },
    } as any);
  };

  const handleQuickResolve = async (caseId: string) => {
    Alert.alert(
      "Resolve Case",
      "Are you sure you want to mark this case as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: async () => {
            try {
              await updateViolationStatus(
                caseId,
                ViolationStatus.RESOLVED
              );
              Alert.alert("Success", "Case marked as resolved");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to resolve case");
            }
          },
        },
      ]
    );
  };

  const renderCaseItem = ({ item }: { item: Violation }) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => handleCasePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.caseHeader}>
        <View style={styles.plateContainer}>
          <Text style={styles.plateNumber}>{item.plateNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleQuickResolve(item.id);
          }}
        >
          <Text style={styles.quickActionText}>Resolve</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.location}>{item.location}</Text>
      {item.hostName && (
        <Text style={styles.hostName}>Host: {item.hostName}</Text>
      )}
      <Text style={styles.date}>
        Escalated: {formatDate(item.escalatedAt || item.detectedAt)}
      </Text>
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
        <Text style={styles.headerTitle}>Escalation Cases</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by plate, location, host..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === "all" && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter("all")}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === "all" && styles.filterButtonTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === ViolationStatus.ESCALATED &&
                styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(ViolationStatus.ESCALATED)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === ViolationStatus.ESCALATED &&
                  styles.filterButtonTextActive,
              ]}
            >
              Escalated
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredCases.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || statusFilter !== "all"
              ? "No cases match your filters"
              : "No escalation cases"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCases}
          renderItem={renderCaseItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
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
  filtersContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  filterButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  caseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  plateContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  plateNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  quickActionButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  location: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  hostName: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
  },
});

